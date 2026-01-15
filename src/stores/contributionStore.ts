import { create } from 'zustand';
import { Contribution } from '@/types';

interface ContributionStore {
  contributions: Contribution[];
  addContribution: (contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContribution: (id: string, contribution: Partial<Contribution>) => void;
  deleteContribution: (id: string) => void;
  getContributionsBySessionId: (sessionId: string) => Contribution[];
  getContributionsByMemberId: (memberId: string) => Contribution[];
  bulkUpsertContributions: (contributions: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

// Mock data for initial state
const mockContributions: Contribution[] = [
  // Session 1 - Tontine 1
  {
    id: '1',
    sessionId: '1',
    memberId: '1',
    tontineId: '1',
    amount: 50000,
    expectedAmount: 50000,
    paymentDate: new Date('2024-01-15'),
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    sessionId: '1',
    memberId: '2',
    tontineId: '1',
    amount: 50000,
    expectedAmount: 50000,
    paymentDate: new Date('2024-01-15'),
    paymentMethod: 'mobile_money',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    sessionId: '1',
    memberId: '3',
    tontineId: '1',
    amount: 50000,
    expectedAmount: 50000,
    paymentDate: new Date('2024-01-15'),
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  // Session 2 - Tontine 2
  {
    id: '4',
    sessionId: '2',
    memberId: '2',
    tontineId: '2',
    amount: 10000,
    expectedAmount: 10000,
    paymentDate: new Date('2024-02-05'),
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '5',
    sessionId: '2',
    memberId: '3',
    tontineId: '2',
    amount: 10000,
    expectedAmount: 10000,
    paymentDate: new Date('2024-02-05'),
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '6',
    sessionId: '2',
    memberId: '4',
    tontineId: '2',
    amount: 10000,
    expectedAmount: 10000,
    paymentDate: new Date('2024-02-05'),
    paymentMethod: 'mobile_money',
    status: 'completed',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '7',
    sessionId: '2',
    memberId: '5',
    tontineId: '2',
    amount: 10000,
    expectedAmount: 10000,
    paymentDate: new Date('2024-02-05'),
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
];

export const useContributionStore = create<ContributionStore>((set, get) => ({
  contributions: mockContributions,
  
  addContribution: (contributionData) => {
    const newContribution: Contribution = {
      ...contributionData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ contributions: [...state.contributions, newContribution] }));
  },
  
  updateContribution: (id, contributionData) => {
    set((state) => ({
      contributions: state.contributions.map((contribution) =>
        contribution.id === id
          ? { ...contribution, ...contributionData, updatedAt: new Date() }
          : contribution
      ),
    }));
  },
  
  deleteContribution: (id) => {
    set((state) => ({
      contributions: state.contributions.filter((contribution) => contribution.id !== id),
    }));
  },
  
  getContributionsBySessionId: (sessionId) => {
    return get().contributions.filter((contribution) => contribution.sessionId === sessionId);
  },
  
  getContributionsByMemberId: (memberId) => {
    return get().contributions.filter((contribution) => contribution.memberId === memberId);
  },
  
  bulkUpsertContributions: (contributionsData) => {
    const newContributions: Contribution[] = contributionsData.map(data => ({
      ...data,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    set((state) => ({ 
      contributions: [...state.contributions, ...newContributions]
    }));
  },
}));
