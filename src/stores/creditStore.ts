import { create } from 'zustand';
import { Credit } from '@/types';
import * as creditService from '@/services/creditService';

interface CreditStore {
  credits: Credit[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchCredits: () => Promise<void>;
  addCredit: (credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  repayCredit: (id: string, amount: number) => Promise<void>;
  
  // Local state actions
  updateCredit: (id: string, credit: Partial<Credit>) => void;
  deleteCredit: (id: string) => void;
  getCreditById: (id: string) => Credit | undefined;
  getCreditsByMemberId: (memberId: string) => Credit[];
  getCreditsByTontineId: (tontineId: string) => Credit[];
  clearError: () => void;
}

export const useCreditStore = create<CreditStore>((set, get) => ({
  credits: [],
  isLoading: false,
  error: null,

  // Fetch all credits from API
  fetchCredits: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await creditService.getAllCredits();
      // Transform DTO to Credit type
      const credits: Credit[] = data.map((c) => ({
        id: c.id,
        tontineId: c.tontineId,
        memberId: c.memberId,
        amount: c.amount,
        interestRate: c.interestRate,
        disbursementDate: c.disbursementDate,
        dueDate: c.dueDate,
        repaymentAmount: c.amount * (1 + c.interestRate / 100),
        amountPaid: c.amount - c.remainingBalance,
        status: c.status,
        purpose: c.purpose,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      set({ credits, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch credits',
        isLoading: false 
      });
    }
  },

  // Add credit via API
  addCredit: async (creditData) => {
    set({ isLoading: true, error: null });
    try {
      const creditDTO = {
        tontineId: creditData.tontineId,
        memberId: creditData.memberId,
        amount: creditData.amount,
        interestRate: creditData.interestRate,
        disbursementDate: creditData.disbursementDate,
        dueDate: creditData.dueDate,
        purpose: creditData.purpose,
      };
      
      const created = await creditService.createCredit(creditDTO);
      
      const newCredit: Credit = {
        id: created.id,
        tontineId: created.tontineId,
        memberId: created.memberId,
        amount: created.amount,
        interestRate: created.interestRate,
        disbursementDate: created.disbursementDate,
        dueDate: created.dueDate,
        repaymentAmount: creditData.repaymentAmount,
        amountPaid: 0,
        status: created.status,
        purpose: created.purpose,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({ 
        credits: [...state.credits, newCredit],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add credit',
        isLoading: false 
      });
      throw error;
    }
  },

  // Repay credit via API
  repayCredit: async (id, amount) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await creditService.repayCredit(id, amount);
      
      set((state) => ({
        credits: state.credits.map((credit) =>
          credit.id === id
            ? {
                ...credit,
                amountPaid: credit.amount - updated.remainingBalance,
                status: updated.status,
                updatedAt: new Date(),
              }
            : credit
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to repay credit',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCredit: (id, creditData) => {
    set((state) => ({
      credits: state.credits.map((credit) =>
        credit.id === id
          ? { ...credit, ...creditData, updatedAt: new Date() }
          : credit
      ),
    }));
  },

  deleteCredit: (id) => {
    set((state) => ({
      credits: state.credits.filter((credit) => credit.id !== id),
    }));
  },

  getCreditById: (id) => {
    return get().credits.find((credit) => credit.id === id);
  },

  getCreditsByMemberId: (memberId) => {
    return get().credits.filter((credit) => credit.memberId === memberId);
  },

  getCreditsByTontineId: (tontineId) => {
    return get().credits.filter((credit) => credit.tontineId === tontineId);
  },

  clearError: () => {
    set({ error: null });
  },
}));
