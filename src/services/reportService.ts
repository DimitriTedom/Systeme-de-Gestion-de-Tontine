// Report Service - Utilise Supabase pour générer les rapports
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

// Type aliases pour les requêtes
type CotisationRow = Database['public']['Tables']['cotisation']['Row'];
type PenaliteRow = Database['public']['Tables']['penalite']['Row'];
type CreditRow = Database['public']['Tables']['credit']['Row'];
type TourRow = Database['public']['Tables']['tour']['Row'];
type SeanceRow = Database['public']['Tables']['seance']['Row'];
type MembreRow = Database['public']['Tables']['membre']['Row'];
type TontineRow = Database['public']['Tables']['tontine']['Row'];
type ProjetRow = Database['public']['Tables']['projet']['Row'];
type PresenceRow = Database['public']['Tables']['presence']['Row'];

export interface MemberFinancialReport {
  total_cotise: number;
  total_penalites: number;
  total_emprunte: number;
  total_gagne: number;
}

export interface SessionReportData {
  session: {
    id_seance: string;
    numero_seance: number;
    date_seance: string;
    lieu: string;
    ordre_du_jour: string;
    total_cotisations: number;
    total_penalites: number;
    nombre_presents: number;
  };
  tontine: {
    id_tontine: string;
    nom_tontine: string;
    montant_cotisation: number;
    periodicite: string;
  };
  contributions: Array<{
    id_membre: string;
    nom: string;
    prenom: string;
    montant_paye: number;
    mode_paiement: string;
    present: boolean;
  }>;
  beneficiary: {
    id_membre: string;
    nom: string;
    prenom: string;
    montant_recu: number;
    date_reception: string;
  } | null;
  absences: Array<{
    id_membre: string;
    nom: string;
    prenom: string;
  }>;
  penalties: Array<{
    id_membre: string;
    nom: string;
    prenom: string;
    montant: number;
    raison: string;
    statut: string;
  }>;
}

