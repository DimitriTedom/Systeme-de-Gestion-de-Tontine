import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Projet, InsertTables, UpdateTables } from '@/types/database.types';
import { handleSupabaseError, logError } from '@/lib/errorHandler';

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
  calculateTontineBalance: (tontineId: string) => Promise<number>;
  
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

    // Vérifier la disponibilité des fonds dans la tontine pour les dépenses
    if (amount > 0) { // Seulement pour les allocations (dépenses), pas les remboursements
      const tontineBalance = await get().calculateTontineBalance(project.id_tontine);
      
      if (tontineBalance < amount) {
        throw new Error(
          `Fonds insuffisants pour cette dépense de projet. Disponible: ${tontineBalance.toLocaleString()} XAF, Demandé: ${amount.toLocaleString()} XAF`
        );
      }
    }

    const newAmount = project.montant_alloue + amount;
    
    // Déterminer le nouveau statut en fonction du montant alloué
    let newStatut = project.statut;
    
    if (project.statut === 'planifie' && newAmount > 0) {
      // Premier financement : planifie → collecte_fonds
      newStatut = 'collecte_fonds';
    }
    
    if (newAmount >= project.budget && (project.statut === 'planifie' || project.statut === 'collecte_fonds')) {
      // Budget atteint : → en_cours
      newStatut = 'en_cours';
    }
    
    if (newAmount < project.budget && project.statut === 'en_cours') {
      // Retour en collecte si on retire des fonds
      newStatut = 'collecte_fonds';
    }

    await get().updateProject(id, {
      montant_alloue: newAmount,
      statut: newStatut,
    });

    // Enregistrer la transaction de dépense de projet (argent sortant)
    if (amount > 0) {
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      transactionStore.addTransaction({
        tontineId: project.id_tontine,
        type: 'project_expense',
        amount: -amount, // Négatif car c'est une sortie d'argent
        description: `Dépense projet: ${project.nom}`,
        relatedEntityId: project.id,
        relatedEntityType: 'project',
      });
    }
  },

  // Calculate tontine balance from real data
  calculateTontineBalance: async (tontineId: string): Promise<number> => {
    // Fetch all data for this tontine
    const [contributionsRes, creditsRes, penaltiesRes, toursRes, projectsRes] = await Promise.all([
      supabase.from('cotisation').select('montant').eq('id_tontine', tontineId),
      supabase.from('credit').select('montant, montant_rembourse, statut').eq('id_tontine', tontineId),
      supabase.from('penalite').select('montant, montant_paye, statut').eq('id_tontine', tontineId),
      supabase.from('tour').select('montant_distribue').eq('id_tontine', tontineId),
      supabase.from('projet').select('montant_alloue').eq('id_tontine', tontineId),
    ]);

    // Money IN
    const totalContributions = contributionsRes.data?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const totalPenalties = penaltiesRes.data
      ?.filter(p => p.statut === 'paye' || p.statut === 'partiellement_paye')
      .reduce((sum, p) => sum + (p.montant_paye || p.montant || 0), 0) || 0;
    const totalCreditRepayments = creditsRes.data?.reduce((sum, c) => sum + (c.montant_rembourse || 0), 0) || 0;

    // Money OUT
    const totalCreditsGranted = creditsRes.data
      ?.filter(c => c.statut !== 'refuse' && c.statut !== 'en_attente')
      .reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const totalToursDistributed = toursRes.data?.reduce((sum, t) => sum + (t.montant_distribue || 0), 0) || 0;
    const totalProjectExpenses = projectsRes.data?.reduce((sum, p) => sum + (p.montant_alloue || 0), 0) || 0;

    const moneyIn = totalContributions + totalPenalties + totalCreditRepayments;
    const moneyOut = totalCreditsGranted + totalToursDistributed + totalProjectExpenses;

    return moneyIn - moneyOut;
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
