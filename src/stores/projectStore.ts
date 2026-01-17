import { create } from 'zustand';
import * as projectService from '@/services/projectService';
import { ProjectDTO } from '@/services/projectService';

// Re-export for convenience
export type Project = ProjectDTO;

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Local state getters
  getProjectById: (id: string) => Project | undefined;
  getProjectsByTontineId: (tontineId: string) => Project[];
  getActiveProjects: () => Project[];
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await projectService.getAllProjects();
      set({ projects: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        isLoading: false 
      });
    }
  },

  addProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await projectService.createProject(projectData);
      set((state) => ({ 
        projects: [...state.projects, created],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add project',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await projectService.updateProject(id, projectData);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? updated : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update project',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false 
      });
      throw error;
    }
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  getProjectsByTontineId: (tontineId) => {
    return get().projects.filter((p) => p.tontineId === tontineId);
  },

  getActiveProjects: () => {
    return get().projects.filter((p) => p.status === 'in_progress');
  },

  clearError: () => {
    set({ error: null });
  },
}));
