import { create } from 'zustand';
import * as tourService from '@/services/tourService';
import { TourDTO, EligibleBeneficiary } from '@/services/tourService';

// Re-export for convenience
export type Tour = TourDTO;
export type { EligibleBeneficiary };

interface TourStore {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchTours: () => Promise<void>;
  addTour: (tour: Omit<Tour, 'id' | 'beneficiaryName'>) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  
  // Helper async functions
  getEligibleBeneficiaries: (tontineId: string) => Promise<EligibleBeneficiary[]>;
  getNextTourNumber: (tontineId: string) => Promise<number>;
  getSessionTotalContributions: (sessionId: string) => Promise<number>;
  
  // Local state getters
  getTourById: (id: string) => Tour | undefined;
  getToursByTontineId: (tontineId: string) => Tour[];
  getToursBySessionId: (sessionId: string) => Tour[];
  getToursByMemberId: (memberId: string) => Tour[];
  clearError: () => void;
}

export const useTourStore = create<TourStore>((set, get) => ({
  tours: [],
  isLoading: false,
  error: null,

  fetchTours: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await tourService.getAllTours();
      set({ tours: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tours',
        isLoading: false 
      });
    }
  },

  addTour: async (tourData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await tourService.createTour(tourData);
      set((state) => ({ 
        tours: [...state.tours, created],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add tour',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteTour: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tourService.deleteTour(id);
      set((state) => ({
        tours: state.tours.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete tour',
        isLoading: false 
      });
      throw error;
    }
  },

  getEligibleBeneficiaries: async (tontineId) => {
    try {
      return await tourService.getEligibleBeneficiaries(tontineId);
    } catch (error) {
      console.error('Failed to get eligible beneficiaries:', error);
      return [];
    }
  },

  getNextTourNumber: async (tontineId) => {
    try {
      return await tourService.getNextTourNumber(tontineId);
    } catch (error) {
      console.error('Failed to get next tour number:', error);
      return 1;
    }
  },

  getSessionTotalContributions: async (sessionId) => {
    try {
      return await tourService.getSessionTotalContributions(sessionId);
    } catch (error) {
      console.error('Failed to get session contributions:', error);
      return 0;
    }
  },

  getTourById: (id) => {
    return get().tours.find((t) => t.id === id);
  },

  getToursByTontineId: (tontineId) => {
    return get().tours.filter((t) => t.tontineId === tontineId);
  },

  getToursBySessionId: (sessionId) => {
    return get().tours.filter((t) => t.sessionId === sessionId);
  },

  getToursByMemberId: (memberId) => {
    return get().tours.filter((t) => t.beneficiaryId === memberId);
  },

  clearError: () => {
    set({ error: null });
  },
}));
