// Tour Store - Gestion des tours avec Supabase
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Tour {
  id: string;
  sessionId: string;
  tontineId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  tourNumber: number;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface EligibleBeneficiary {
  id_membre: string;
  nom: string;
  prenom: string;
  nb_tours_recus: number;
  total_cotise: number;
  eligible: boolean;
}

// Transform database row to Tour
const transformTour = (row: any): Tour => ({
  id: row.id,
  sessionId: row.id_seance || '',
  tontineId: row.id_tontine,
  beneficiaryId: row.id_beneficiaire,
  beneficiaryName: row.membre ? `${row.membre.prenom} ${row.membre.nom}` : '',
  tourNumber: row.numero,
  amount: row.montant_distribue,
  date: new Date(row.date || new Date()),
  status: 'completed',
  notes: row.notes || undefined,
});

interface TourStore {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchTours: () => Promise<void>;
  addTour: (tour: {
    sessionId: string;
    tontineId: string;
    beneficiaryId: string;
    tourNumber: number;
    amount: number;
  }) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  
  // Helper async functions
  getEligibleBeneficiaries: (tontineId: string) => Promise<EligibleBeneficiary[]>;
  getNextTourNumber: (tontineId: string) => Promise<number>;
  getSessionTotalContributions: (sessionId: string) => Promise<number>;
  assignGain: (sessionId: number, beneficiaryId: number) => Promise<Tour | null>;
  calculateTontineBalance: (tontineId: string) => Promise<number>;
  
  // Local state getters
  getTourById: (id: string) => Tour | undefined;
  getToursByTontineId: (tontineId: string) => Tour[];
  getToursBySessionId: (sessionId: string) => Tour[];
  getToursByMemberId: (memberId: string) => Tour[];
  clearError: () => void;
}

export const useTourStore = create<TourStore>((set, get) => ({
  tours: [],
  isLoading: false,
  error: null,

  fetchTours: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tour')
        .select(`
          *,
          membre:id_beneficiaire (nom, prenom)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const tours = (data || []).map(transformTour);
      set({ tours, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Échec du chargement des tours',
        isLoading: false 
      });
    }
  },

  addTour: async (tourData) => {
    set({ isLoading: true, error: null });
    try {
      // Vérifier la disponibilité des fonds dans la tontine avant distribution
      const tontineBalance = await get().calculateTontineBalance(tourData.tontineId);
      
      if (tontineBalance < tourData.amount) {
        throw new Error(
          `Fonds insuffisants pour ce tour/gain. Disponible: ${tontineBalance.toLocaleString()} XAF, Demandé: ${tourData.amount.toLocaleString()} XAF`
        );
      }

      // CONTRAINTE MAJEURE : Vérifier que le montant cumulé perçu ne dépasse pas le montant total à cotiser
      // (Pour tontines optionnelles uniquement)
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontine')
        .select('type, montant_cotisation')
        .eq('id', tourData.tontineId)
        .single();

      if (tontineError) throw tontineError;

      if (tontineData && tontineData.type.toLowerCase() === 'optionnelle') {
        // Récupérer le nombre de parts du membre
        const { data: participeData, error: participeError } = await supabase
          .from('participe')
          .select('nb_parts')
          .eq('id_membre', tourData.beneficiaryId)
          .eq('id_tontine', tourData.tontineId)
          .single();

        if (participeError) throw participeError;

        // Récupérer le total déjà perçu par ce membre dans cette tontine
        const { data: toursRecus, error: toursError } = await supabase
          .from('tour')
          .select('montant_distribue')
          .eq('id_beneficiaire', tourData.beneficiaryId)
          .eq('id_tontine', tourData.tontineId);

        if (toursError) throw toursError;

        const totalDejaPercu = toursRecus?.reduce((sum, t) => sum + (t.montant_distribue || 0), 0) || 0;
        
        // Calculer le montant total que le membre est censé cotiser
        // Formule: nb_parts * montant_cotisation * nombre_total_de_tours
        const nbParts = participeData?.nb_parts || 1;
        const montantCotisation = tontineData.montant_cotisation;
        
        // Récupérer le nombre total de membres pour calculer le nombre de tours
        const { data: membresData, error: membresError } = await supabase
          .from('participe')
          .select('id_membre')
          .eq('id_tontine', tourData.tontineId);

        if (membresError) throw membresError;

        const nombreTotalMembres = membresData?.length || 1;
        const montantTotalACotiser = nbParts * montantCotisation * nombreTotalMembres;

        // Vérifier la contrainte
        const nouveauTotalPercu = totalDejaPercu + tourData.amount;
        if (nouveauTotalPercu > montantTotalACotiser) {
          throw new Error(
            `Contrainte violée : Le membre ne peut pas recevoir ${tourData.amount.toLocaleString()} XAF. ` +
            `Total déjà perçu: ${totalDejaPercu.toLocaleString()} XAF. ` +
            `Nouveau total: ${nouveauTotalPercu.toLocaleString()} XAF dépasse le montant maximum autorisé de ${montantTotalACotiser.toLocaleString()} XAF ` +
            `(${nbParts} part(s) × ${montantCotisation.toLocaleString()} XAF × ${nombreTotalMembres} tours).`
          );
        }
      }

      const insertData = {
        id_seance: tourData.sessionId,
        id_tontine: tourData.tontineId,
        id_beneficiaire: tourData.beneficiaryId,
        numero: tourData.tourNumber,
        montant_distribue: tourData.amount,
        date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('tour')
        .insert(insertData)
        .select(`
          *,
          membre:id_beneficiaire (nom, prenom)
        `)
        .single();

      if (error) throw error;

      // Enregistrer la transaction de distribution du tour (argent sortant)
      const { useTransactionStore } = await import('./transactionStore');
      const transactionStore = useTransactionStore.getState();
      transactionStore.addTransaction({
        tontineId: tourData.tontineId,
        type: 'tour_distribution',
        amount: -tourData.amount, // Négatif car c'est une sortie d'argent
        description: `Tour #${tourData.tourNumber} distribué`,
        relatedEntityId: data.id,
        relatedEntityType: 'tour',
        memberId: tourData.beneficiaryId,
        sessionId: tourData.sessionId,
      });

      const newTour = transformTour(data);
      set((state) => ({ 
        tours: [newTour, ...state.tours],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Échec de l\'ajout du tour',
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

  deleteTour: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('tour')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tours: state.tours.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Échec de la suppression du tour',
        isLoading: false 
      });
      throw error;
    }
  },

  getEligibleBeneficiaries: async (tontineId: string) => {
    try {
      // Get all members participating in this tontine
      const { data: participants, error: partError } = await supabase
        .from('participe')
        .select(`
          id_membre,
          membre:id_membre (id, nom, prenom)
        `)
        .eq('id_tontine', tontineId);

      if (partError) throw partError;

      // Get tours already assigned for this tontine
      const { data: existingTours, error: tourError } = await supabase
        .from('tour')
        .select('id_beneficiaire')
        .eq('id_tontine', tontineId);

      if (tourError) throw tourError;

      const beneficiariesWithTours = new Set(existingTours?.map(t => t.id_beneficiaire) || []);

      // Get total contributions for each member
      const eligibleMembers: EligibleBeneficiary[] = await Promise.all(
        (participants || []).map(async (p: any) => {
          const membre = p.membre as { id: string; nom: string; prenom: string } | null;
          
          const { data: cotisations } = await supabase
            .from('cotisation')
            .select('montant')
            .eq('id_membre', p.id_membre)
            .eq('statut', 'complete');

          const total_cotise = cotisations?.reduce((sum, c: any) => sum + (c.montant || 0), 0) || 0;
          const nb_tours_recus = existingTours?.filter(t => t.id_beneficiaire === p.id_membre).length || 0;

          return {
            id_membre: p.id_membre,
            nom: membre?.nom || '',
            prenom: membre?.prenom || '',
            nb_tours_recus,
            total_cotise,
            eligible: !beneficiariesWithTours.has(p.id_membre),
          };
        })
      );

      return eligibleMembers;
    } catch (error) {
      console.error('Failed to get eligible beneficiaries:', error);
      return [];
    }
  },

  getNextTourNumber: async (tontineId: string) => {
    try {
      const { data, error } = await supabase
        .from('tour')
        .select('numero')
        .eq('id_tontine', tontineId)
        .order('numero', { ascending: false })
        .limit(1);

      if (error) throw error;

      return ((data?.[0] as any)?.numero || 0) + 1;
    } catch (error) {
      console.error('Failed to get next tour number:', error);
      return 1;
    }
  },

  getSessionTotalContributions: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('cotisation')
        .select('montant')
        .eq('id_seance', sessionId)
        .eq('statut', 'complete');

      if (error) throw error;

      return data?.reduce((sum, c: any) => sum + (c.montant || 0), 0) || 0;
    } catch (error) {
      console.error('Failed to get session total contributions:', error);
      return 0;
    }
  },

  assignGain: async (sessionId: number, beneficiaryId: number) => {
    try {
      const { data, error } = await supabase.rpc('attribuer_gain', {
        p_id_seance: sessionId,
        p_id_beneficiaire: beneficiaryId,
      });

      if (error) throw error;

      // Refresh tours after assignment
      await get().fetchTours();

      // Find the newly created tour
      const newTour = get().tours.find(t => 
        t.sessionId === String(sessionId) && 
        t.beneficiaryId === String(beneficiaryId)
      );

      return newTour || null;
    } catch (error) {
      console.error('Failed to assign gain:', error);
      throw error;
    }
  },

  getTourById: (id) => {
    return get().tours.find((t) => t.id === id);
  },

  getToursByTontineId: (tontineId) => {
    return get().tours.filter((t) => t.tontineId === tontineId);
  },

  getToursBySessionId: (sessionId) => {
    return get().tours.filter((t) => t.sessionId === sessionId);
  },

  getToursByMemberId: (memberId) => {
    return get().tours.filter((t) => t.beneficiaryId === memberId);
  },

  clearError: () => set({ error: null }),
}));
