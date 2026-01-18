import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Membre, InsertTables, UpdateTables } from '@/types/database.types';

interface MemberStore {
  members: Membre[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchMembers: () => Promise<void>;
  addMember: (member: InsertTables<'membre'>) => Promise<Membre | null>;
  updateMember: (id: string, member: UpdateTables<'membre'>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  // Actions spécifiques
  registerToTontine: (memberId: string, tontineId: string, nbParts?: number) => Promise<void>;
  unregisterFromTontine: (memberId: string, tontineId: string) => Promise<void>;
  
  // Getters
  getMemberById: (id: string) => Membre | undefined;
  getActiveMembers: () => Membre[];
  
  // Utilitaires
  clearError: () => void;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  // Récupérer tous les membres
  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('membre')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;

      set({ members: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des membres',
        isLoading: false 
      });
    }
  },

  // Ajouter un membre
  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('membre')
        .insert(memberData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        members: [...state.members, data],
        isLoading: false 
      }));

      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du membre',
        isLoading: false 
      });
      throw error;
    }
  },

  // Mettre à jour un membre
  updateMember: async (id, memberData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('membre')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        members: state.members.map((m) => m.id === id ? data : m),
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

  // Supprimer un membre
  deleteMember: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('membre')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
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

  // Inscrire un membre à une tontine
  registerToTontine: async (memberId, tontineId, nbParts = 1) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('participe')
        .insert({
          id_membre: memberId,
          id_tontine: tontineId,
          nb_parts: nbParts,
        });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription',
        isLoading: false 
      });
      throw error;
    }
  },

  // Désinscrire un membre d'une tontine
  unregisterFromTontine: async (memberId, tontineId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('participe')
        .delete()
        .eq('id_membre', memberId)
        .eq('id_tontine', tontineId);

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la désinscription',
        isLoading: false 
      });
      throw error;
    }
  },

  // Getters
  getMemberById: (id) => {
    return get().members.find((m) => m.id === id);
  },

  getActiveMembers: () => {
    return get().members.filter((m) => m.statut === 'Actif');
  },

  clearError: () => {
    set({ error: null });
  },
}));
