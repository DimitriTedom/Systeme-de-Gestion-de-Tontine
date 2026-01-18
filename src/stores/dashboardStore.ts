import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types/database.types';

interface DashboardStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDashboardStats: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .rpc('get_statistiques_dashboard');

      if (error) throw error;

      set({ stats: data as DashboardStats, isLoading: false });
    } catch (error) {
      // En cas d'erreur (fonction RPC pas encore créée), calculer manuellement
      try {
        // Statistiques membres
        const { count: totalMembres } = await supabase
          .from('membre')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'Actif');

        // Statistiques tontines
        const { count: totalTontines } = await supabase
          .from('tontine')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'Actif');

        // Total cotisations
        const { data: cotisationsData } = await supabase
          .from('cotisation')
          .select('montant');
        const totalCotisations = (cotisationsData || []).reduce((sum, c) => sum + c.montant, 0);

        // Total tours
        const { data: toursData } = await supabase
          .from('tour')
          .select('montant_distribue');
        const totalTours = (toursData || []).reduce((sum, t) => sum + t.montant_distribue, 0);

        // Crédits actifs
        const { count: creditsActifs, data: creditsData } = await supabase
          .from('credit')
          .select('solde', { count: 'exact' })
          .in('statut', ['decaisse', 'en_cours']);
        const montantCreditsActifs = (creditsData || []).reduce((sum, c) => sum + c.solde, 0);

        // Pénalités non payées
        const { count: penalitesNonPayees, data: penalitesData } = await supabase
          .from('penalite')
          .select('montant', { count: 'exact' })
          .eq('statut', 'non_paye');
        const montantPenalitesNonPayees = (penalitesData || []).reduce((sum, p) => sum + p.montant, 0);

        // Projets actifs
        const { count: projetsActifs } = await supabase
          .from('projet')
          .select('*', { count: 'exact', head: true })
          .in('statut', ['planifie', 'collecte_fonds', 'en_cours']);

        // Dernières séances
        const { data: dernieresSeances } = await supabase
          .from('seance')
          .select('id, date, lieu, statut, total_cotisations')
          .order('date', { ascending: false })
          .limit(5);

        const stats: DashboardStats = {
          total_membres: totalMembres || 0,
          total_tontines: totalTontines || 0,
          caisse: totalCotisations - totalTours,
          credits_actifs: creditsActifs || 0,
          montant_credits_actifs: montantCreditsActifs,
          penalites_non_payees: penalitesNonPayees || 0,
          montant_penalites_non_payees: montantPenalitesNonPayees,
          projets_actifs: projetsActifs || 0,
          total_cotisations: totalCotisations,
          total_tours: totalTours,
          dernieres_seances: dernieresSeances || [],
        };

        set({ stats, isLoading: false });
      } catch (fallbackError) {
        set({ 
          error: fallbackError instanceof Error ? fallbackError.message : 'Erreur lors du chargement des statistiques',
          isLoading: false 
        });
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
