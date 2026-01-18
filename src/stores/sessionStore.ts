import { create } from 'zustand';
import { Session, CloseSessionRequest, CloseSessionResponse } from '@/types';
import * as sessionService from '@/services/sessionService';

interface SessionStore {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchSessions: () => Promise<void>;
  addSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  closeSession: (sessionId: string, request: CloseSessionRequest) => Promise<CloseSessionResponse>;
  
  // Local state actions
  updateSession: (id: string, session: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => Session | undefined;
  getSessionsByTontineId: (tontineId: string) => Session[];
  clearError: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  // Fetch all sessions from API
  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await sessionService.getAllSessions();
      // Transform SessionDTO to Session type
      const sessions: Session[] = data.map((s) => ({
        id: s.id,
        tontineId: s.tontineId,
        sessionNumber: s.sessionNumber,
        date: s.date,
        location: s.location,
        agenda: s.agenda,
        totalContributions: s.totalContributions,
        totalPenalties: s.totalPenalties,
        attendanceCount: s.attendanceCount,
        status: s.status,
        notes: s.notes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      set({ sessions, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false 
      });
    }
  },

  // Add session via API and update local state
  addSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const sessionDTO = {
        tontineId: sessionData.tontineId,
        date: sessionData.date,
        location: sessionData.location,
        agenda: sessionData.agenda,
        status: sessionData.status,
        notes: sessionData.notes,
      };
      const created = await sessionService.createSession(sessionDTO);
      const newSession: Session = {
        id: created.id,
        tontineId: created.tontineId,
        sessionNumber: sessionData.sessionNumber,
        date: created.date,
        location: created.location,
        agenda: created.agenda,
        totalContributions: sessionData.totalContributions,
        totalPenalties: sessionData.totalPenalties,
        attendanceCount: sessionData.attendanceCount,
        status: created.status,
        notes: created.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ 
        sessions: [...state.sessions, newSession],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add session',
        isLoading: false 
      });
    }
  },

  // Close session and create penalties for absent members
  closeSession: async (sessionId, request) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionService.closeSession(sessionId, request);
      
      // Update session status to closed
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? { 
                ...session, 
                status: 'closed' as const,
                totalPenalties: response.total_penalties,
                totalContributions: response.total_contributions,
                updatedAt: new Date() 
              }
            : session
        ),
        isLoading: false,
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to close session',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateSession: (id, sessionData) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === id
          ? { ...session, ...sessionData, updatedAt: new Date() }
          : session
      ),
    }));
  },
  
  deleteSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== id),
    }));
  },
  
  getSessionById: (id) => {
    return get().sessions.find((session) => session.id === id);
  },
  
  getSessionsByTontineId: (tontineId) => {
    return get().sessions.filter((session) => session.tontineId === tontineId);
  },

  clearError: () => {
    set({ error: null });
  },
}));
