import api from './api';

// Backend schema types
export interface CreditCreate {
  montant: number;
  taux_interet: number;
  objet: string;
  date_demande: string; // ISO date string
  date_remboursement_prevue: string; // ISO date string
  id_membre: number;
}

export interface CreditBackend {
  id_credit: number;
  montant: number;
  solde: number;
  taux_interet: number;
  objet: string;
  date_demande: string;
  date_remboursement_prevue: string;
  statut: string;
  id_membre: number;
}

export interface CreditRepayment {
  montant_paye: number;
}

// Frontend DTO type
export interface CreditDTO {
  id: string;
  tontineId: string;
  memberId: string;
  amount: number;
  remainingBalance: number;
  interestRate: number;
  disbursementDate: Date;
  dueDate: Date;
  status: 'pending' | 'approved' | 'disbursed' | 'repaying' | 'completed' | 'defaulted';
  purpose?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Map backend statut to frontend status
const mapStatutToStatus = (statut: string): CreditDTO['status'] => {
  const mapping: Record<string, CreditDTO['status']> = {
    'en_cours': 'repaying',
    'rembourse': 'completed',
    'en_retard': 'defaulted',
  };
  return mapping[statut.toLowerCase()] || 'pending';
};

// Transform backend Credit to frontend DTO
const transformToDTO = (credit: CreditBackend): CreditDTO => ({
  id: String(credit.id_credit),
  tontineId: '1', // We don't have tontineId in backend Credit model
  memberId: String(credit.id_membre),
  amount: credit.montant,
  remainingBalance: credit.solde,
  interestRate: credit.taux_interet,
  disbursementDate: new Date(credit.date_demande),
  dueDate: new Date(credit.date_remboursement_prevue),
  status: mapStatutToStatus(credit.statut),
  purpose: credit.objet,
  createdAt: new Date(credit.date_demande),
  updatedAt: new Date(credit.date_demande),
});

// Transform frontend data to backend create schema
const transformToBackend = (
  credit: Omit<CreditDTO, 'id' | 'createdAt' | 'updatedAt' | 'remainingBalance' | 'status'>
): CreditCreate => {
  // Convert dates to ISO string format (YYYY-MM-DD)
  const formatDate = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // If it's already a string, check if it's in the right format
    if (typeof date === 'string') {
      // If it includes time, extract just the date part
      return date.split('T')[0];
    }
    return date;
  };

  return {
    montant: credit.amount,
    taux_interet: credit.interestRate,
    objet: credit.purpose || '',
    date_demande: formatDate(credit.disbursementDate),
    date_remboursement_prevue: formatDate(credit.dueDate),
    id_membre: parseInt(credit.memberId, 10),
  };
};

/**
 * Get all credits
 * Endpoint: GET /credits
 */
export const getAllCredits = async (): Promise<CreditDTO[]> => {
  const response = await api.get<CreditBackend[]>('/credits');
  return response.data.map(transformToDTO);
};

/**
 * Get credits by member ID
 * Endpoint: GET /credits?id_membre={id}
 */
export const getCreditsByMemberId = async (memberId: string): Promise<CreditDTO[]> => {
  const response = await api.get<CreditBackend[]>('/credits', {
    params: { id_membre: memberId }
  });
  return response.data.map(transformToDTO);
};

/**
 * Get a single credit by ID
 * Endpoint: GET /credits/{id_credit}
 */
export const getCreditById = async (id: string): Promise<CreditDTO> => {
  const response = await api.get<CreditBackend>(`/credits/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new credit request
 * Endpoint: POST /credits
 */
export const createCredit = async (
  credit: Omit<CreditDTO, 'id' | 'createdAt' | 'updatedAt' | 'remainingBalance' | 'status'>
): Promise<CreditDTO> => {
  const backendData = transformToBackend(credit);
  const response = await api.post<CreditBackend>('/credits', backendData);
  return transformToDTO(response.data);
};

/**
 * Process a credit repayment
 * Endpoint: PATCH /credits/{id_credit}/repay
 */
export const repayCredit = async (id: string, amount: number): Promise<CreditDTO> => {
  const response = await api.patch<CreditBackend>(`/credits/${id}/repay`, {
    montant_paye: amount
  });
  return transformToDTO(response.data);
};
