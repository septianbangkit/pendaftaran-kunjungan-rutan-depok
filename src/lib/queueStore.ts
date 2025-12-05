// Simple in-memory queue store with localStorage persistence
// Supports two service types: A (Pendaftaran) and B (Informasi)

export type ServiceType = 'A' | 'B';

export interface QueueTicket {
  id: string;
  number: number;
  serviceType: ServiceType;
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
  4: QueueTicket | null;
}

export interface QueueState {
  tickets: QueueTicket[];
  currentNumberA: number; // Counter for A tickets
  currentNumberB: number; // Counter for B tickets
  lastReset: string;
  calledByLoket: CalledByLoket;
}

const STORAGE_KEY = 'queue_state';

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatQueueNumber = (num: number, serviceType: ServiceType): string => {
  return `${serviceType}${String(num).padStart(3, '0')}`;
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
  4: data?.[4] ? parseTicket(data[4]) : null,
});

const getEmptyCalledByLoket = (): CalledByLoket => ({
  1: null,
  2: null,
  3: null,
  4: null,
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
          currentNumberA: 0,
          currentNumberB: 0,
          lastReset: today,
          calledByLoket: getEmptyCalledByLoket(),
        };
      }
      
      // Handle migration from old format
      if (parsed.currentNumber !== undefined && parsed.currentNumberA === undefined) {
        return {
          tickets: parsed.tickets.map((t: any) => ({
            ...parseTicket(t),
            serviceType: 'A',
            formattedNumber: `A${String(t.number).padStart(3, '0')}`,
          })),
          currentNumberA: parsed.currentNumber,
          currentNumberB: 0,
          lastReset: parsed.lastReset,
          calledByLoket: parseCalledByLoket(parsed.calledByLoket),
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
    currentNumberA: 0,
    currentNumberB: 0,
    lastReset: today,
    calledByLoket: getEmptyCalledByLoket(),
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

export const takeNumber = (serviceType: ServiceType): QueueTicket => {
  const state = getInitialState();
  
  let newNumber: number;
  if (serviceType === 'A') {
    newNumber = state.currentNumberA + 1;
    state.currentNumberA = newNumber;
  } else {
    newNumber = state.currentNumberB + 1;
    state.currentNumberB = newNumber;
  }
  
  const ticket: QueueTicket = {
    id: `${getTodayString()}-${serviceType}-${newNumber}`,
    number: newNumber,
    serviceType,
    formattedNumber: formatQueueNumber(newNumber, serviceType),
    createdAt: new Date(),
    status: 'waiting',
  };
  
  state.tickets.push(ticket);
  saveState(state);
  
  return ticket;
};

// Get allowed service types for a loket
const getAllowedServiceType = (loket: number): ServiceType | null => {
  if (loket >= 1 && loket <= 3) return 'A';
  if (loket === 4) return 'B';
  return null;
};

export const callNext = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const allowedType = getAllowedServiceType(loket);
  
  if (!allowedType) return null;
  
  // Filter waiting tickets by service type
  const waiting = state.tickets.filter(t => 
    t.status === 'waiting' && t.serviceType === allowedType
  );
  
  if (waiting.length === 0) return null;
  
  const next = waiting[0];
  next.status = 'called';
  next.loket = loket;
  next.calledAt = new Date();
  
  const loketKey = loket as 1 | 2 | 3 | 4;
  state.calledByLoket[loketKey] = next;
  
  saveState(state);
  return next;
};

export const recallCurrent = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3 | 4;
  
  if (loketKey < 1 || loketKey > 4) return null;
  
  const current = state.calledByLoket[loketKey];
  if (!current) return null;
  
  current.calledAt = new Date();
  state.calledByLoket[loketKey] = current;
  saveState(state);
  
  return current;
};

export const skipCurrent = (loket: number): boolean => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3 | 4;
  
  if (loketKey < 1 || loketKey > 4) return false;
  
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
  const loketKey = loket as 1 | 2 | 3 | 4;
  
  if (loketKey < 1 || loketKey > 4) return false;
  
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

export const getWaitingCount = (serviceType?: ServiceType): number => {
  const state = getInitialState();
  if (serviceType) {
    return state.tickets.filter(t => t.status === 'waiting' && t.serviceType === serviceType).length;
  }
  return state.tickets.filter(t => t.status === 'waiting').length;
};

export const getWaitingTickets = (serviceType: ServiceType): QueueTicket[] => {
  const state = getInitialState();
  return state.tickets.filter(t => t.status === 'waiting' && t.serviceType === serviceType);
};

export const getCalledByLoket = (loket: number): QueueTicket | null => {
  const state = getInitialState();
  const loketKey = loket as 1 | 2 | 3 | 4;
  if (loketKey < 1 || loketKey > 4) return null;
  return state.calledByLoket[loketKey];
};

export const resetQueue = (): void => {
  const today = getTodayString();
  const newState: QueueState = {
    tickets: [],
    currentNumberA: 0,
    currentNumberB: 0,
    lastReset: today,
    calledByLoket: getEmptyCalledByLoket(),
  };
  saveState(newState);
};

export const isLastWaiting = (serviceType: ServiceType): boolean => {
  const state = getInitialState();
  return state.tickets.filter(t => t.status === 'waiting' && t.serviceType === serviceType).length === 0;
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
