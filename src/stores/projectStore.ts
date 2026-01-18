import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Projet, InsertTables, UpdateTables } from '@/types/database.types';

interface ProjectStore {
  projects: Projet[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchProjects: () => Promise<void>;
  fetchProjectsByTontine: (tontineId: string) => Promise<void>;
  addProject: (project: InsertTables<'projet'>) => Promise<Projet | null>;
  updateProject: (id: string, project: UpdateTables<'projet'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Actions spécifiques
  allocateFunds: (id: string, amount: number) => Promise<void>;
  completeProject: (id: string) => Promise<void>;
  cancelProject: (id: string) => Promise<void>;
  
  // Getters
  getProjectById: (id: string) => Projet | undefined;
  getProjectsByTontineId: (tontineId: string) => Projet[];
  getActiveProjects: () => Projet[];
  getCompletedProjects: () => Projet[];
  
  // Utilitaires
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  // Récupérer tous les projets
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projet')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;

      set({ projects: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des projets',
        isLoading: false 
      });
    }
  },

  // Récupérer les projets d'une tontine
  fetchProjectsByTontine: async (tontineId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projet')
        .select('*')
        .eq('id_tontine', tontineId)
        .order('date_debut', { ascending: false });

      if (error) throw error;

      set({ projects: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter un projet
  addProject: async (projectData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projet')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ 
        projects: [data, ...state.projects],
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

  // Mettre à jour un projet
  updateProject: async (id, projectData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projet')
        .update(projectData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        projects: state.projects.map((p) => p.id === id ? data : p),
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

  // Supprimer un projet
  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('projet')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
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

  // Allouer des fonds à un projet
  allocateFunds: async (id, amount) => {
    const project = get().getProjectById(id);
    if (!project) throw new Error('Projet non trouvé');

    const newAmount = project.montant_alloue + amount;
    const newStatut = newAmount >= project.budget ? 'en_cours' : 'collecte_fonds';

    await get().updateProject(id, {
      montant_alloue: newAmount,
      statut: newStatut,
    });
  },

  // Marquer un projet comme terminé
  completeProject: async (id) => {
    await get().updateProject(id, {
      statut: 'termine',
      date_fin_reelle: new Date().toISOString().split('T')[0],
    });
  },

  // Annuler un projet
  cancelProject: async (id) => {
    await get().updateProject(id, { statut: 'annule' });
  },

  // Getters
  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  getProjectsByTontineId: (tontineId) => {
    return get().projects.filter((p) => p.id_tontine === tontineId);
  },

  getActiveProjects: () => {
    return get().projects.filter((p) => 
      ['planifie', 'collecte_fonds', 'en_cours'].includes(p.statut)
    );
  },

  getCompletedProjects: () => {
    return get().projects.filter((p) => p.statut === 'termine');
  },

  clearError: () => {
    set({ error: null });
  },
}));
