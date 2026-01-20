import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Credit, InsertTables, UpdateTables } from '@/types/database.types';
import { handleSupabaseError, logError } from '@/lib/errorHandler';

interface CreditStore {
  credits: Credit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchCredits: () => Promise<void>;
  fetchCreditsByMember: (memberId: string) => Promise<void>;
  addCredit: (credit: InsertTables<'credit'>) => Promise<Credit | null>;
  updateCredit: (id: string, credit: UpdateTables<'credit'>) => Promise<void>;
  deleteCredit: (id: string) => Promise<void>;
  
  // Actions spécifiques
  repayCredit: (id: string, amount: number) => Promise<void>;
  approveCredit: (id: string) => Promise<void>;
  disburseCredit: (id: string) => Promise<void>;
  updateOverdueCredits: () => Promise<{ count: number; credits: any[] }>;
  checkMemberHasActiveCredit: (memberId: string) => Promise<boolean>;
  calculateTontineBalance: (tontineId: string) => Promise<number>;
  
  // Getters
  getCreditById: (id: string) => Credit | undefined;
  getCreditsByMemberId: (memberId: string) => Credit[];
  getActiveCredits: () => Credit[];
  getPendingCredits: () => Credit[];
  
  // Utilitaires
  clearError: () => void;
}

export const useCreditStore = create<CreditStore>((set, get) => ({
  credits: [],
  isLoading: false,
  error: null,

  // Récupérer tous les crédits
  fetchCredits: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('credit')
        .select('*')
        .order('date_demande', { ascending: false });

      if (error) throw error;

      set({ credits: data || [], isLoading: false });
    } catch (error) {
      const errorDetails = handleSupabaseError(error);
      logError('fetchCredits', error);
      set({ 
        error: errorDetails.message,
        isLoading: false 
      });
    }
  },

  // Récupérer les crédits d'un membre
  fetchCreditsByMember: async (memberId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('credit')
        .select('*')
        .eq('id_membre', memberId)
        .order('date_demande', { ascending: false });

      if (error) throw error;

      set({ credits: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement',
        isLoading: false 
      });
    }
  },

  // Ajouter un crédit
  addCredit: async (creditData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Vérifier si le membre a déjà un crédit actif
      const hasActiveCredit = await get().checkMemberHasActiveCredit(creditData.id_membre);
      
      if (hasActiveCredit) {
        throw new Error('Ce membre a déjà un crédit actif. Il doit d\'abord rembourser son crédit en cours.');
      }

      // Vérifier la disponibilité des fonds dans la tontine
      if (!creditData.id_tontine) {
        throw new Error('Tontine non spécifiée');
      }
      
      // Calculate real balance from database data
      const tontineBalance = await get().calculateTontineBalance(creditData.id_tontine);
      
      if (tontineBalance < creditData.montant) {
        throw new Error(
          `Fonds insuffisants dans la tontine. Disponible: ${tontineBalance.toLocaleString()} XAF, Demandé: ${creditData.montant.toLocaleString()} XAF`
        );
      }

      const { data, error } = await supabase
        .from('credit')
        .insert({
          ...creditData,
          solde: creditData.montant * (1 + (creditData.taux_interet || 0) / 100),
        })
        .select()
        .single();

      if (error) throw error;

      // Ne pas créer de transaction ici - le crédit est en attente d'approbation
      // La transaction sera créée lors du décaissement (disburseCredit)

      set((state) => ({ 
        credits: [data, ...state.credits],
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

  // Mettre à jour un crédit
  updateCredit: async (id, creditData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('credit')
        .update(creditData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        credits: state.credits.map((c) => c.id === id ? data : c),
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

  // Supprimer un crédit
  deleteCredit: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('credit')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        credits: state.credits.filter((c) => c.id !== id),
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

  // Rembourser un crédit (utilise la fonction RPC)
  repayCredit: async (id, amount) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get credit info before repayment for transaction recording
      const credit = get().getCreditById(id);
      if (!credit) {
        throw new Error('Crédit introuvable');
      }

      const { data, error } = await supabase
        .rpc('rembourser_credit', {
          id_credit_param: id,
          montant_paye: amount,
        });

      if (error) throw error;

      // Enregistrer la transaction de remboursement (argent entrant)
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      if (credit.id_tontine) {
        transactionStore.addTransaction({
          tontineId: credit.id_tontine,
          type: 'credit_repayment',
          amount: amount, // Positif car c'est une entrée d'argent
          description: `Remboursement crédit ${credit.id}`,
          relatedEntityId: credit.id,
          relatedEntityType: 'credit',
          memberId: credit.id_membre || undefined,
        });
      }

      // Rafraîchir la liste des crédits
      await get().fetchCredits();

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du remboursement',
        isLoading: false 
      });
      throw error;
    }
  },

  // Approuver un crédit
  approveCredit: async (id) => {
    await get().updateCredit(id, { statut: 'approuve' });
  },

  // Décaisser un crédit
  disburseCredit: async (id) => {
    const credit = get().getCreditById(id);
    if (!credit) {
      throw new Error('Crédit non trouvé');
    }

    // Mettre à jour le statut du crédit
    await get().updateCredit(id, { 
      statut: 'decaisse',
      date_decaissement: new Date().toISOString().split('T')[0],
    });

    // Créer la transaction de décaissement (argent sortant)
    if (credit.id_tontine) {
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      transactionStore.addTransaction({
        tontineId: credit.id_tontine,
        type: 'credit_granted',
        amount: -credit.montant, // Négatif car c'est une sortie d'argent
        description: `Crédit décaissé pour ${credit.id}`,
        relatedEntityId: credit.id,
        relatedEntityType: 'credit',
        memberId: credit.id_membre || undefined,
      });
    }
  },

  // Vérifier si un membre a un crédit actif (RPC)
  checkMemberHasActiveCredit: async (memberId) => {
    try {
      const { data, error } = await supabase
        .rpc('verifier_credit_actif', {
          id_membre_param: memberId,
        });

      if (error) throw error;

      return data as boolean;
    } catch (error) {
      console.error('Erreur vérification crédit actif:', error);
      return false;
    }
  },

  // Mettre à jour les crédits en retard (RPC)
  updateOverdueCredits: async () => {
    try {
      const { data, error } = await supabase
        .rpc('mettre_a_jour_credits_en_retard');

      if (error) throw error;

      // Rafraîchir la liste des crédits après la mise à jour
      await get().fetchCredits();

      const result = data as any[];
      return {
        count: result[0]?.credits_mis_a_jour || 0,
        credits: result[0]?.liste_credits_retard || [],
      };
    } catch (error) {
      console.error('Erreur mise à jour crédits en retard:', error);
      return { count: 0, credits: [] };
    }
  },

  // Getters
  getCreditById: (id) => {
    return get().credits.find((c) => c.id === id);
  },

  getCreditsByMemberId: (memberId) => {
    return get().credits.filter((c) => c.id_membre === memberId);
  },

  getActiveCredits: () => {
    return get().credits.filter((c) => 
      ['decaisse', 'en_cours'].includes(c.statut)
    );
  },

  getPendingCredits: () => {
    return get().credits.filter((c) => c.statut === 'en_attente');
  },

  clearError: () => {
    set({ error: null });
  },
}));
