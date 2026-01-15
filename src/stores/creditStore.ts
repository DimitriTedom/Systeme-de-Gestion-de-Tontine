import { create } from 'zustand';
import { Credit } from '@/types';

interface CreditStore {
  credits: Credit[];
  addCredit: (credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCredit: (id: string, credit: Partial<Credit>) => void;
  deleteCredit: (id: string) => void;
  getCreditById: (id: string) => Credit | undefined;
  getCreditsByMemberId: (memberId: string) => Credit[];
  getCreditsByTontineId: (tontineId: string) => Credit[];
}

// Mock data for credits
const mockCredits: Credit[] = [
  {
    id: 'credit-1',
    tontineId: 'tontine-1',
    memberId: 'member-1',
    amount: 500000,
    interestRate: 5,
    disbursementDate: new Date('2025-12-01'),
    dueDate: new Date('2026-06-01'),
    repaymentAmount: 525000,
    amountPaid: 200000,
    status: 'repaying',
    purpose: 'Achat de matériel agricole',
    createdAt: new Date('2025-11-20'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'credit-2',
    tontineId: 'tontine-1',
    memberId: 'member-2',
    amount: 300000,
    interestRate: 4,
    disbursementDate: new Date('2025-11-15'),
    dueDate: new Date('2026-05-15'),
    repaymentAmount: 312000,
    amountPaid: 312000,
    status: 'completed',
    purpose: 'Frais médicaux',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2026-01-05'),
  },
  {
    id: 'credit-3',
    tontineId: 'tontine-2',
    memberId: 'member-3',
    amount: 750000,
    interestRate: 6,
    disbursementDate: new Date('2026-01-01'),
    dueDate: new Date('2026-07-01'),
    repaymentAmount: 795000,
    amountPaid: 0,
    status: 'disbursed',
    purpose: 'Expansion commerce',
    guarantorIds: ['member-1', 'member-4'],
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'credit-4',
    tontineId: 'tontine-1',
    memberId: 'member-5',
    amount: 200000,
    interestRate: 3,
    disbursementDate: new Date('2025-10-01'),
    dueDate: new Date('2026-04-01'),
    repaymentAmount: 206000,
    amountPaid: 150000,
    status: 'repaying',
    purpose: 'Scolarité des enfants',
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2026-01-12'),
  },
];

export const useCreditStore = create<CreditStore>((set, get) => ({
  credits: mockCredits,

  addCredit: (creditData) => {
    const newCredit: Credit = {
      ...creditData,
      id: `credit-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ credits: [...state.credits, newCredit] }));
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
}));
