import { create } from 'zustand';
import { Member } from '@/types';

interface MemberStore {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
}

// Mock data for initial state
const mockMembers: Member[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+237 6 77 88 99 00',
    address: 'Yaoundé, Cameroun',
    dateOfBirth: new Date('1990-05-15'),
    joinedDate: new Date('2024-01-10'),
    status: 'active',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Kamga',
    email: 'marie.kamga@example.com',
    phone: '+237 6 55 44 33 22',
    address: 'Douala, Cameroun',
    dateOfBirth: new Date('1988-08-22'),
    joinedDate: new Date('2024-01-12'),
    status: 'active',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    firstName: 'Paul',
    lastName: 'Nguessop',
    email: 'paul.nguessop@example.com',
    phone: '+237 6 99 11 22 33',
    address: 'Bafoussam, Cameroun',
    dateOfBirth: new Date('1992-03-10'),
    joinedDate: new Date('2024-01-15'),
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Ndifor',
    email: 'sophie.ndifor@example.com',
    phone: '+237 6 88 77 66 55',
    address: 'Bamenda, Cameroun',
    dateOfBirth: new Date('1995-11-30'),
    joinedDate: new Date('2024-01-18'),
    status: 'active',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '5',
    firstName: 'Emmanuel',
    lastName: 'Tchuente',
    email: 'emmanuel.tchuente@example.com',
    phone: '+237 6 44 33 22 11',
    address: 'Garoua, Cameroun',
    dateOfBirth: new Date('1987-07-25'),
    joinedDate: new Date('2024-01-20'),
    status: 'inactive',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: mockMembers,
  
  addMember: (memberData) => {
    const newMember: Member = {
      ...memberData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ members: [...state.members, newMember] }));
  },
  
  updateMember: (id, memberData) => {
    set((state) => ({
      members: state.members.map((member) =>
        member.id === id
          ? { ...member, ...memberData, updatedAt: new Date() }
          : member
      ),
    }));
  },
  
  deleteMember: (id) => {
    set((state) => ({
      members: state.members.filter((member) => member.id !== id),
    }));
  },
  
  getMemberById: (id) => {
    return get().members.find((member) => member.id === id);
  },
}));
