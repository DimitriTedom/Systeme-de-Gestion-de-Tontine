import { create } from 'zustand';
import { Penalty } from '@/types';

interface PenaltyStore {
  penalties: Penalty[];
  addPenalty: (penalty: Omit<Penalty, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePenalty: (id: string, penalty: Partial<Penalty>) => void;
  deletePenalty: (id: string) => void;
  getPenaltyById: (id: string) => Penalty | undefined;
  getPenaltiesByMemberId: (memberId: string) => Penalty[];
  getPenaltiesBySessionId: (sessionId: string) => Penalty[];
  getPenaltiesByTontineId: (tontineId: string) => Penalty[];
}

// Mock data for penalties
const mockPenalties: Penalty[] = [
  {
    id: 'penalty-1',
    sessionId: 'session-1',
    memberId: 'member-3',
    tontineId: 'tontine-1',
    amount: 5000,
    reason: 'Absence injustifiée à la session',
    penaltyType: 'absence',
    status: 'paid',
    paymentDate: new Date('2026-01-05'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-05'),
  },
  {
    id: 'penalty-2',
    sessionId: 'session-2',
    memberId: 'member-4',
    tontineId: 'tontine-1',
    amount: 5000,
    reason: 'Absence injustifiée à la session',
    penaltyType: 'absence',
    status: 'pending',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
  },
  {
    id: 'penalty-3',
    sessionId: 'session-3',
    memberId: 'member-2',
    tontineId: 'tontine-2',
    amount: 3000,
    reason: 'Retard de cotisation',
    penaltyType: 'late_contribution',
    status: 'pending',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
];

export const usePenaltyStore = create<PenaltyStore>((set, get) => ({
  penalties: mockPenalties,

  addPenalty: (penaltyData) => {
    const newPenalty: Penalty = {
      ...penaltyData,
      id: `penalty-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ penalties: [...state.penalties, newPenalty] }));
  },

  updatePenalty: (id, penaltyData) => {
    set((state) => ({
      penalties: state.penalties.map((penalty) =>
        penalty.id === id
          ? { ...penalty, ...penaltyData, updatedAt: new Date() }
          : penalty
      ),
    }));
  },

  deletePenalty: (id) => {
    set((state) => ({
      penalties: state.penalties.filter((penalty) => penalty.id !== id),
    }));
  },

  getPenaltyById: (id) => {
    return get().penalties.find((penalty) => penalty.id === id);
  },

  getPenaltiesByMemberId: (memberId) => {
    return get().penalties.filter((penalty) => penalty.memberId === memberId);
  },

  getPenaltiesBySessionId: (sessionId) => {
    return get().penalties.filter((penalty) => penalty.sessionId === sessionId);
  },

  getPenaltiesByTontineId: (tontineId) => {
    return get().penalties.filter((penalty) => penalty.tontineId === tontineId);
  },
}));
