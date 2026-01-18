import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Penalite, InsertTables, UpdateTables } from '@/types/database.types';
import { handleSupabaseError, logError } from '@/lib/errorHandler';

interface PenaltyStore {
  penalties: Penalite[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchPenalties: () => Promise<void>;
  fetchPenaltiesByMember: (memberId: string) => Promise<void>;
  fetchPenaltiesBySession: (sessionId: string) => Promise<void>;
  addPenalty: (penalty: InsertTables<'penalite'>) => Promise<Penalite | null>;
  updatePenalty: (id: string, penalty: UpdateTables<'penalite'>) => Promise<void>;
  deletePenalty: (id: string) => Promise<void>;
  
  // Actions spécifiques
  payPenalty: (id: string, amount: number) => Promise<{ success: boolean; remaining: number; status: string }>;
  markAsPaid: (id: string) => Promise<void>;
  cancelPenalty: (id: string) => Promise<void>;
  
  // Getters
  getPenaltyById: (id: string) => Penalite | undefined;
  getPenaltiesByMemberId: (memberId: string) => Penalite[];
  getPenaltiesBySessionId: (sessionId: string) => Penalite[];
  getPendingPenalties: () => Penalite[];
  getPaidPenalties: () => Penalite[];
  getTotalUnpaidAmount: () => number;
  
  // Utilitaires
  clearError: () => void;
}

export const usePenaltyStore = create<PenaltyStore>((set, get) => ({
  penalties: [],
  isLoading: false,
  error: null,

  // Récupérer toutes les pénalités
  fetchPenalties: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('penalite')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      set({ penalties: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des pénalités',
        isLoading: false 
      });
    }
  },

  // Récupérer les pénalités d'un membre
  fetchPenaltiesByMember: async (memberId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('penalite')
        .select('*')
        .eq('id_membre', memberId)
        .order('date', { ascending: false });

      if (error) throw error;

      set({ penalties: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Récupérer les pénalités d'une séance
  fetchPenaltiesBySession: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('penalite')
        .select('*')
        .eq('id_seance', sessionId)
        .order('date', { ascending: false });

      if (error) throw error;

      set({ penalties: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter une pénalité
  addPenalty: async (penaltyData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('penalite')
        .insert(penaltyData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        penalties: [data, ...state.penalties],
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

  // Mettre à jour une pénalité
  updatePenalty: async (id, penaltyData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('penalite')
        .update(penaltyData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        penalties: state.penalties.map((p) => p.id === id ? data : p),
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

  // Supprimer une pénalité
  deletePenalty: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('penalite')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        penalties: state.penalties.filter((p) => p.id !== id),
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

  // Marquer comme payé
  markAsPaid: async (id) => {
    await get().updatePenalty(id, { 
      statut: 'paye',
      date_paiement: new Date().toISOString().split('T')[0],
    });
  },

  // Payer une pénalité (paiement partiel ou total)
  payPenalty: async (id, amount) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .rpc('payer_penalite', {
          id_penalite_param: id,
          montant_paye: amount,
        })
        .single();

      if (error) throw error;

      // Rafraîchir la liste des pénalités
      await get().fetchPenalties();

      set({ isLoading: false });

      return {
        success: true,
        remaining: data.montant_restant,
        status: data.statut,
      };
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur lors du paiement',
        isLoading: false,
      });
      throw error;
    }
  },

  // Annuler une pénalité
  cancelPenalty: async (id) => {
    await get().updatePenalty(id, { statut: 'annule' });
  },

  // Getters
  getPenaltyById: (id) => {
    return get().penalties.find((p) => p.id === id);
  },

  getPenaltiesByMemberId: (memberId) => {
    return get().penalties.filter((p) => p.id_membre === memberId);
  },

  getPenaltiesBySessionId: (sessionId) => {
    return get().penalties.filter((p) => p.id_seance === sessionId);
  },

  getPendingPenalties: () => {
    return get().penalties.filter((p) => p.statut === 'non_paye' || p.statut === 'partiellement_paye');
  },

  getPaidPenalties: () => {
    return get().penalties.filter((p) => p.statut === 'paye');
  },

  getTotalUnpaidAmount: () => {
    return get().penalties
      .filter((p) => p.statut === 'non_paye' || p.statut === 'partiellement_paye')
      .reduce((sum, p) => sum + (p.montant - (p.montant_paye || 0)), 0);
  },

  clearError: () => {
    set({ error: null });
  },
}));
