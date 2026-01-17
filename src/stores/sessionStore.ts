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

// Mock data for initial state
const mockSessions: Session[] = [
  {
    id: '1',
    tontineId: '1',
    sessionNumber: 1,
    date: new Date('2024-01-15'),
    location: 'Salle de réunion, Université de Yaoundé I',
    agenda: 'Première session de la tontine - Introduction et règles',
    totalContributions: 150000,
    totalPenalties: 0,
    attendanceCount: 3,
    status: 'completed',
    notes: 'Excellente participation',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tontineId: '2',
    sessionNumber: 1,
    date: new Date('2024-02-05'),
    location: 'Centre communautaire, Douala',
    agenda: 'Lancement de la tontine Solidarité',
    totalContributions: 40000,
    totalPenalties: 5000,
    attendanceCount: 4,
    status: 'completed',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '3',
    tontineId: '1',
    sessionNumber: 2,
    date: new Date('2024-02-15'),
    location: 'Salle de réunion, Université de Yaoundé I',
    agenda: 'Deuxième session - Distribution et cotisations',
    totalContributions: 150000,
    totalPenalties: 0,
    attendanceCount: 3,
    status: 'completed',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '4',
    tontineId: '3',
    sessionNumber: 1,
    date: new Date('2024-01-20'),
    location: 'Bureau principal, Bafoussam',
    agenda: 'Session inaugurale - Investissement',
    totalContributions: 300000,
    totalPenalties: 0,
    attendanceCount: 3,
    status: 'completed',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: mockSessions,
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
