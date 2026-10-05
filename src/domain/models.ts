import {
  CongregationConfig,
  CreditEntry,
  MonthlyReport,
  PioneerType,
  ServiceMonthNumber,
} from './types';

export type UserRole = 'secretary' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  congregationId: string;
}

export interface Congregation {
  id: string;
  name: string;
  groups_count: number;
  config: CongregationConfig;
  createdAt: string;
  setup_completed?: boolean;
  congregation_number?: string;
}

export interface ServiceYear {
  id: string; // e.g. "2025-2026"
  label: string;
  start_date: string;
  end_date: string;
  closed: boolean;
}

export interface Pioneer {
  id: string;
  first_name: string;
  last_name: string;
  group_number: number;
  active: boolean;
  pioneer_since?: string; // e.g. "2020-09-01"
}

export interface PioneerYearRecord {
  id: string; // `${pioneerId}_${yearId}`
  pioneerId: string;
  yearId: string;
  pioneer_type: PioneerType;
  start_month: ServiceMonthNumber; // 1-12, 1 = septiembre
  goal_override?: number | null;
  approval_date?: string | null;
  s21_noted?: boolean;
}

export interface MonthLockStatus {
  id: string; // `${yearId}_${month}`
  yearId: string;
  month: ServiceMonthNumber;
  sent: boolean;
  sentAt?: string;
  sentBy?: string;
}

export interface PrivateNote {
  pioneerId: string;
  note: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PioneerReview {
  id: string; // `${pioneerId}_${yearId}`
  pioneerId: string;
  yearId: string;
  march_meeting_date?: string | null;
  march_meeting_notes?: string;
  year_end_review_date?: string | null;
  year_end_notes?: string;
}

export interface AuditLogEntry {
  id: string;
  uid: string;
  user_email: string;
  action: 'create' | 'update' | 'delete' | 'lock_month' | 'unlock_month' | 'close_year';
  entity: 'pioneer' | 'report' | 'credit' | 'note' | 'config' | 'congregation' | 'service_year';
  details: string;
  timestamp: string;
}

export interface UserInvite {
  email: string;
  role: UserRole;
  invitedBy: string;
  createdAt: string;
}
