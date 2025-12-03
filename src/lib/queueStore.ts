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

export interface QueueState {
  tickets: QueueTicket[];
  currentNumber: number;
  lastReset: string;
  currentCalled: QueueTicket | null;
}

const STORAGE_KEY = 'queue_state';

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatQueueNumber = (num: number): string => {
  return String(num).padStart(3, '0');
};

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
          currentCalled: null,
        };
      }
      return {
        ...parsed,
        tickets: parsed.tickets.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          calledAt: t.calledAt ? new Date(t.calledAt) : undefined,
        })),
        currentCalled: parsed.currentCalled ? {
          ...parsed.currentCalled,
          createdAt: new Date(parsed.currentCalled.createdAt),
          calledAt: parsed.currentCalled.calledAt ? new Date(parsed.currentCalled.calledAt) : undefined,
        } : null,
      };
    } catch {
      // Invalid stored data
    }
  }
  
  return {
    tickets: [],
    currentNumber: 0,
    lastReset: today,
    currentCalled: null,
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
  
  state.currentCalled = next;
  saveState(state);
  
  return next;
};

export const recallCurrent = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  if (!state.currentCalled) return null;
  
  state.currentCalled.calledAt = new Date();
  state.currentCalled.loket = loket;
  saveState(state);
  
  return state.currentCalled;
};

export const skipCurrent = (): boolean => {
  const state = getInitialState();
  if (!state.currentCalled) return false;
  
  const ticket = state.tickets.find(t => t.id === state.currentCalled?.id);
  if (ticket) {
    ticket.status = 'skipped';
  }
  
  state.currentCalled = null;
  saveState(state);
  
  return true;
};

export const markServed = (): boolean => {
  const state = getInitialState();
  if (!state.currentCalled) return false;
  
  const ticket = state.tickets.find(t => t.id === state.currentCalled?.id);
  if (ticket) {
    ticket.status = 'served';
  }
  
  state.currentCalled = null;
  saveState(state);
  
  return true;
};

export const getWaitingCount = (): number => {
  const state = getInitialState();
  return state.tickets.filter(t => t.status === 'waiting').length;
};

export const getCurrentCalled = (): QueueTicket | null => {
  const state = getInitialState();
  return state.currentCalled;
};

export const subscribeToChanges = (callback: (state: QueueState) => void) => {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback({
          ...parsed,
          tickets: parsed.tickets.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            calledAt: t.calledAt ? new Date(t.calledAt) : undefined,
          })),
          currentCalled: parsed.currentCalled ? {
            ...parsed.currentCalled,
            createdAt: new Date(parsed.currentCalled.createdAt),
            calledAt: parsed.currentCalled.calledAt ? new Date(parsed.currentCalled.calledAt) : undefined,
          } : null,
        });
      } catch {
        // Invalid data
      }
    }
  };
  
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};
