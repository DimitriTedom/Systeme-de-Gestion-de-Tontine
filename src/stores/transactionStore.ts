import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Transaction, InsertTransaction, TransactionEnrichie, TontineFinancialSummary } from '@/types/database.types';

export type TransactionType = 
  | 'contribution'      // Money IN: Member contribution during session
  | 'credit_granted'    // Money OUT: Credit given to member
  | 'credit_repayment'  // Money IN: Credit payment received
  | 'penalty'           // Money IN: Penalty payment
  | 'tour_distribution' // Money OUT: Tour/gain distributed
  | 'project_expense'   // Money OUT: Project purchase
  | 'initial_funding'   // Money IN: Initial tontine funding
  | 'adjustment';       // Manual adjustment (+ or -)

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchTransactions: (tontineId?: string) => Promise<void>;
  fetchTransactionsEnrichies: (tontineId?: string) => Promise<TransactionEnrichie[]>;
  addTransaction: (transaction: InsertTransaction) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Actions spécifiques
  getTransactionsByTontine: (tontineId: string) => Transaction[];
  getTransactionsByType: (tontineId: string, type: TransactionType) => Transaction[];
  getTontineBalance: (tontineId: string) => Promise<number>;
  getTontineFinancialSummary: (tontineId: string) => Promise<TontineFinancialSummary | null>;
  getTransactionHistory: (tontineId: string, limit?: number) => Transaction[];
  canAffordTransaction: (tontineId: string, amount: number) => Promise<boolean>;
  
  // Utility
  clearError: () => void;
}

const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  // Récupérer toutes les transactions (ou par tontine)
  fetchTransactions: async (tontineId) => {
    set({ isLoading: true, error: null });
    
    try {
      let query = supabase
        .from('transaction')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tontineId) {
        query = query.eq('id_tontine', tontineId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ transactions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des transactions',
        isLoading: false 
      });
    }
  },

  // Récupérer les transactions enrichies avec toutes les infos
  fetchTransactionsEnrichies: async (tontineId) => {
    set({ isLoading: true, error: null });
    
    try {
      let query = supabase
        .from('v_transactions_enrichies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tontineId) {
        query = query.eq('id_tontine', tontineId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ isLoading: false });
      return data || [];
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
      return [];
    }
  },

  // Ajouter une transaction
  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('transaction')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        transactions: [data, ...state.transactions],
        isLoading: false 
      }));

      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la transaction',
        isLoading: false 
      });
      throw error;
    }
  },

  // Supprimer une transaction
  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('transaction')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        isLoading: false 
      });
      throw error;
    }
  },

  // Obtenir les transactions d'une tontine (depuis le state local)
  getTransactionsByTontine: (tontineId) => {
    return get().transactions.filter((txn) => txn.id_tontine === tontineId);
  },

  // Obtenir les transactions par type
  getTransactionsByType: (tontineId, type) => {
    return get().transactions.filter(
      (txn) => txn.id_tontine === tontineId && txn.type === type
    );
  },

  // Calculer le solde d'une tontine (depuis la DB avec fonction SQL)
  getTontineBalance: async (tontineId) => {
    try {
      const { data, error } = await supabase
        .rpc('calculer_solde_tontine', { id_tontine_param: tontineId });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Erreur calcul solde:', error);
      return 0;
    }
  },

  // Obtenir le résumé financier complet d'une tontine
  getTontineFinancialSummary: async (tontineId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_tontine_financial_summary', { id_tontine_param: tontineId })
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erreur résumé financier:', error);
      return null;
    }
  },

  // Historique des transactions (trié par date)
  getTransactionHistory: (tontineId, limit) => {
    const transactions = get().getTransactionsByTontine(tontineId);
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  // Vérifier si une tontine peut se permettre une dépense
  canAffordTransaction: async (tontineId, amount) => {
    const balance = await get().getTontineBalance(tontineId);
    return balance >= amount;
  },

  clearError: () => {
    set({ error: null });
  },
}));

export { useTransactionStore };
