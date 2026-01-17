import { create } from 'zustand';
import * as penaltyService from '@/services/penaltyService';
import { PenaltyDTO } from '@/services/penaltyService';

// Re-export for convenience
export type Penalty = PenaltyDTO;

interface PenaltyStore {
  penalties: Penalty[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchPenalties: () => Promise<void>;
  addPenalty: (penalty: Omit<Penalty, 'id'>) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  deletePenalty: (id: string) => Promise<void>;
  
  // Local state getters
  getPenaltyById: (id: string) => Penalty | undefined;
  getPenaltiesByMemberId: (memberId: string) => Penalty[];
  getPenaltiesBySessionId: (sessionId: string) => Penalty[];
  getPenaltiesByTontineId: (tontineId: string) => Penalty[];
  getPendingPenalties: () => Penalty[];
  getPaidPenalties: () => Penalty[];
  clearError: () => void;
}

export const usePenaltyStore = create<PenaltyStore>((set, get) => ({
  penalties: [],
  isLoading: false,
  error: null,

  fetchPenalties: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await penaltyService.getAllPenalties();
      set({ penalties: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch penalties',
        isLoading: false 
      });
    }
  },

  addPenalty: async (penaltyData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await penaltyService.createPenalty(penaltyData);
      set((state) => ({ 
        penalties: [...state.penalties, created],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add penalty',
        isLoading: false 
      });
      throw error;
    }
  },

  markAsPaid: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await penaltyService.markPenaltyAsPaid(id);
      set((state) => ({
        penalties: state.penalties.map((p) =>
          p.id === id ? updated : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update penalty',
        isLoading: false 
      });
      throw error;
    }
  },

  deletePenalty: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await penaltyService.deletePenalty(id);
      set((state) => ({
        penalties: state.penalties.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete penalty',
        isLoading: false 
      });
      throw error;
    }
  },

  getPenaltyById: (id) => {
    return get().penalties.find((p) => p.id === id);
  },

  getPenaltiesByMemberId: (memberId) => {
    return get().penalties.filter((p) => p.memberId === memberId);
  },

  getPenaltiesBySessionId: (sessionId) => {
    return get().penalties.filter((p) => p.sessionId === sessionId);
  },

  getPenaltiesByTontineId: (tontineId) => {
    return get().penalties.filter((p) => p.tontineId === tontineId);
  },

  getPendingPenalties: () => {
    return get().penalties.filter((p) => p.status === 'pending');
  },

  getPaidPenalties: () => {
    return get().penalties.filter((p) => p.status === 'paid');
  },

  clearError: () => {
    set({ error: null });
  },
}));
