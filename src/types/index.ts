// Core Entity Interfaces for NjangiTech Tontine Management System

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  joinedDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tontine {
  id: string;
  name: string;
  description?: string;
  type: 'presence' | 'optional';
  contributionAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  memberIds: string[];
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  tontineId: string;
  sessionNumber: number;
  date: Date;
  location?: string;
  agenda?: string;
  totalContributions: number;
  totalPenalties: number;
  attendanceCount: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  id: string;
  sessionId: string;
  memberId: string;
  tontineId: string;
  amount: number;
  expectedAmount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money';
  status: 'pending' | 'partial' | 'completed' | 'late';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Credit {
  id: string;
  tontineId: string;
  memberId: string;
  amount: number;
  interestRate: number;
  disbursementDate: Date;
  dueDate: Date;
  repaymentAmount: number;
  amountPaid: number;
  status: 'pending' | 'approved' | 'disbursed' | 'repaying' | 'completed' | 'defaulted';
  guarantorIds?: string[];
  purpose?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Penalty {
  id: string;
  sessionId: string;
  memberId: string;
  tontineId: string;
  amount: number;
  reason: string;
  penaltyType: 'late_contribution' | 'absence' | 'misconduct' | 'other';
  status: 'pending' | 'paid' | 'waived';
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  tontineId: string;
  name: string;
  description: string;
  budget: number;
  amountRaised: number;
  startDate: Date;
  targetDate?: Date;
  completionDate?: Date;
  status: 'planned' | 'fundraising' | 'in_progress' | 'completed' | 'cancelled';
  responsibleMemberId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Additional helper types
export interface TontineWithMembers extends Tontine {
  members: Member[];
  admin: Member;
}

export interface SessionWithDetails extends Session {
  tontine: Tontine;
  contributions: Contribution[];
  penalties: Penalty[];
}

export interface CreditWithMember extends Credit {
  member: Member;
  guarantors?: Member[];
}

export interface ProjectWithTontine extends Project {
  tontine: Tontine;
  responsibleMember?: Member;
}
