import api from './api';
import type { CloseSessionRequest, CloseSessionResponse } from '@/types';

// Types matching the backend schemas (schemas.py)
export interface SeanceCreate {
  date: string; // ISO date string (YYYY-MM-DD)
  lieu: string;
  statut: string;
  id_tontine: number;
  notes?: string;
}

export interface SeanceBackend {
  id_seance: number;
  date: string;
  lieu: string;
  statut: string;
  id_tontine: number;
  notes?: string;
}

// Frontend-friendly interface (maps to frontend types/index.ts Session)
export interface SessionDTO {
  id: string;
  tontineId: string;
  sessionNumber: number;
  date: Date;
  location?: string;
  agenda?: string;
  totalContributions: number;
  totalPenalties: number;
  attendanceCount: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Map backend statut to frontend status
const mapStatutToStatus = (statut: string): SessionDTO['status'] => {
  const mapping: Record<string, SessionDTO['status']> = {
    'planifie': 'scheduled',
    'scheduled': 'scheduled',
    'en_cours': 'ongoing',
    'ongoing': 'ongoing',
    'termine': 'completed',
    'completed': 'completed',
    'annule': 'cancelled',
    'cancelled': 'cancelled',
    'cloturee': 'closed',
    'closed': 'closed',
  };
  return mapping[statut.toLowerCase()] || 'scheduled';
};

// Map frontend status to backend statut
const mapStatusToStatut = (status: SessionDTO['status']): string => {
  const mapping: Record<SessionDTO['status'], string> = {
    'scheduled': 'Planifie',
    'ongoing': 'En_cours',
    'completed': 'Termine',
    'cancelled': 'Annule',
    'closed': 'Cloturee',
  };
  return mapping[status];
};

// Transform backend Seance to frontend SessionDTO
const transformToDTO = (seance: SeanceBackend, sessionNumber: number = 1): SessionDTO => ({
  id: String(seance.id_seance),
  tontineId: String(seance.id_tontine),
  sessionNumber: sessionNumber,
  date: new Date(seance.date),
  location: seance.lieu,
  agenda: seance.notes,
  totalContributions: 0, // These would need to be fetched separately or included in backend response
  totalPenalties: 0,
  attendanceCount: 0,
  status: mapStatutToStatus(seance.statut),
  notes: seance.notes,
  createdAt: new Date(seance.date),
  updatedAt: new Date(),
});

// Transform frontend SessionDTO to backend SeanceCreate
const transformToBackend = (session: Omit<SessionDTO, 'id' | 'createdAt' | 'updatedAt' | 'totalContributions' | 'totalPenalties' | 'attendanceCount' | 'sessionNumber'>): SeanceCreate => ({
  date: session.date instanceof Date
    ? session.date.toISOString().split('T')[0]
    : session.date,
  lieu: session.location || '',
  statut: mapStatusToStatut(session.status),
  id_tontine: parseInt(session.tontineId, 10),
  notes: session.notes || session.agenda,
});

/**
 * Get all sessions from the backend
 * Endpoint: GET /seances
 * Note: This endpoint may need to be implemented in the backend
 */
export const getAllSessions = async (): Promise<SessionDTO[]> => {
  const response = await api.get<SeanceBackend[]>('/seances');
  return response.data.map((seance, index) => transformToDTO(seance, index + 1));
};

/**
 * Get sessions by tontine ID
 * Endpoint: GET /seances?id_tontine={id}
 * Note: This endpoint may need to be implemented in the backend
 */
export const getSessionsByTontineId = async (tontineId: string): Promise<SessionDTO[]> => {
  const response = await api.get<SeanceBackend[]>(`/seances`, {
    params: { id_tontine: tontineId }
  });
  return response.data.map((seance, index) => transformToDTO(seance, index + 1));
};

/**
 * Get a single session by ID
 * Endpoint: GET /seances/{id_seance}
 * Note: This endpoint may need to be implemented in the backend
 */
export const getSessionById = async (id: string): Promise<SessionDTO> => {
  const response = await api.get<SeanceBackend>(`/seances/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new session
 * Endpoint: POST /seances
 * Note: This endpoint may need to be implemented in the backend
 */
export const createSession = async (
  session: Omit<SessionDTO, 'id' | 'createdAt' | 'updatedAt' | 'totalContributions' | 'totalPenalties' | 'attendanceCount' | 'sessionNumber'>
): Promise<SessionDTO> => {
  const backendData = transformToBackend(session);
  const response = await api.post<SeanceBackend>('/seances', backendData);
  return transformToDTO(response.data);
};

/**
 * Update an existing session
 * Endpoint: PUT /seances/{id_seance}
 * Note: This endpoint may need to be implemented in the backend
 */
export const updateSession = async (id: string, session: Partial<SessionDTO>): Promise<SessionDTO> => {
  const backendData: Partial<SeanceCreate> = {};

  if (session.date !== undefined) {
    backendData.date = session.date instanceof Date
      ? session.date.toISOString().split('T')[0]
      : session.date;
  }
  if (session.location !== undefined) {
    backendData.lieu = session.location;
  }
  if (session.status !== undefined) {
    backendData.statut = mapStatusToStatut(session.status);
  }
  if (session.tontineId !== undefined) {
    backendData.id_tontine = parseInt(session.tontineId, 10);
  }
  if (session.notes !== undefined || session.agenda !== undefined) {
    backendData.notes = session.notes || session.agenda;
  }

  const response = await api.put<SeanceBackend>(`/seances/${id}`, backendData);
  return transformToDTO(response.data);
};

/**
 * Delete a session
 * Endpoint: DELETE /seances/{id_seance}
 */
export const deleteSession = async (id: string): Promise<void> => {
  await api.delete(`/seances/${id}`);
};

/**
 * Create multiple contributions in bulk
 * Endpoint: POST /cotisations/bulk
 */
export interface CotisationCreate {
  montant: number;
  date_paiement: string;
  id_membre: number;
  id_seance: number;
}

export const createBulkContributions = async (contributions: CotisationCreate[]): Promise<void> => {
  await api.post('/cotisations/bulk', {
    cotisations: contributions
  });
};

/**
 * Close a session and create penalties for absent members
 * Endpoint: POST /seances/{id_seance}/close
 */
export const closeSession = async (
  sessionId: string,
  closeRequest: CloseSessionRequest
): Promise<CloseSessionResponse> => {
  const response = await api.post<CloseSessionResponse>(`/seances/${sessionId}/close`, closeRequest);
  return response.data;
};

/**
 * Get session attendance (members with expected contributions)
 * Endpoint: GET /seances/{id_seance}/attendance
 */
export interface SessionAttendanceMember {
  id_membre: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nb_parts: number;
  expected_contribution: number;
  statut: string;
}

export const getSessionAttendance = async (sessionId: string): Promise<SessionAttendanceMember[]> => {
  const response = await api.get<SessionAttendanceMember[]>(`/seances/${sessionId}/attendance`);
  return response.data;
};
