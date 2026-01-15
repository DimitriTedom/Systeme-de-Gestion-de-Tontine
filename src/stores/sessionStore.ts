import { create } from 'zustand';
import { Session } from '@/types';

interface SessionStore {
  sessions: Session[];
  addSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (id: string, session: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => Session | undefined;
  getSessionsByTontineId: (tontineId: string) => Session[];
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
  
  addSession: (sessionData) => {
    const newSession: Session = {
      ...sessionData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ sessions: [...state.sessions, newSession] }));
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
}));
