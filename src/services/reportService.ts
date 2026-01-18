import api from './api';

export interface MemberFinancialReport {
  total_cotise: number;
  total_penalites: number;
  total_emprunte: number;
  total_gagne: number;
}

export interface SessionReportData {
  session: {
    id_seance: number;
    numero_seance: number;
    date_seance: string;
    lieu: string;
    ordre_du_jour: string;
    total_cotisations: number;
    total_penalites: number;
    nombre_presents: number;
  };
  tontine: {
    id_tontine: number;
    nom_tontine: string;
    montant_cotisation: number;
    periodicite: string;
  };
  contributions: Array<{
    id_membre: number;
    nom: string;
    prenom: string;
    montant_paye: number;
    mode_paiement: string;
    present: boolean;
  }>;
  beneficiary: {
    id_membre: number;
    nom: string;
    prenom: string;
    montant_recu: number;
    date_reception: string;
  } | null;
  absences: Array<{
    id_membre: number;
    nom: string;
    prenom: string;
  }>;
  penalties: Array<{
    id_membre: number;
    nom: string;
    prenom: string;
    montant: number;
    raison: string;
    statut: string;
  }>;
}

export interface DetailedMemberFinancialReport {
  member: {
    id_membre: number;
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
    id_credit: number;
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
      id_projet: number;
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
    id_tontine: number;
    nom_tontine: string;
    nombre_membres: number;
    montant_cotisation: number;
  }>;
}

export const reportService = {
  /**
   * Get member financial situation report (legacy)
   */
  getMemberFinancialReport: async (memberId: string): Promise<MemberFinancialReport> => {
    const response = await api.get<MemberFinancialReport>(`/reports/situation_membre/${memberId}`);
    return response.data;
  },

  /**
   * Get comprehensive session report data for PDF generation
   */
  getSessionReportData: async (sessionId: number): Promise<SessionReportData> => {
    const response = await api.get<SessionReportData>(`/reports/session/${sessionId}`);
    return response.data;
  },

  /**
   * Get detailed member financial report for Excel export
   */
  getDetailedMemberFinancialReport: async (memberId: number): Promise<DetailedMemberFinancialReport> => {
    const response = await api.get<DetailedMemberFinancialReport>(`/reports/member/${memberId}/financial`);
    return response.data;
  },

  /**
   * Get General Assembly synthesis report data
   */
  getAGSynthesisReport: async (tontineId?: number): Promise<AGSynthesisReport> => {
    const url = tontineId 
      ? `/reports/ag-synthesis?id_tontine=${tontineId}`
      : '/reports/ag-synthesis';
    const response = await api.get<AGSynthesisReport>(url);
    return response.data;
  },
};
