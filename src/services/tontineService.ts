import api from './api';

// Types matching the backend schemas (schemas.py)
export interface TontineBase {
  type: string;
  montant_cotisation: number;
  periode: string;
  description?: string;
  date_debut: string; // ISO date string (YYYY-MM-DD)
  statut?: string;
}

export interface TontineCreate extends TontineBase {}

export interface TontineBackend extends TontineBase {
  id_tontine: number;
  membres_count?: number;
}

// Frontend-friendly interface (maps to frontend types/index.ts Tontine)
export interface TontineDTO {
  id: string;
  name: string;
  description?: string;
  type: 'presence' | 'optional';
  contributionAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  memberIds: string[];
  membersCount: number;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Map backend periode to frontend frequency
const mapPeriodeToFrequency = (periode: string): TontineDTO['frequency'] => {
  const mapping: Record<string, TontineDTO['frequency']> = {
    'hebdomadaire': 'weekly',
    'bimensuel': 'biweekly',
    'mensuel': 'monthly',
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'monthly': 'monthly',
  };
  return mapping[periode.toLowerCase()] || 'monthly';
};

// Map frontend frequency to backend periode
const mapFrequencyToPeriode = (frequency: TontineDTO['frequency']): string => {
  const mapping: Record<TontineDTO['frequency'], string> = {
    'weekly': 'Hebdomadaire',
    'biweekly': 'Bimensuel',
    'monthly': 'Mensuel',
  };
  return mapping[frequency];
};

// Transform backend Tontine to frontend TontineDTO
const transformToDTO = (tontine: TontineBackend): TontineDTO => ({
  id: String(tontine.id_tontine),
  name: tontine.description || `Tontine #${tontine.id_tontine}`,
  description: tontine.description,
  type: tontine.type.toLowerCase() === 'presence' ? 'presence' : 'optional',
  contributionAmount: tontine.montant_cotisation,
  frequency: mapPeriodeToFrequency(tontine.periode),
  startDate: new Date(tontine.date_debut),
  status: tontine.statut?.toLowerCase() === 'actif' ? 'active' :
          tontine.statut?.toLowerCase() === 'termine' ? 'completed' : 'cancelled',
  memberIds: [],
  membersCount: tontine.membres_count || 0,
  adminId: '1', // Default admin, should be fetched from backend if available
  createdAt: new Date(tontine.date_debut),
  updatedAt: new Date(),
});

// Transform frontend TontineDTO to backend TontineCreate
const transformToBackend = (tontine: Omit<TontineDTO, 'id' | 'createdAt' | 'updatedAt' | 'memberIds' | 'membersCount' | 'adminId'>): TontineCreate => ({
  type: tontine.type === 'presence' ? 'Presence' : 'Optionnel',
  montant_cotisation: tontine.contributionAmount,
  periode: mapFrequencyToPeriode(tontine.frequency),
  description: tontine.name, // Use name as description since backend doesn't have a separate name field
  date_debut: tontine.startDate instanceof Date 
    ? tontine.startDate.toISOString().split('T')[0]
    : tontine.startDate,
  statut: tontine.status === 'active' ? 'Actif' :
          tontine.status === 'completed' ? 'Termine' : 'Annule',
});

/**
 * Get all tontines from the backend
 * Endpoint: GET /tontines
 */
export const getAllTontines = async (): Promise<TontineDTO[]> => {
  const response = await api.get<TontineBackend[]>('/tontines');
  return response.data.map(transformToDTO);
};

/**
 * Get a single tontine by ID
 * Endpoint: GET /tontines/{id_tontine}
 * Note: This endpoint may need to be implemented in the backend
 */
export const getTontineById = async (id: string): Promise<TontineDTO> => {
  const response = await api.get<TontineBackend>(`/tontines/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new tontine
 * Endpoint: POST /tontines
 * Note: This endpoint may need to be implemented in the backend
 */
export const createTontine = async (
  tontine: Omit<TontineDTO, 'id' | 'createdAt' | 'updatedAt' | 'memberIds' | 'membersCount' | 'adminId'>
): Promise<TontineDTO> => {
  const backendData = transformToBackend(tontine);
  const response = await api.post<TontineBackend>('/tontines', backendData);
  return transformToDTO(response.data);
};

/**
 * Update an existing tontine
 * Endpoint: PUT /tontines/{id_tontine}
 * Note: This endpoint may need to be implemented in the backend
 */
export const updateTontine = async (id: string, tontine: Partial<TontineDTO>): Promise<TontineDTO> => {
  const backendData: Partial<TontineBase> = {};

  if (tontine.type !== undefined) {
    backendData.type = tontine.type === 'presence' ? 'Presence' : 'Optionnel';
  }
  if (tontine.contributionAmount !== undefined) {
    backendData.montant_cotisation = tontine.contributionAmount;
  }
  if (tontine.frequency !== undefined) {
    backendData.periode = mapFrequencyToPeriode(tontine.frequency);
  }
  if (tontine.name !== undefined) {
    backendData.description = tontine.name;
  }
  if (tontine.description !== undefined && !tontine.name) {
    backendData.description = tontine.description;
  }
  if (tontine.startDate !== undefined) {
    backendData.date_debut = tontine.startDate instanceof Date
      ? tontine.startDate.toISOString().split('T')[0]
      : tontine.startDate;
  }
  if (tontine.status !== undefined) {
    backendData.statut = tontine.status === 'active' ? 'Actif' :
                         tontine.status === 'completed' ? 'Termine' : 'Annule';
  }

  const response = await api.put<TontineBackend>(`/tontines/${id}`, backendData);
  return transformToDTO(response.data);
};

/**
 * Delete a tontine
 * Endpoint: DELETE /tontines/{id_tontine}
 */
export const deleteTontine = async (id: string): Promise<void> => {
  await api.delete(`/tontines/${id}`);
};
