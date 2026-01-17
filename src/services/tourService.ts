import api from './api';

// Backend schema types
export interface TourBackend {
  id_tour: number;
  numero: number;
  date: string;
  montant_distribue: number;
  id_membre: number;
  id_tontine: number;
  id_seance?: number;
  beneficiaire_nom: string | null;
  beneficiaire_prenom: string | null;
}

export interface TourCreate {
  numero: number;
  date: string;
  montant_distribue: number;
  id_membre: number;
  id_tontine: number;
  id_seance?: number;
}

export interface EligibleBeneficiary {
  id: string;
  nom: string;
  prenom: string;
  hasReceivedTour: boolean;
}

// Frontend DTO type
export interface TourDTO {
  id: string;
  tourNumber: number;
  dateTour: Date;
  amount: number;
  beneficiaryId: string;
  tontineId: string;
  sessionId: string | null;
  beneficiaryName: string;
}

// Transform backend data to frontend DTO
const transformToDTO = (tour: TourBackend): TourDTO => ({
  id: String(tour.id_tour),
  tourNumber: tour.numero,
  dateTour: new Date(tour.date),
  amount: tour.montant_distribue,
  beneficiaryId: String(tour.id_membre),
  tontineId: String(tour.id_tontine),
  sessionId: tour.id_seance ? String(tour.id_seance) : null,
  beneficiaryName: tour.beneficiaire_prenom && tour.beneficiaire_nom 
    ? `${tour.beneficiaire_prenom} ${tour.beneficiaire_nom}`
    : 'Unknown',
});

/**
 * Get all tours
 */
export const getAllTours = async (): Promise<TourDTO[]> => {
  const response = await api.get<TourBackend[]>('/tours');
  return response.data.map(transformToDTO);
};

/**
 * Get tours by tontine ID
 */
export const getToursByTontineId = async (tontineId: string): Promise<TourDTO[]> => {
  const response = await api.get<TourBackend[]>('/tours', {
    params: { id_tontine: tontineId }
  });
  return response.data.map(transformToDTO);
};

/**
 * Get tours by member ID (beneficiary)
 */
export const getToursByMemberId = async (memberId: string): Promise<TourDTO[]> => {
  const response = await api.get<TourBackend[]>('/tours', {
    params: { id_membre: memberId }
  });
  return response.data.map(transformToDTO);
};

/**
 * Get a single tour by ID
 */
export const getTourById = async (id: string): Promise<TourDTO> => {
  const response = await api.get<TourBackend>(`/tours/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new tour (assign beneficiary)
 */
export const createTour = async (
  tour: Omit<TourDTO, 'id' | 'beneficiaryName'>
): Promise<TourDTO> => {
  const backendData: TourCreate = {
    numero: tour.tourNumber,
    date: tour.dateTour instanceof Date 
      ? tour.dateTour.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    montant_distribue: tour.amount,
    id_membre: parseInt(tour.beneficiaryId, 10),
    id_tontine: parseInt(tour.tontineId, 10),
    id_seance: tour.sessionId ? parseInt(tour.sessionId, 10) : undefined,
  };
  const response = await api.post<TourBackend>('/tours', backendData);
  return transformToDTO(response.data);
};

/**
 * Delete a tour
 */
export const deleteTour = async (id: string): Promise<void> => {
  await api.delete(`/tours/${id}`);
};

/**
 * Get next tour number for a tontine
 */
export const getNextTourNumber = async (tontineId: string): Promise<number> => {
  const response = await api.get<{ next_numero: number }>(`/tours/tontine/${tontineId}/next-number`);
  return response.data.next_numero;
};

/**
 * Get eligible beneficiaries (members who haven't received yet)
 */
export const getEligibleBeneficiaries = async (tontineId: string): Promise<EligibleBeneficiary[]> => {
  interface BackendEligible {
    id_membre: number;
    nom: string;
    prenom: string;
    has_received?: boolean;
  }
  const response = await api.get<BackendEligible[]>(`/tours/tontine/${tontineId}/eligible-beneficiaries`);
  return response.data.map((b) => ({
    id: String(b.id_membre),
    nom: b.nom,
    prenom: b.prenom,
    hasReceivedTour: b.has_received || false,
  }));
};

/**
 * Get total contributions for a session
 */
export const getSessionTotalContributions = async (sessionId: string): Promise<number> => {
  const response = await api.get<{ total: number }>(`/seances/${sessionId}/total-contributions`);
  return response.data.total;
};
