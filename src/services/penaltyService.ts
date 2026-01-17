import api from './api';

// Backend schema types
export interface PenaliteBackend {
  id_penalite: number;
  montant: number;
  raison: string;
  date: string;
  statut: string;
  id_membre: number;
  id_seance: number | null;
  id_tontine?: number;
}

export interface PenaliteCreate {
  montant: number;
  raison: string;
  date: string;
  id_membre: number;
  id_seance?: number;
  id_tontine?: number;
  statut?: string;
  type_penalite?: string;
}

export interface PenaliteUpdate {
  statut?: string;
  montant?: number;
}

// Frontend DTO type
export interface PenaltyDTO {
  id: string;
  memberId: string;
  sessionId: string | null;
  tontineId: string;
  amount: number;
  reason: string;
  penaltyType: 'late_contribution' | 'absence' | 'misconduct' | 'other';
  status: 'pending' | 'paid' | 'waived';
  createdAt: Date;
  paymentDate?: Date;
}

// Map backend statut to frontend status
const mapStatutToStatus = (statut: string): PenaltyDTO['status'] => {
  const mapping: Record<string, PenaltyDTO['status']> = {
    'non_paye': 'pending',
    'paye': 'paid',
    'annule': 'waived',
  };
  return mapping[statut] || 'pending';
};

// Map frontend status to backend statut
const mapStatusToStatut = (status: string): string => {
  const mapping: Record<string, string> = {
    'pending': 'non_paye',
    'paid': 'paye',
    'waived': 'annule',
  };
  return mapping[status] || 'non_paye';
};

// Infer penalty type from reason (since backend might not have this)
const inferPenaltyType = (raison: string): PenaltyDTO['penaltyType'] => {
  const lower = raison.toLowerCase();
  if (lower.includes('absence')) return 'absence';
  if (lower.includes('retard') || lower.includes('late')) return 'late_contribution';
  if (lower.includes('conduite') || lower.includes('conduct')) return 'misconduct';
  return 'other';
};

// Transform backend data to frontend DTO
const transformToDTO = (penalty: PenaliteBackend): PenaltyDTO => ({
  id: String(penalty.id_penalite),
  memberId: String(penalty.id_membre),
  sessionId: penalty.id_seance ? String(penalty.id_seance) : null,
  tontineId: penalty.id_tontine ? String(penalty.id_tontine) : '0',
  amount: penalty.montant,
  reason: penalty.raison,
  penaltyType: inferPenaltyType(penalty.raison),
  status: mapStatutToStatus(penalty.statut),
  createdAt: new Date(penalty.date),
});

/**
 * Get all penalties
 */
export const getAllPenalties = async (): Promise<PenaltyDTO[]> => {
  const response = await api.get<PenaliteBackend[]>('/penalites');
  return response.data.map(transformToDTO);
};

/**
 * Get penalties by member ID
 */
export const getPenaltiesByMemberId = async (memberId: string): Promise<PenaltyDTO[]> => {
  const response = await api.get<PenaliteBackend[]>('/penalites', {
    params: { id_membre: memberId }
  });
  return response.data.map(transformToDTO);
};

/**
 * Get a single penalty by ID
 */
export const getPenaltyById = async (id: string): Promise<PenaltyDTO> => {
  const response = await api.get<PenaliteBackend>(`/penalites/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new penalty
 */
export const createPenalty = async (
  penalty: Omit<PenaltyDTO, 'id'>
): Promise<PenaltyDTO> => {
  const backendData: PenaliteCreate = {
    montant: penalty.amount,
    raison: penalty.reason,
    date: penalty.createdAt instanceof Date 
      ? penalty.createdAt.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    id_membre: parseInt(penalty.memberId, 10),
    id_seance: penalty.sessionId ? parseInt(penalty.sessionId, 10) : undefined,
    id_tontine: penalty.tontineId ? parseInt(penalty.tontineId, 10) : undefined,
    statut: mapStatusToStatut(penalty.status),
    type_penalite: penalty.penaltyType,
  };
  const response = await api.post<PenaliteBackend>('/penalites', backendData);
  return transformToDTO(response.data);
};

/**
 * Update a penalty (e.g., mark as paid)
 */
export const updatePenalty = async (
  id: string, 
  update: { status?: string; amount?: number }
): Promise<PenaltyDTO> => {
  const backendUpdate: PenaliteUpdate = {};
  if (update.status) {
    backendUpdate.statut = mapStatusToStatut(update.status);
  }
  if (update.amount !== undefined) {
    backendUpdate.montant = update.amount;
  }
  const response = await api.patch<PenaliteBackend>(`/penalites/${id}`, backendUpdate);
  return transformToDTO(response.data);
};

/**
 * Mark a penalty as paid
 */
export const markPenaltyAsPaid = async (id: string): Promise<PenaltyDTO> => {
  return updatePenalty(id, { status: 'paid' });
};

/**
 * Delete a penalty
 */
export const deletePenalty = async (id: string): Promise<void> => {
  await api.delete(`/penalites/${id}`);
};
