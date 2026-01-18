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

export const useContributionStore = create<ContributionStore>((set, get) => ({
  contributions: [],
  
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
