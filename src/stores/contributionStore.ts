import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Cotisation, InsertTables, UpdateTables } from '@/types/database.types';
import { handleSupabaseError, logError } from '@/lib/errorHandler';

interface ContributionStore {
  contributions: Cotisation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchContributions: () => Promise<void>;
  fetchContributionsBySession: (sessionId: string) => Promise<void>;
  fetchContributionsByMember: (memberId: string) => Promise<void>;
  addContribution: (contribution: InsertTables<'cotisation'>) => Promise<Cotisation | null>;
  updateContribution: (id: string, contribution: UpdateTables<'cotisation'>) => Promise<void>;
  deleteContribution: (id: string) => Promise<void>;
  
  // Actions spécifiques
  bulkUpsertContributions: (
    sessionId: string,
    contributions: Array<{
      memberId: string;
      amount: number;
      expectedAmount: number;
    }>
  ) => Promise<void>;
  
  // Getters
  getContributionsBySessionId: (sessionId: string) => Cotisation[];
  getContributionsByMemberId: (memberId: string) => Cotisation[];
  getTotalBySession: (sessionId: string) => number;
  
  // Utilitaires
  clearError: () => void;
}

export const useContributionStore = create<ContributionStore>((set, get) => ({
  contributions: [],
  isLoading: false,
  error: null,

  // Récupérer toutes les cotisations
  fetchContributions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .select('*')
        .order('date_paiement', { ascending: false });

      if (error) throw error;

      set({ contributions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des cotisations',
        isLoading: false 
      });
    }
  },

  // Récupérer les cotisations d'une séance
  fetchContributionsBySession: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .select('*')
        .eq('id_seance', sessionId)
        .order('date_paiement', { ascending: false });

      if (error) throw error;

      set({ contributions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Récupérer les cotisations d'un membre
  fetchContributionsByMember: async (memberId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .select('*')
        .eq('id_membre', memberId)
        .order('date_paiement', { ascending: false });

      if (error) throw error;

      set({ contributions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter une cotisation
  addContribution: async (contributionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .insert(contributionData)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer la transaction de cotisation (argent entrant)
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      transactionStore.addTransaction({
        id_tontine: contributionData.id_tontine,
        type: 'contribution',
        montant: contributionData.montant, // Positif car c'est une entrée d'argent
        description: 'Cotisation membre',
        id_membre: contributionData.id_membre,
        id_seance: contributionData.id_seance,
      });

      set((state) => ({ 
        contributions: [data, ...state.contributions],
        isLoading: false 
      }));

      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout',
        isLoading: false 
      });
      throw error;
    }
  },

  // Mettre à jour une cotisation
  updateContribution: async (id, contributionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .update(contributionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        contributions: state.contributions.map((c) => c.id === id ? data : c),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        isLoading: false 
      });
      throw error;
    }
  },

  // Supprimer une cotisation
  deleteContribution: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('cotisation')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        contributions: state.contributions.filter((c) => c.id !== id),
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

  // Upsert en masse (pour la feuille de séance)
  bulkUpsertContributions: async (sessionId, contributions) => {
    set({ isLoading: true, error: null });
    
    try {
      // Récupérer la séance pour avoir l'id_tontine
      const { data: session, error: sessionError } = await supabase
        .from('seance')
        .select('id_tontine')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Préparer les données pour upsert
      const upsertData = contributions.map((c) => ({
        id_membre: c.memberId,
        id_seance: sessionId,
        id_tontine: session.id_tontine,
        montant: c.amount,
        montant_attendu: c.expectedAmount,
        statut: c.amount >= c.expectedAmount ? 'complete' : c.amount > 0 ? 'partiel' : 'en_attente',
      }));

      const { error } = await supabase
        .from('cotisation')
        .upsert(upsertData, {
          onConflict: 'id_membre,id_seance',
        });

      if (error) throw error;

      // Enregistrer les transactions pour chaque cotisation
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      
      contributions.forEach((contrib) => {
        if (contrib.amount > 0) {
          transactionStore.addTransaction({
            id_tontine: session.id_tontine,
            type: 'contribution',
            montant: contrib.amount,
            description: 'Cotisation séance',
            id_membre: contrib.memberId,
            id_seance: sessionId,
          });
        }
      });

      // Recharger les cotisations de la séance
      await get().fetchContributionsBySession(sessionId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
        isLoading: false 
      });
      throw error;
    }
  },

  // Getters
  getContributionsBySessionId: (sessionId) => {
    return get().contributions.filter((c) => c.id_seance === sessionId);
  },

  getContributionsByMemberId: (memberId) => {
    return get().contributions.filter((c) => c.id_membre === memberId);
  },

  getTotalBySession: (sessionId) => {
    return get().contributions
      .filter((c) => c.id_seance === sessionId)
      .reduce((sum, c) => sum + c.montant, 0);
  },

  clearError: () => {
    set({ error: null });
  },
}));
