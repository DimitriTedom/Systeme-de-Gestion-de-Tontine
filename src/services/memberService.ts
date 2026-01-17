import api from './api';

// Types matching the backend schemas (schemas.py)
export interface MembreBase {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse?: string;
  commune?: string;
  statut?: string;
}

export interface MembreCreate extends MembreBase {
  date_inscription: string; // ISO date string (YYYY-MM-DD)
}

export interface Membre extends MembreBase {
  id_membre: number;
}

// Frontend-friendly interface (maps to frontend types/index.ts Member)
export interface MemberDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  commune?: string;
  joinedDate: Date;
  status: 'active' | 'inactive' | 'suspended';
}

// Transform backend Membre to frontend MemberDTO
const transformToDTO = (membre: Membre): MemberDTO => ({
  id: String(membre.id_membre),
  firstName: membre.prenom,
  lastName: membre.nom,
  email: membre.email,
  phone: membre.telephone,
  address: membre.adresse,
  commune: membre.commune,
  joinedDate: new Date(),
  status: membre.statut?.toLowerCase() === 'actif' ? 'active' : 
          membre.statut?.toLowerCase() === 'inactif' ? 'inactive' : 'suspended',
});

// Transform frontend MemberDTO to backend MembreCreate
const transformToBackend = (member: Omit<MemberDTO, 'id'>): MembreCreate => ({
  nom: member.lastName,
  prenom: member.firstName,
  email: member.email,
  telephone: member.phone,
  adresse: member.address,
  commune: member.commune,
  statut: member.status === 'active' ? 'Actif' : 
          member.status === 'inactive' ? 'Inactif' : 'Suspendu',
  date_inscription: member.joinedDate.toISOString().split('T')[0],
});

/**
 * Get all members from the backend
 * Endpoint: GET /membres
 */
export const getAllMembers = async (): Promise<MemberDTO[]> => {
  const response = await api.get<Membre[]>('/membres');
  return response.data.map(transformToDTO);
};

/**
 * Get a single member by ID
 * Endpoint: GET /membres/{id_membre}
 * Note: This endpoint may need to be implemented in the backend
 */
export const getMemberById = async (id: string): Promise<MemberDTO> => {
  const response = await api.get<Membre>(`/membres/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new member
 * Endpoint: POST /membres
 */
export const createMember = async (member: Omit<MemberDTO, 'id'>): Promise<MemberDTO> => {
  const backendData = transformToBackend(member);
  const response = await api.post<Membre>('/membres', backendData);
  return transformToDTO(response.data);
};

/**
 * Update an existing member
 * Endpoint: PUT /membres/{id_membre}
 * Note: This endpoint may need to be implemented in the backend
 */
export const updateMember = async (id: string, member: Partial<MemberDTO>): Promise<MemberDTO> => {
  const backendData: Partial<MembreBase> = {};
  
  if (member.lastName !== undefined) backendData.nom = member.lastName;
  if (member.firstName !== undefined) backendData.prenom = member.firstName;
  if (member.email !== undefined) backendData.email = member.email;
  if (member.phone !== undefined) backendData.telephone = member.phone;
  if (member.address !== undefined) backendData.adresse = member.address;
  if (member.commune !== undefined) backendData.commune = member.commune;
  if (member.status !== undefined) {
    backendData.statut = member.status === 'active' ? 'Actif' : 
                         member.status === 'inactive' ? 'Inactif' : 'Suspendu';
  }

  const response = await api.put<Membre>(`/membres/${id}`, backendData);
  return transformToDTO(response.data);
};

/**
 * Delete a member
 * Endpoint: DELETE /membres/{id_membre}
 */
export const deleteMember = async (id: string): Promise<void> => {
  await api.delete(`/membres/${id}`);
};

/**
 * Register a member to a tontine (PARTICIPE relationship)
 * Endpoint: POST /membres/{id_membre}/register
 */
export const registerMemberToTontine = async (
  memberId: string, 
  tontineId: string, 
  nbParts: number
): Promise<void> => {
  await api.post(`/membres/${memberId}/register`, {
    id_tontine: parseInt(tontineId),
    nb_parts: nbParts,
  });
};

// Backend schema for member tontine participation
export interface MemberTontineParticipation {
  id_tontine: number;
  type: string;
  montant_cotisation: number;
  periode: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  statut: string;
  nb_parts: number;
}

/**
 * Get all tontines a member is registered to
 * Endpoint: GET /membres/{id_membre}/tontines
 */
export const getMemberTontines = async (memberId: string): Promise<MemberTontineParticipation[]> => {
  const response = await api.get<MemberTontineParticipation[]>(`/membres/${memberId}/tontines`);
  return response.data;
};
