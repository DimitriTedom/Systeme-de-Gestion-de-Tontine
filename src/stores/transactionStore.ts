import { create } from 'zustand';

export type TransactionType = 
  | 'contribution'      // Money IN: Member contribution during session
  | 'credit_granted'    // Money OUT: Credit given to member
  | 'credit_repayment'  // Money IN: Credit payment received
  | 'penalty'           // Money IN: Penalty payment
  | 'tour_distribution' // Money OUT: Tour/gain distributed
  | 'project_expense'   // Money OUT: Project purchase
  | 'initial_funding'   // Money IN: Initial tontine funding
  | 'adjustment';       // Manual adjustment (+ or -)

export interface Transaction {
  id: string;
  tontineId: string;
  type: TransactionType;
  amount: number;        // Positive for IN, Negative for OUT
  description: string;
  relatedEntityId?: string; // ID of credit, tour, project, etc.
  relatedEntityType?: 'credit' | 'tour' | 'project' | 'session' | 'penalty';
  memberId?: string;     // Member involved in transaction
  sessionId?: string;    // Session where transaction occurred
  createdAt: Date;
  createdBy?: string;    // User who created the transaction
  metadata?: Record<string, any>; // Additional data
}

interface TransactionStore {
  transactions: Transaction[];
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  getTransactionsByTontine: (tontineId: string) => Transaction[];
  getTransactionsByType: (tontineId: string, type: TransactionType) => Transaction[];
  getTontineBalance: (tontineId: string) => number;
  getTransactionHistory: (tontineId: string, limit?: number) => Transaction[];
  canAffordTransaction: (tontineId: string, amount: number) => boolean;
  deleteTransaction: (id: string) => void;
  
  // Utility
  clearTransactions: () => void;
}

const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],

  addTransaction: (transactionData) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    set((state) => ({
      transactions: [...state.transactions, newTransaction],
    }));

    return newTransaction;
  },

  getTransactionsByTontine: (tontineId) => {
    return get().transactions.filter((txn) => txn.tontineId === tontineId);
  },

  getTransactionsByType: (tontineId, type) => {
    return get().transactions.filter(
      (txn) => txn.tontineId === tontineId && txn.type === type
    );
  },

  getTontineBalance: (tontineId) => {
    const transactions = get().getTransactionsByTontine(tontineId);
    return transactions.reduce((balance, txn) => balance + txn.amount, 0);
  },

  getTransactionHistory: (tontineId, limit) => {
    const transactions = get().getTransactionsByTontine(tontineId);
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  canAffordTransaction: (tontineId, amount) => {
    const balance = get().getTontineBalance(tontineId);
    return balance >= amount;
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((txn) => txn.id !== id),
    }));
  },

  clearTransactions: () => {
    set({ transactions: [] });
  },
}));

export { useTransactionStore };
