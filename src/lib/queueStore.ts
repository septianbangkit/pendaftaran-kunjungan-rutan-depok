// Simple in-memory queue store with localStorage persistence
// For production, this should be replaced with Supabase/database

export interface QueueTicket {
  id: string;
  number: number;
  formattedNumber: string;
  createdAt: Date;
  status: 'waiting' | 'called' | 'served' | 'skipped';
  loket?: number;
  calledAt?: Date;
}

export interface CalledByLoket {
  1: QueueTicket | null;
  2: QueueTicket | null;
  3: QueueTicket | null;
}

export interface QueueState {
  tickets: QueueTicket[];
  currentNumber: number;
  lastReset: string;
  calledByLoket: CalledByLoket;
}

const STORAGE_KEY = 'queue_state';

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatQueueNumber = (num: number): string => {
  return String(num).padStart(3, '0');
};

const parseTicket = (t: any): QueueTicket => ({
  ...t,
  createdAt: new Date(t.createdAt),
  calledAt: t.calledAt ? new Date(t.calledAt) : undefined,
});

const parseCalledByLoket = (data: any): CalledByLoket => ({
  1: data?.[1] ? parseTicket(data[1]) : null,
  2: data?.[2] ? parseTicket(data[2]) : null,
  3: data?.[3] ? parseTicket(data[3]) : null,
});

export const getInitialState = (): QueueState => {
  const today = getTodayString();
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Reset if it's a new day
      if (parsed.lastReset !== today) {
        return {
          tickets: [],
          currentNumber: 0,
          lastReset: today,
          calledByLoket: { 1: null, 2: null, 3: null },
        };
      }
      
      // Handle migration from old format
      if (parsed.currentCalled && !parsed.calledByLoket) {
        const loket = parsed.currentCalled.loket || 1;
        return {
          tickets: parsed.tickets.map(parseTicket),
          currentNumber: parsed.currentNumber,
          lastReset: parsed.lastReset,
          calledByLoket: {
            1: loket === 1 ? parseTicket(parsed.currentCalled) : null,
            2: loket === 2 ? parseTicket(parsed.currentCalled) : null,
            3: loket === 3 ? parseTicket(parsed.currentCalled) : null,
          },
        };
      }
      
      return {
        ...parsed,
        tickets: parsed.tickets.map(parseTicket),
        calledByLoket: parseCalledByLoket(parsed.calledByLoket),
      };
    } catch {
      // Invalid stored data
    }
  }
  
  return {
    tickets: [],
    currentNumber: 0,
    lastReset: today,
    calledByLoket: { 1: null, 2: null, 3: null },
  };
};

export const saveState = (state: QueueState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Broadcast to other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(state),
  }));
};

export const takeNumber = (): QueueTicket => {
  const state = getInitialState();
  const newNumber = state.currentNumber + 1;
  
  const ticket: QueueTicket = {
    id: `${getTodayString()}-${newNumber}`,
    number: newNumber,
    formattedNumber: formatQueueNumber(newNumber),
    createdAt: new Date(),
    status: 'waiting',
  };
  
  state.tickets.push(ticket);
  state.currentNumber = newNumber;
  saveState(state);
  
  return ticket;
};

export const callNext = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const waiting = state.tickets.filter(t => t.status === 'waiting');
  
  if (waiting.length === 0) return null;
  
  const next = waiting[0];
  next.status = 'called';
  next.loket = loket;
  next.calledAt = new Date();
  
  const loketKey = loket as 1 | 2 | 3;
  if (loketKey >= 1 && loketKey <= 3) {
    state.calledByLoket[loketKey] = next;
  }
  
  saveState(state);
  return next;
};

export const recallCurrent = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3;
  
  if (loketKey < 1 || loketKey > 3) return null;
  
  const current = state.calledByLoket[loketKey];
  if (!current) return null;
  
  current.calledAt = new Date();
  state.calledByLoket[loketKey] = current;
  saveState(state);
  
  return current;
};

export const skipCurrent = (loket: number): boolean => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3;
  
  if (loketKey < 1 || loketKey > 3) return false;
  
  const current = state.calledByLoket[loketKey];
  if (!current) return false;
  
  const ticket = state.tickets.find(t => t.id === current.id);
  if (ticket) {
    ticket.status = 'skipped';
  }
  
  state.calledByLoket[loketKey] = null;
  saveState(state);
  
  return true;
};

export const markServed = (loket: number): boolean => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3;
  
  if (loketKey < 1 || loketKey > 3) return false;
  
  const current = state.calledByLoket[loketKey];
  if (!current) return false;
  
  const ticket = state.tickets.find(t => t.id === current.id);
  if (ticket) {
    ticket.status = 'served';
  }
  
  state.calledByLoket[loketKey] = null;
  saveState(state);
  
  return true;
};

export const getWaitingCount = (): number => {
  const state = getInitialState();
  return state.tickets.filter(t => t.status === 'waiting').length;
};

export const getCalledByLoket = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3;
  if (loketKey < 1 || loketKey > 3) return null;
  return state.calledByLoket[loketKey];
};

export const subscribeToChanges = (callback: (state: QueueState) => void) => {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback({
          ...parsed,
          tickets: parsed.tickets.map(parseTicket),
          calledByLoket: parseCalledByLoket(parsed.calledByLoket),
        });
      } catch {
        // Invalid data
      }
    }
  };
  
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};
