import { create } from 'zustand';
import { Tontine } from '@/types';
import * as tontineService from '@/services/tontineService';

interface TontineStore {
  tontines: Tontine[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchTontines: () => Promise<void>;
  addTontine: (tontine: Omit<Tontine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTontine: (id: string, tontine: Partial<Tontine>) => Promise<void>;
  deleteTontine: (id: string) => Promise<void>;
  
  // Local state actions
  getTontineById: (id: string) => Tontine | undefined;
  clearError: () => void;
}

// Mock data for initial state
const mockTontines: Tontine[] = [
  {
    id: '1',
    name: 'Tontine des Enseignants',
    description: 'Tontine mensuelle pour les enseignants de l\'Université',
    type: 'presence',
    contributionAmount: 50000,
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    status: 'active',
    memberIds: ['1', '2', '3'],
    adminId: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tontine Solidarité',
    description: 'Tontine hebdomadaire pour entraide communautaire',
    type: 'optional',
    contributionAmount: 10000,
    frequency: 'weekly',
    startDate: new Date('2024-02-01'),
    status: 'active',
    memberIds: ['2', '3', '4', '5'],
    adminId: '2',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Tontine Investissement',
    description: 'Tontine bimensuelle pour projets d\'investissement',
    type: 'presence',
    contributionAmount: 100000,
    frequency: 'biweekly',
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-12-01'),
    status: 'active',
    memberIds: ['1', '4', '5'],
    adminId: '4',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01'),
  },
];

export const useTontineStore = create<TontineStore>((set, get) => ({
  tontines: mockTontines,
  isLoading: false,
  error: null,

  // Fetch all tontines from API
  fetchTontines: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await tontineService.getAllTontines();
      // Transform TontineDTO to Tontine type
      const tontines: Tontine[] = data.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        contributionAmount: t.contributionAmount,
        frequency: t.frequency,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        memberIds: t.memberIds,
        adminId: t.adminId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      set({ tontines, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tontines',
        isLoading: false 
      });
    }
  },

  // Add tontine via API and update local state
  addTontine: async (tontineData) => {
    set({ isLoading: true, error: null });
    try {
      const tontineDTO = {
        name: tontineData.name,
        description: tontineData.description,
        type: tontineData.type,
        contributionAmount: tontineData.contributionAmount,
        frequency: tontineData.frequency,
        startDate: tontineData.startDate,
        endDate: tontineData.endDate,
        status: tontineData.status,
      };
      const created = await tontineService.createTontine(tontineDTO);
      const newTontine: Tontine = {
        id: created.id,
        name: created.name,
        description: created.description,
        type: created.type,
        contributionAmount: created.contributionAmount,
        frequency: created.frequency,
        startDate: created.startDate,
        endDate: created.endDate,
        status: created.status,
        memberIds: tontineData.memberIds,
        adminId: tontineData.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ 
        tontines: [...state.tontines, newTontine],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add tontine',
        isLoading: false 
      });
    }
  },
  
  updateTontine: async (id, tontineData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await tontineService.updateTontine(id, tontineData);
      set((state) => ({
        tontines: state.tontines.map((tontine) =>
          tontine.id === id
            ? { 
                ...tontine, 
                name: updated.name,
                description: updated.description,
                type: updated.type,
                contributionAmount: updated.contributionAmount,
                frequency: updated.frequency,
                startDate: updated.startDate,
                endDate: updated.endDate,
                status: updated.status,
                updatedAt: new Date() 
              }
            : tontine
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update tontine',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTontine: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tontineService.deleteTontine(id);
      set((state) => ({
        tontines: state.tontines.filter((tontine) => tontine.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete tontine',
        isLoading: false 
      });
      throw error;
    }
  },
  
  getTontineById: (id) => {
    return get().tontines.find((tontine) => tontine.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
