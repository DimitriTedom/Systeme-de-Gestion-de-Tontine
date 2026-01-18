import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Tontine, InsertTables, UpdateTables, Participe } from '@/types/database.types';

interface TontineWithMembers extends Tontine {
  membres_count?: number;
  participations?: Participe[];
}

interface TontineStore {
  tontines: TontineWithMembers[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchTontines: () => Promise<void>;
  fetchTontinesWithStats: () => Promise<void>;
  addTontine: (tontine: InsertTables<'tontine'>) => Promise<Tontine | null>;
  updateTontine: (id: string, tontine: UpdateTables<'tontine'>) => Promise<void>;
  deleteTontine: (id: string) => Promise<void>;
  
  // Actions spécifiques
  getTontineMembers: (tontineId: string) => Promise<Array<{
    id_membre: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    nb_parts: number;
  }>>;
  
  // Getters
  getTontineById: (id: string) => TontineWithMembers | undefined;
  getActiveTontines: () => TontineWithMembers[];
  
  // Utilitaires
  clearError: () => void;
}

export const useTontineStore = create<TontineStore>((set, get) => ({
  tontines: [],
  isLoading: false,
  error: null,

  // Récupérer toutes les tontines
  fetchTontines: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('tontine')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;

      set({ tontines: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des tontines',
        isLoading: false 
      });
    }
  },

  // Récupérer les tontines avec statistiques
  fetchTontinesWithStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Récupérer les tontines
      const { data: tontines, error: tontinesError } = await supabase
        .from('tontine')
        .select('*')
        .order('date_debut', { ascending: false });

      if (tontinesError) throw tontinesError;

      // Pour chaque tontine, compter les membres
      const tontinesWithCount = await Promise.all(
        (tontines || []).map(async (t) => {
          const { count } = await supabase
            .from('participe')
            .select('*', { count: 'exact', head: true })
            .eq('id_tontine', t.id)
            .eq('statut', 'actif');

          return {
            ...t,
            membres_count: count || 0,
          };
        })
      );

      set({ tontines: tontinesWithCount, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter une tontine
  addTontine: async (tontineData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('tontine')
        .insert(tontineData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        tontines: [{ ...data, membres_count: 0 }, ...state.tontines],
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

  // Mettre à jour une tontine
  updateTontine: async (id, tontineData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('tontine')
        .update(tontineData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tontines: state.tontines.map((t) => t.id === id ? { ...t, ...data } : t),
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

  // Supprimer une tontine
  deleteTontine: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('tontine')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tontines: state.tontines.filter((t) => t.id !== id),
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

  // Récupérer les membres d'une tontine
  getTontineMembers: async (tontineId) => {
    try {
      const { data, error } = await supabase
        .from('participe')
        .select(`
          id_membre,
          nb_parts,
          membre:id_membre (
            id,
            nom,
            prenom,
            email,
            telephone
          )
        `)
        .eq('id_tontine', tontineId)
        .eq('statut', 'actif');

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id_membre: p.id_membre,
        nom: p.membre.nom,
        prenom: p.membre.prenom,
        email: p.membre.email,
        telephone: p.membre.telephone,
        nb_parts: p.nb_parts,
      }));
    } catch (error) {
      console.error('Erreur getTontineMembers:', error);
      return [];
    }
  },

  // Getters
  getTontineById: (id) => {
    return get().tontines.find((t) => t.id === id);
  },

  getActiveTontines: () => {
    return get().tontines.filter((t) => t.statut === 'Actif');
  },

  clearError: () => {
    set({ error: null });
  },
}));
