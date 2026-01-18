import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Seance, InsertTables, UpdateTables, ClotureSeanceResult, MembreSeance } from '@/types/database.types';

interface SessionStore {
  sessions: Seance[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchSessions: () => Promise<void>;
  fetchSessionsByTontine: (tontineId: string) => Promise<void>;
  addSession: (session: InsertTables<'seance'>) => Promise<Seance | null>;
  updateSession: (id: string, session: UpdateTables<'seance'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  
  // Actions métier (RPC)
  closeSession: (sessionId: string, montantPenalite?: number) => Promise<ClotureSeanceResult | null>;
  getSessionMembers: (sessionId: string) => Promise<MembreSeance[]>;
  recordAttendanceAndContribution: (
    sessionId: string,
    memberId: string,
    present: boolean,
    amount?: number
  ) => Promise<void>;
  assignGain: (sessionId: string, memberId: string) => Promise<void>;
  
  // Getters
  getSessionById: (id: string) => Seance | undefined;
  getSessionsByTontineId: (tontineId: string) => Seance[];
  getUpcomingSessions: () => Seance[];
  
  // Utilitaires
  clearError: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  // Récupérer toutes les séances
  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('seance')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      set({ sessions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des séances',
        isLoading: false 
      });
    }
  },

  // Récupérer les séances d'une tontine spécifique
  fetchSessionsByTontine: async (tontineId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('seance')
        .select('*')
        .eq('id_tontine', tontineId)
        .order('numero_seance', { ascending: false });

      if (error) throw error;

      set({ sessions: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter une séance
  addSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Calculer le numéro de séance
      const { data: existingSessions } = await supabase
        .from('seance')
        .select('numero_seance')
        .eq('id_tontine', sessionData.id_tontine)
        .order('numero_seance', { ascending: false })
        .limit(1);

      const nextNumber = (existingSessions?.[0]?.numero_seance || 0) + 1;

      const { data, error } = await supabase
        .from('seance')
        .insert({ ...sessionData, numero_seance: nextNumber })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        sessions: [data, ...state.sessions],
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

  // Mettre à jour une séance
  updateSession: async (id, sessionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('seance')
        .update(sessionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.map((s) => s.id === id ? data : s),
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

  // Supprimer une séance
  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('seance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
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

  // Clôturer une séance (RPC)
  closeSession: async (sessionId, montantPenalite = 5000) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .rpc('cloturer_seance', {
          id_seance_param: sessionId,
          montant_penalite_absence: montantPenalite,
        });

      if (error) throw error;

      // Mettre à jour la séance locale
      set((state) => ({
        sessions: state.sessions.map((s) => 
          s.id === sessionId 
            ? { ...s, statut: 'terminee' as const, ...data }
            : s
        ),
        isLoading: false,
      }));

      return data as ClotureSeanceResult;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la clôture',
        isLoading: false 
      });
      throw error;
    }
  },

  // Récupérer les membres pour la feuille de séance (RPC)
  getSessionMembers: async (sessionId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_membres_seance', {
          id_seance_param: sessionId,
        });

      if (error) throw error;

      return (data as MembreSeance[]) || [];
    } catch (error) {
      console.error('Erreur getSessionMembers:', error);
      return [];
    }
  },

  // Enregistrer présence et cotisation (RPC)
  recordAttendanceAndContribution: async (sessionId, memberId, present, amount = 0) => {
    try {
      const { error } = await supabase
        .rpc('enregistrer_presence_et_cotisation', {
          id_seance_param: sessionId,
          id_membre_param: memberId,
          est_present: present,
          montant_paye: amount,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur recordAttendanceAndContribution:', error);
      throw error;
    }
  },

  // Attribuer le gain (RPC)
  assignGain: async (sessionId, memberId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .rpc('attribuer_gain', {
          id_seance_param: sessionId,
          id_membre_param: memberId,
        });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'attribution',
        isLoading: false 
      });
      throw error;
    }
  },

  // Getters
  getSessionById: (id) => {
    return get().sessions.find((s) => s.id === id);
  },

  getSessionsByTontineId: (tontineId) => {
    return get().sessions.filter((s) => s.id_tontine === tontineId);
  },

  getUpcomingSessions: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().sessions.filter((s) => 
      s.date >= today && s.statut === 'programmee'
    );
  },

  clearError: () => {
    set({ error: null });
  },
}));
