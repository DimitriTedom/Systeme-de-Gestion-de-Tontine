import api from './api';

// Backend schema types
export interface ProjetBackend {
  id_projet: number;
  nom: string;
  description: string | null;
  budget: number;
  montant_alloue: number;
  date_debut: string;
  date_fin: string | null;
  statut: string;
  id_responsable: number | null;
  id_tontine: number;
}

export interface ProjetCreate {
  nom: string;
  description?: string;
  budget: number;
  montant_alloue?: number;
  date_debut: string;
  date_fin?: string;
  statut?: string;
  id_responsable?: number;
  id_tontine: number;
}

export interface ProjetUpdate {
  nom?: string;
  description?: string;
  budget?: number;
  montant_alloue?: number;
  date_fin?: string;
  statut?: string;
}

// Frontend DTO type
export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  budget: number;
  amountRaised: number;
  startDate: Date;
  targetDate: Date | null;
  completionDate: Date | null;
  status: 'planned' | 'fundraising' | 'in_progress' | 'completed' | 'cancelled';
  responsibleMemberId: string | null;
  tontineId: string;
}

// Map backend statut to frontend status
const mapStatutToStatus = (statut: string): ProjectDTO['status'] => {
  const mapping: Record<string, ProjectDTO['status']> = {
    'en_cours': 'in_progress',
    'termine': 'completed',
    'planifie': 'planned',
    'collecte': 'fundraising',
    'annule': 'cancelled',
  };
  return mapping[statut] || 'planned';
};

// Map frontend status to backend statut
const mapStatusToStatut = (status: string): string => {
  const mapping: Record<string, string> = {
    'planned': 'planifie',
    'fundraising': 'collecte',
    'in_progress': 'en_cours',
    'completed': 'termine',
    'cancelled': 'annule',
  };
  return mapping[status] || 'en_cours';
};

// Transform backend data to frontend DTO
const transformToDTO = (projet: ProjetBackend): ProjectDTO => ({
  id: String(projet.id_projet),
  name: projet.nom,
  description: projet.description || '',
  budget: projet.budget,
  amountRaised: projet.montant_alloue,
  startDate: new Date(projet.date_debut),
  targetDate: projet.date_fin ? new Date(projet.date_fin) : null,
  completionDate: projet.statut === 'termine' && projet.date_fin ? new Date(projet.date_fin) : null,
  status: mapStatutToStatus(projet.statut),
  responsibleMemberId: projet.id_responsable ? String(projet.id_responsable) : null,
  tontineId: String(projet.id_tontine),
});

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<ProjectDTO[]> => {
  const response = await api.get<ProjetBackend[]>('/projets');
  return response.data.map(transformToDTO);
};

/**
 * Get projects by tontine ID
 */
export const getProjectsByTontineId = async (tontineId: string): Promise<ProjectDTO[]> => {
  const response = await api.get<ProjetBackend[]>('/projets', {
    params: { id_tontine: tontineId }
  });
  return response.data.map(transformToDTO);
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (id: string): Promise<ProjectDTO> => {
  const response = await api.get<ProjetBackend>(`/projets/${id}`);
  return transformToDTO(response.data);
};

/**
 * Create a new project
 */
export const createProject = async (
  project: Omit<ProjectDTO, 'id'>
): Promise<ProjectDTO> => {
  const formatDate = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date.split('T')[0];
  };

  const backendData: ProjetCreate = {
    nom: project.name,
    description: project.description || undefined,
    budget: project.budget,
    montant_alloue: project.amountRaised || 0,
    date_debut: formatDate(project.startDate),
    date_fin: project.targetDate ? formatDate(project.targetDate) : undefined,
    statut: mapStatusToStatut(project.status),
    id_responsable: project.responsibleMemberId ? parseInt(project.responsibleMemberId, 10) : undefined,
    id_tontine: parseInt(project.tontineId, 10),
  };
  const response = await api.post<ProjetBackend>('/projets', backendData);
  return transformToDTO(response.data);
};

/**
 * Update a project
 */
export const updateProject = async (
  id: string, 
  update: Partial<ProjectDTO>
): Promise<ProjectDTO> => {
  const backendUpdate: ProjetUpdate = {};
  if (update.name) backendUpdate.nom = update.name;
  if (update.description) backendUpdate.description = update.description;
  if (update.budget !== undefined) backendUpdate.budget = update.budget;
  if (update.amountRaised !== undefined) backendUpdate.montant_alloue = update.amountRaised;
  if (update.targetDate) {
    backendUpdate.date_fin = update.targetDate instanceof Date 
      ? update.targetDate.toISOString().split('T')[0] 
      : String(update.targetDate);
  }
  if (update.status) backendUpdate.statut = mapStatusToStatut(update.status);
  
  const response = await api.put<ProjetBackend>(`/projets/${id}`, backendUpdate);
  return transformToDTO(response.data);
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projets/${id}`);
};
