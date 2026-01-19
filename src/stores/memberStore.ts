import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Membre, InsertTables, UpdateTables } from '@/types/database.types';
import { handleSupabaseError, logError } from '@/lib/errorHandler';

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

  // Ajouter un membre (avec optimistic UI)
  addMember: async (memberData) => {
    // Optimistic update: add member immediately with temporary ID
    const optimisticMember: Membre = {
      ...memberData,
      id: `temp-${Date.now()}`, // Temporary ID
      created_at: new Date().toISOString(),
    } as Membre;

    set((state) => ({ 
      members: [...state.members, optimisticMember],
      isLoading: true,
      error: null,
    }));
    
    try {
      const { data, error } = await supabase
        .from('membre')
        .insert(memberData)
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic member with real data
      set((state) => ({ 
        members: state.members.map(m => 
          m.id === optimisticMember.id ? data : m
        ),
        isLoading: false 
      }));

      return data;
    } catch (error) {
      // Rollback optimistic update on error
      set((state) => ({
        members: state.members.filter(m => m.id !== optimisticMember.id),
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du membre',
        isLoading: false,
      }));
      logError('addMember', error);
      const errorDetails = handleSupabaseError(error);
      throw error;
    }
  },

  // Mettre à jour un membre (avec optimistic UI)
  updateMember: async (id, memberData) => {
    // Store previous state for rollback
    const previousMember = get().members.find(m => m.id === id);
    
    // Optimistic update
    set((state) => ({
      members: state.members.map((m) => 
        m.id === id ? { ...m, ...memberData } as Membre : m
      ),
      isLoading: true,
      error: null,
    }));
    
    try {
      const { data, error } = await supabase
        .from('membre')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with server response
      set((state) => ({
        members: state.members.map((m) => m.id === id ? data : m),
        isLoading: false,
      }));
    } catch (error) {
      // Rollback to previous state on error
      if (previousMember) {
        set((state) => ({
          members: state.members.map((m) => m.id === id ? previousMember : m),
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
          isLoading: false,
        }));
      }
      logError('updateMember', error);
      const errorDetails = handleSupabaseError(error);
      throw error;
    }
  },

  // Supprimer un membre (avec optimistic UI)
  deleteMember: async (id) => {
    // Store previous state for rollback
    const previousMember = get().members.find(m => m.id === id);
    
    // Optimistic delete
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
      isLoading: true,
      error: null,
    }));
    
    try {
      const { error } = await supabase
        .from('membre')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      // Rollback - restore deleted member on error
      if (previousMember) {
        set((state) => ({
          members: [...state.members, previousMember],
          error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
          isLoading: false,
        }));
      }
      logError('deleteMember', error);
      const errorDetails = handleSupabaseError(error);
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
      logError('registerToTontine', error);
      const errorDetails = handleSupabaseError(error);
      set({ 
        error: errorDetails.message,
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
      logError('unregisterFromTontine', error);
      const errorDetails = handleSupabaseError(error);
      set({ 
        error: errorDetails.message,
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
