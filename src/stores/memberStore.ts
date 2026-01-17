import { create } from 'zustand';
import { Member } from '@/types';
import * as memberService from '@/services/memberService';

interface MemberStore {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  
  // Async API actions
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  // Local state actions
  getMemberById: (id: string) => Member | undefined;
  clearError: () => void;
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
  isLoading: false,
  error: null,

  // Fetch all members from API
  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await memberService.getAllMembers();
      // Transform MemberDTO to Member type
      const members: Member[] = data.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        address: m.address,
        joinedDate: m.joinedDate,
        status: m.status,
        createdAt: m.joinedDate,
        updatedAt: new Date(),
      }));
      set({ members, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch members',
        isLoading: false 
      });
    }
  },

  // Add member via API and update local state
  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      const memberDTO = {
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        phone: memberData.phone,
        address: memberData.address,
        joinedDate: memberData.joinedDate,
        status: memberData.status,
      };
      const created = await memberService.createMember(memberDTO);
      const newMember: Member = {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        phone: created.phone,
        address: created.address,
        joinedDate: created.joinedDate,
        status: created.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ 
        members: [...state.members, newMember],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add member',
        isLoading: false 
      });
    }
  },
  
  // Update member via API and update local state
  updateMember: async (id, memberData) => {
    set({ isLoading: true, error: null });
    try {
      const memberDTO: Partial<memberService.MemberDTO> = {};
      
      if (memberData.firstName !== undefined) memberDTO.firstName = memberData.firstName;
      if (memberData.lastName !== undefined) memberDTO.lastName = memberData.lastName;
      if (memberData.email !== undefined) memberDTO.email = memberData.email;
      if (memberData.phone !== undefined) memberDTO.phone = memberData.phone;
      if (memberData.address !== undefined) memberDTO.address = memberData.address;
      if (memberData.status !== undefined) memberDTO.status = memberData.status;

      const updated = await memberService.updateMember(id, memberDTO);
      
      set((state) => ({
        members: state.members.map((member) =>
          member.id === id
            ? {
                ...member,
                firstName: updated.firstName,
                lastName: updated.lastName,
                email: updated.email,
                phone: updated.phone,
                address: updated.address,
                status: updated.status,
                updatedAt: new Date(),
              }
            : member
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update member',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Delete member via API and update local state
  deleteMember: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await memberService.deleteMember(id);
      set((state) => ({
        members: state.members.filter((member) => member.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete member',
        isLoading: false 
      });
      throw error;
    }
  },
  
  getMemberById: (id) => {
    return get().members.find((member) => member.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
