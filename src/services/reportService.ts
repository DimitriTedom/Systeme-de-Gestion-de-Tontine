import api from './api';

export interface MemberFinancialReport {
  total_cotise: number;
  total_penalites: number;
  total_emprunte: number;
  total_gagne: number;
}

export const reportService = {
  /**
   * Get member financial situation report
   */
  getMemberFinancialReport: async (memberId: string): Promise<MemberFinancialReport> => {
    const response = await api.get<MemberFinancialReport>(`/reports/situation_membre/${memberId}`);
    return response.data;
  },
};
