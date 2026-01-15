import { create } from 'zustand';
import { Project } from '@/types';

interface ProjectStore {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByTontineId: (tontineId: string) => Project[];
}

// Mock data for projects (FIAC - Fonds d'Investissement et d'Aide Communautaire)
const mockProjects: Project[] = [
  {
    id: 'project-1',
    tontineId: 'tontine-1',
    name: 'Construction École Primaire',
    description: 'Construction d\'une école primaire pour la communauté de Douala',
    budget: 15000000,
    amountRaised: 8500000,
    startDate: new Date('2025-10-01'),
    targetDate: new Date('2026-08-01'),
    status: 'fundraising',
    responsibleMemberId: 'member-1',
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'project-2',
    tontineId: 'tontine-1',
    name: 'Forage d\'Eau Potable',
    description: 'Installation de 3 points d\'eau potable dans le quartier',
    budget: 5000000,
    amountRaised: 5000000,
    startDate: new Date('2025-06-01'),
    targetDate: new Date('2025-12-01'),
    completionDate: new Date('2025-11-28'),
    status: 'completed',
    responsibleMemberId: 'member-2',
    createdAt: new Date('2025-05-10'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id: 'project-3',
    tontineId: 'tontine-2',
    name: 'Projet Agricole Coopératif',
    description: 'Mise en place d\'une ferme agricole coopérative pour générer des revenus',
    budget: 8000000,
    amountRaised: 3200000,
    startDate: new Date('2026-01-15'),
    targetDate: new Date('2026-06-30'),
    status: 'fundraising',
    responsibleMemberId: 'member-3',
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'project-4',
    tontineId: 'tontine-1',
    name: 'Électrification du Quartier',
    description: 'Extension du réseau électrique pour 50 foyers',
    budget: 12000000,
    amountRaised: 1500000,
    startDate: new Date('2026-03-01'),
    targetDate: new Date('2026-12-31'),
    status: 'planned',
    responsibleMemberId: 'member-4',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-10'),
  },
];

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: mockProjects,

  addProject: (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
  },

  updateProject: (id, projectData) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id
          ? { ...project, ...projectData, updatedAt: new Date() }
          : project
      ),
    }));
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }));
  },

  getProjectById: (id) => {
    return get().projects.find((project) => project.id === id);
  },

  getProjectsByTontineId: (tontineId) => {
    return get().projects.filter((project) => project.tontineId === tontineId);
  },
}));