export interface DetailedMemberFinancialReport {
  member: {
    id_membre: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  contributions: Array<{
    date: string;
    tontine: string;
    session: number;
    montant: number;
    mode_paiement: string;
  }>;
  total_contributions: number;
  credits: Array<{
    id_credit: string;
    montant: number;
    taux_interet: number;
    date_decaissement: string;
    date_echeance: string;
    solde_restant: number;
    statut: string;
    motif: string;
  }>;
  total_debts: number;
  penalties: Array<{
    date: string;
    session: number;
    montant: number;
    raison: string;
    statut: string;
  }>;
  total_penalties: number;
  net_balance: number;
}

export interface AGSynthesisReport {
  dashboard: {
    total_contributions: number;
    total_penalties: number;
    cash_in_hand: number;
    total_credits_disbursed: number;
    total_credits_remaining: number;
    total_members: number;
    active_members: number;
  };
  projects: {
    list: Array<{
      id_projet: string;
      nom_projet: string;
      description: string;
      budget: number;
      montant_alloue: number;
      statut: string;
      date_debut: string;
      date_fin: string;
    }>;
    total_budget: number;
    total_allocated: number;
    remaining: number;
  };
  emergency_fund: {
    amount: number;
    percentage: number;
    target: number;
  };
  session_trends: Array<{
    date: string;
    numero_seance: number;
    total_cotisations: number;
    nombre_presents: number;
  }>;
  tontines: Array<{
    id_tontine: string;
    nom_tontine: string;
    nombre_membres: number;
    montant_cotisation: number;
  }>;
}

export const reportService = {
  /**
   * Get member financial situation report
   */
  getMemberFinancialReport: async (memberId: string): Promise<MemberFinancialReport> => {
    // Fetch contributions - use correct field 'montant' from cotisation table
    const { data: contributions } = await supabase
      .from('cotisation')
      .select('montant')
      .eq('id_membre', memberId)
      .eq('statut', 'complete');

    const total_cotise = (contributions as CotisationRow[] | null)?.reduce(
      (sum: number, c: CotisationRow) => sum + (c.montant || 0), 0
    ) || 0;

    // Fetch penalties
    const { data: penalties } = await supabase
      .from('penalite')
      .select('montant')
      .eq('id_membre', memberId);

    const total_penalites = (penalties as PenaliteRow[] | null)?.reduce(
      (sum: number, p: PenaliteRow) => sum + (p.montant || 0), 0
    ) || 0;

    // Fetch credits
    const { data: credits } = await supabase
      .from('credit')
      .select('montant')
      .eq('id_membre', memberId)
      .in('statut', ['decaisse', 'en_cours', 'rembourse']);

    const total_emprunte = (credits as CreditRow[] | null)?.reduce(
      (sum: number, c: CreditRow) => sum + (c.montant || 0), 0
    ) || 0;

    // Fetch tours gained
    const { data: tours } = await supabase
      .from('tour')
      .select('montant_distribue')
      .eq('id_beneficiaire', memberId);

    const total_gagne = (tours as TourRow[] | null)?.reduce(
      (sum: number, t: TourRow) => sum + (t.montant_distribue || 0), 0
    ) || 0;

    return {
      total_cotise,
      total_penalites,
      total_emprunte,
      total_gagne,
    };
  },

  /**
   * Get comprehensive session report data for PDF generation
   */
  getSessionReportData: async (sessionId: string): Promise<SessionReportData> => {
    // Fetch session with tontine
    const { data: seance, error } = await supabase
      .from('seance')
      .select(`
        *,
        tontine:id_tontine (*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !seance) throw new Error('Session not found');

    const seanceData = seance as SeanceRow & { tontine: TontineRow };

    // Fetch contributions with member info
    const { data: cotisations } = await supabase
      .from('cotisation')
      .select(`
        *,
        membre:id_membre (id, nom, prenom)
      `)
      .eq('id_seance', sessionId);

    const cotisationsData = cotisations as (CotisationRow & { membre: Pick<MembreRow, 'id' | 'nom' | 'prenom'> | null })[] | null;

    // Fetch presences
    const { data: presences } = await supabase
      .from('presence')
      .select(`
        *,
        membre:id_membre (id, nom, prenom)
      `)
      .eq('id_seance', sessionId);

    const presencesData = presences as (PresenceRow & { membre: Pick<MembreRow, 'id' | 'nom' | 'prenom'> | null })[] | null;

    // Fetch penalties for this session
    const { data: penalites } = await supabase
      .from('penalite')
      .select(`
        *,
        membre:id_membre (id, nom, prenom)
      `)
      .eq('id_seance', sessionId);

    const penalitesData = penalites as (PenaliteRow & { membre: Pick<MembreRow, 'id' | 'nom' | 'prenom'> | null })[] | null;

    // Fetch tour (beneficiary) for this session
    const { data: tour } = await supabase
      .from('tour')
      .select(`
        *,
        membre:id_beneficiaire (id, nom, prenom)
      `)
      .eq('id_seance', sessionId)
      .maybeSingle();

    const tourData = tour as (TourRow & { membre: Pick<MembreRow, 'id' | 'nom' | 'prenom'> | null }) | null;

    // Calculate totals - use 'montant' field from cotisation
    const total_cotisations = cotisationsData?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const total_penalites = penalitesData?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;
    const nombre_presents = presencesData?.filter(p => p.present).length || 0;

    // Build contributions list
    const contributions = cotisationsData?.map(c => ({
      id_membre: c.id_membre,
      nom: c.membre?.nom || '',
      prenom: c.membre?.prenom || '',
      montant_paye: c.montant || 0,
      mode_paiement: c.methode_paiement || 'especes',
      present: presencesData?.some(p => p.id_membre === c.id_membre && p.present) || false,
    })) || [];

    // Build absences list
    const absences = presencesData
      ?.filter(p => !p.present)
      .map(p => ({
        id_membre: p.id_membre,
        nom: p.membre?.nom || '',
        prenom: p.membre?.prenom || '',
      })) || [];

    // Build penalties list
    const penaltiesResult = penalitesData?.map(p => ({
      id_membre: p.id_membre,
      nom: p.membre?.nom || '',
      prenom: p.membre?.prenom || '',
      montant: p.montant || 0,
      raison: p.raison || '',
      statut: p.statut || 'non_payee',
    })) || [];

    return {
      session: {
        id_seance: seanceData.id,
        numero_seance: seanceData.numero_seance,
        date_seance: seanceData.date,
        lieu: seanceData.lieu || '',
        ordre_du_jour: seanceData.ordre_du_jour || '',
        total_cotisations,
        total_penalites,
        nombre_presents,
      },
      tontine: {
        id_tontine: seanceData.tontine.id,
        nom_tontine: seanceData.tontine.nom,
        montant_cotisation: seanceData.tontine.montant_cotisation,
        periodicite: seanceData.tontine.periode,
      },
      contributions,
      beneficiary: tourData ? {
        id_membre: tourData.id_beneficiaire,
        nom: tourData.membre?.nom || '',
        prenom: tourData.membre?.prenom || '',
        montant_recu: tourData.montant_distribue || 0,
        date_reception: tourData.date || '',
      } : null,
      absences,
      penalties: penaltiesResult,
    };
  },

  /**
   * Get detailed member financial report for Excel export
   */
  getDetailedMemberFinancialReport: async (memberId: string): Promise<DetailedMemberFinancialReport> => {
    // Fetch member
    const { data: membre, error } = await supabase
      .from('membre')
      .select('*')
      .eq('id', memberId)
      .single();

    const membreData = membre as MembreRow | null;
    if (error || !membreData) throw new Error('Member not found');

    // Fetch contributions with session and tontine info
    const { data: cotisations } = await supabase
      .from('cotisation')
      .select(`
        *,
        seance:id_seance (numero_seance, date, tontine:id_tontine (nom))
      `)
      .eq('id_membre', memberId)
      .order('created_at', { ascending: false });

    type CotisationWithSeance = CotisationRow & { 
      seance: { 
        numero_seance: number; 
        date: string; 
        tontine: { nom: string } | null 
      } | null 
    };
    const cotisationsData = cotisations as CotisationWithSeance[] | null;

    // Fetch credits
    const { data: credits } = await supabase
      .from('credit')
      .select('*')
      .eq('id_membre', memberId)
      .order('date_demande', { ascending: false });

    const creditsData = credits as CreditRow[] | null;

    // Fetch penalties with session info
    const { data: penalites } = await supabase
      .from('penalite')
      .select(`
        *,
        seance:id_seance (numero_seance, date)
      `)
      .eq('id_membre', memberId)
      .order('created_at', { ascending: false });

    type PenaliteWithSeance = PenaliteRow & { 
      seance: { numero_seance: number; date: string } | null 
    };
    const penalitesData = penalites as PenaliteWithSeance[] | null;

    // Use 'montant' field from cotisation
    const total_contributions = cotisationsData?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const total_debts = creditsData
      ?.filter(c => c.statut !== 'rembourse')
      .reduce((sum, c) => sum + ((c.montant + (c.montant * c.taux_interet / 100)) - (c.montant_rembourse || 0)), 0) || 0;
    const total_penalties = penalitesData?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;

    return {
      member: {
        id_membre: membreData.id,
        nom: membreData.nom,
        prenom: membreData.prenom,
        email: membreData.email,
        telephone: membreData.telephone,
      },
      contributions: cotisationsData?.map(c => ({
        date: c.seance?.date || '',
        tontine: c.seance?.tontine?.nom || '',
        session: c.seance?.numero_seance || 0,
        montant: c.montant || 0,
        mode_paiement: c.methode_paiement || 'especes',
      })) || [],
      total_contributions,
      credits: creditsData?.map(c => ({
        id_credit: c.id,
        montant: c.montant,
        taux_interet: c.taux_interet,
        date_decaissement: c.date_decaissement || '',
        date_echeance: c.date_remboursement_prevue,
        solde_restant: (c.montant + (c.montant * c.taux_interet / 100)) - (c.montant_rembourse || 0),
        statut: c.statut,
        motif: c.objet || '',
      })) || [],
      total_debts,
      penalties: penalitesData?.map(p => ({
        date: p.created_at || '',
        session: p.seance?.numero_seance || 0,
        montant: p.montant,
        raison: p.raison,
        statut: p.statut,
      })) || [],
      total_penalties,
      net_balance: total_contributions - total_debts - total_penalties,
    };
  },

  /**
   * Get General Assembly synthesis report data
   */
  getAGSynthesisReport: async (tontineId?: string): Promise<AGSynthesisReport> => {
    // Fetch all contributions - use 'montant' field
    let contributionsQuery = supabase
      .from('cotisation')
      .select('montant')
      .eq('statut', 'complete');

    if (tontineId) {
      const { data: sessions } = await supabase
        .from('seance')
        .select('id')
        .eq('id_tontine', tontineId);
      
      const sessionsData = sessions as Pick<SeanceRow, 'id'>[] | null;
      if (sessionsData?.length) {
        contributionsQuery = contributionsQuery.in('id_seance', sessionsData.map(s => s.id));
      }
    }

    const { data: contributions } = await contributionsQuery;
    const contributionsData = contributions as Pick<CotisationRow, 'montant'>[] | null;
    const total_contributions = contributionsData?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;

    // Fetch penalties
    const { data: penalties } = await supabase
      .from('penalite')
      .select('montant');

    const penaltiesData = penalties as Pick<PenaliteRow, 'montant'>[] | null;
    const total_penalties = penaltiesData?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;

    // Fetch credits
    const { data: credits } = await supabase
      .from('credit')
      .select('montant, montant_rembourse, statut')
      .in('statut', ['decaisse', 'en_cours']);

    const creditsData = credits as Pick<CreditRow, 'montant' | 'montant_rembourse' | 'statut'>[] | null;
    const total_credits_disbursed = creditsData?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const total_credits_remaining = creditsData?.reduce((sum, c) => 
      sum + ((c.montant || 0) - (c.montant_rembourse || 0)), 0) || 0;

    // Fetch members
    const { data: members } = await supabase
      .from('membre')
      .select('statut');

    const membersData = members as Pick<MembreRow, 'statut'>[] | null;
    const total_members = membersData?.length || 0;
    const active_members = membersData?.filter(m => m.statut === 'Actif').length || 0;

    // Cash in hand calculation
    const credits_rembourses = creditsData?.reduce((sum, c) => sum + (c.montant_rembourse || 0), 0) || 0;
    const cash_in_hand = total_contributions + total_penalties - total_credits_disbursed + credits_rembourses;

    // Fetch projects
    const { data: projects } = await supabase
      .from('projet')
      .select('*')
      .order('date_debut', { ascending: false });

    const projectsData = projects as ProjetRow[] | null;
    const projectList = projectsData?.map(p => ({
      id_projet: p.id,
      nom_projet: p.nom,
      description: p.description || '',
      budget: p.budget,
      montant_alloue: p.montant_alloue || 0,
      statut: p.statut,
      date_debut: p.date_debut,
      date_fin: p.date_cible || '',
    })) || [];

    const total_budget = projectsData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const total_allocated = projectsData?.reduce((sum, p) => sum + (p.montant_alloue || 0), 0) || 0;

    // Fetch session trends (last 10 sessions)
    const { data: sessions } = await supabase
      .from('seance')
      .select('id, date, numero_seance, total_cotisations, nombre_presents')
      .order('date', { ascending: false })
      .limit(10);

    const sessionsData = sessions as Pick<SeanceRow, 'id' | 'date' | 'numero_seance' | 'total_cotisations' | 'nombre_presents'>[] | null;
    const sessionTrends = sessionsData?.map(s => ({
      date: s.date,
      numero_seance: s.numero_seance,
      total_cotisations: s.total_cotisations || 0,
      nombre_presents: s.nombre_presents || 0,
    })) || [];

    // Fetch tontines with member count
    const { data: tontines } = await supabase
      .from('tontine')
      .select(`
        id, nom, montant_cotisation,
        participe (id_membre)
      `);

    type TontineWithParticipe = Pick<TontineRow, 'id' | 'nom' | 'montant_cotisation'> & { 
      participe: { id_membre: string }[] | null 
    };
    const tontinesData = tontines as TontineWithParticipe[] | null;
    const tontineList = tontinesData?.map(t => ({
      id_tontine: t.id,
      nom_tontine: t.nom,
      nombre_membres: t.participe?.length || 0,
      montant_cotisation: t.montant_cotisation,
    })) || [];

    // Emergency fund (10% of cash in hand as target)
    const emergency_target = cash_in_hand * 0.1;
    const emergency_amount = Math.min(cash_in_hand * 0.05, emergency_target); // 5% allocated

    return {
      dashboard: {
        total_contributions,
        total_penalties,
        cash_in_hand,
        total_credits_disbursed,
        total_credits_remaining,
        total_members,
        active_members,
      },
      projects: {
        list: projectList,
        total_budget,
        total_allocated,
        remaining: total_budget - total_allocated,
      },
      emergency_fund: {
        amount: emergency_amount,
        percentage: emergency_target > 0 ? (emergency_amount / emergency_target) * 100 : 0,
        target: emergency_target,
      },
      session_trends: sessionTrends,
      tontines: tontineList,
    };
  },
};
