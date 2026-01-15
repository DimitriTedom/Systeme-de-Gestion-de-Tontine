import { create } from 'zustand';
import { Tontine } from '@/types';

interface TontineStore {
  tontines: Tontine[];
  addTontine: (tontine: Omit<Tontine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTontine: (id: string, tontine: Partial<Tontine>) => void;
  deleteTontine: (id: string) => void;
  getTontineById: (id: string) => Tontine | undefined;
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
  
  addTontine: (tontineData) => {
    const newTontine: Tontine = {
      ...tontineData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ tontines: [...state.tontines, newTontine] }));
  },
  
  updateTontine: (id, tontineData) => {
    set((state) => ({
      tontines: state.tontines.map((tontine) =>
        tontine.id === id
          ? { ...tontine, ...tontineData, updatedAt: new Date() }
          : tontine
      ),
    }));
  },
  
  deleteTontine: (id) => {
    set((state) => ({
      tontines: state.tontines.filter((tontine) => tontine.id !== id),
    }));
  },
  
  getTontineById: (id) => {
    return get().tontines.find((tontine) => tontine.id === id);
  },
}));
