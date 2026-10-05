import {
  AuditLogEntry,
  Congregation,
  MonthLockStatus,
  Pioneer,
  PioneerReview,
  PioneerYearRecord,
  PrivateNote,
  ServiceYear,
  UserProfile,
} from './models';
import { CreditEntry, DEFAULT_CONGREGATION_CONFIG, MonthlyReport, ServiceMonthNumber } from './types';

export const INITIAL_CONGREGATION: Congregation = {
  id: 'cong-central-01',
  name: 'Congregación Central',
  groups_count: 6,
  config: {
    ...DEFAULT_CONGREGATION_CONFIG,
    monthly_goal: 50,
    full_year_goal: 600,
    full_year_minimum: 560,
    monthly_cap: 55,
    require_hours_for_credit: true,
    near_threshold: 40,
    pace_ok_pct: 1.0,
    pace_late_pct: 0.8,
    pace_unrealistic_hours: 70,
    reference_month_mode: 'last_report',
  },
  createdAt: '2025-09-01T00:00:00Z',
  setup_completed: true,
};

export const INITIAL_USER: UserProfile = {
  uid: 'user-sec-01',
  email: 'secretario@congregacion.org',
  displayName: 'Hermano Secretario',
  role: 'secretary',
  congregationId: 'cong-central-01',
};

export const INITIAL_SERVICE_YEARS: ServiceYear[] = [
  {
    id: '2025-2026',
    label: '2025-2026 (Actual)',
    start_date: '2025-09-01',
    end_date: '2026-08-31',
    closed: false,
  },
  {
    id: '2024-2025',
    label: '2024-2025',
    start_date: '2024-09-01',
    end_date: '2025-08-31',
    closed: true,
  },
];

export const INITIAL_PIONEERS: Pioneer[] = [
  {
    id: 'p-1',
    first_name: 'Carlos',
    last_name: 'Morales',
    group_number: 1,
    active: true,
    pioneer_since: '2019-09-01',
  },
  {
    id: 'p-2',
    first_name: 'Elena',
    last_name: 'Vázquez',
    group_number: 2,
    active: true,
    pioneer_since: '2021-09-01',
  },
  {
    id: 'p-3',
    first_name: 'Javier',
    last_name: 'Romero',
    group_number: 3,
    active: true,
    pioneer_since: '2022-09-01',
  },
  {
    id: 'p-4',
    first_name: 'Marta',
    last_name: 'Gómez',
    group_number: 1,
    active: true,
    pioneer_since: '2026-01-01',
  },
  {
    id: 'p-5',
    first_name: 'Rosa',
    last_name: 'Pérez',
    group_number: 4,
    active: true,
    pioneer_since: '2008-09-01',
  },
  {
    id: 'p-6',
    first_name: 'Fernando',
    last_name: 'Castro',
    group_number: 2,
    active: true,
    pioneer_since: '2018-09-01',
  },
  {
    id: 'p-7',
    first_name: 'Lucía',
    last_name: 'Morales',
    group_number: 3,
    active: true,
    pioneer_since: '2026-02-01',
  },
  {
    id: 'p-8',
    first_name: 'Roberto',
    last_name: 'Silva',
    group_number: 5,
    active: true,
    pioneer_since: '2023-09-01',
  },
];

export const INITIAL_PIONEER_YEARS: PioneerYearRecord[] = [
  {
    id: 'p-1_2025-2026',
    pioneerId: 'p-1',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 1, // Septiembre
  },
  {
    id: 'p-2_2025-2026',
    pioneerId: 'p-2',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-3_2025-2026',
    pioneerId: 'p-3',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-4_2025-2026',
    pioneerId: 'p-4',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 5, // Enero -> 400 h
  },
  {
    id: 'p-5_2025-2026',
    pioneerId: 'p-5',
    yearId: '2025-2026',
    pioneer_type: 'salud_delicada',
    start_month: 1,
    approval_date: '2024-05-10',
    s21_noted: true,
  },
  {
    id: 'p-6_2025-2026',
    pioneerId: 'p-6',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-7_2025-2026',
    pioneerId: 'p-7',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 6, // Febrero -> 350 h
  },
  {
    id: 'p-8_2025-2026',
    pioneerId: 'p-8',
    yearId: '2025-2026',
    pioneer_type: 'regular',
    start_month: 1,
  },

  // Año de Servicio Anterior: 2024-2025 (Cerrado)
  {
    id: 'p-1_2024-2025',
    pioneerId: 'p-1',
    yearId: '2024-2025',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-2_2024-2025',
    pioneerId: 'p-2',
    yearId: '2024-2025',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-3_2024-2025',
    pioneerId: 'p-3',
    yearId: '2024-2025',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-5_2024-2025',
    pioneerId: 'p-5',
    yearId: '2024-2025',
    pioneer_type: 'salud_delicada',
    start_month: 1,
    approval_date: '2024-05-10',
    s21_noted: true,
  },
  {
    id: 'p-6_2024-2025',
    pioneerId: 'p-6',
    yearId: '2024-2025',
    pioneer_type: 'regular',
    start_month: 1,
  },
  {
    id: 'p-8_2024-2025',
    pioneerId: 'p-8',
    yearId: '2024-2025',
    pioneer_type: 'regular',
    start_month: 1,
  },
];

export const INITIAL_REPORTS: (MonthlyReport & { pioneerId: string; yearId: string })[] = [
  // Carlos Morales (High performer, months 1 to 6)
  { pioneerId: 'p-1', yearId: '2025-2026', month: 1, preaching_hours: 55, bible_studies: 4 },
  { pioneerId: 'p-1', yearId: '2025-2026', month: 2, preaching_hours: 52, bible_studies: 4 },
  { pioneerId: 'p-1', yearId: '2025-2026', month: 3, preaching_hours: 58, bible_studies: 5 },
  { pioneerId: 'p-1', yearId: '2025-2026', month: 4, preaching_hours: 50, bible_studies: 4 },
  { pioneerId: 'p-1', yearId: '2025-2026', month: 5, preaching_hours: 60, bible_studies: 5 },
  { pioneerId: 'p-1', yearId: '2025-2026', month: 6, preaching_hours: 54, bible_studies: 4 },

  // Elena Vázquez (Average 45 h/month - March Review candidate)
  { pioneerId: 'p-2', yearId: '2025-2026', month: 1, preaching_hours: 46, bible_studies: 3 },
  { pioneerId: 'p-2', yearId: '2025-2026', month: 2, preaching_hours: 44, bible_studies: 3 },
  { pioneerId: 'p-2', yearId: '2025-2026', month: 3, preaching_hours: 45, bible_studies: 2 },
  { pioneerId: 'p-2', yearId: '2025-2026', month: 4, preaching_hours: 42, bible_studies: 3 },
  { pioneerId: 'p-2', yearId: '2025-2026', month: 5, preaching_hours: 45, bible_studies: 2 },
  { pioneerId: 'p-2', yearId: '2025-2026', month: 6, preaching_hours: 48, bible_studies: 3 },

  // Javier Romero (Struggling - Needs Help)
  { pioneerId: 'p-3', yearId: '2025-2026', month: 1, preaching_hours: 38, bible_studies: 1 },
  { pioneerId: 'p-3', yearId: '2025-2026', month: 2, preaching_hours: 35, bible_studies: 1 },
  { pioneerId: 'p-3', yearId: '2025-2026', month: 3, preaching_hours: 30, bible_studies: 1 },
  { pioneerId: 'p-3', yearId: '2025-2026', month: 4, preaching_hours: 28, bible_studies: 0 },
  { pioneerId: 'p-3', yearId: '2025-2026', month: 5, preaching_hours: 32, bible_studies: 1 },
  { pioneerId: 'p-3', yearId: '2025-2026', month: 6, preaching_hours: 27, bible_studies: 1 },

  // Marta Gómez (Started January: month 5, 6, 7; accumulated 120 h -> 80% pace, Section 9 test case)
  { pioneerId: 'p-4', yearId: '2025-2026', month: 5, preaching_hours: 40, bible_studies: 2 },
  { pioneerId: 'p-4', yearId: '2025-2026', month: 6, preaching_hours: 40, bible_studies: 2 },
  { pioneerId: 'p-4', yearId: '2025-2026', month: 7, preaching_hours: 40, bible_studies: 2 },

  // Rosa Pérez (Salud delicada - 15-20 h/month)
  { pioneerId: 'p-5', yearId: '2025-2026', month: 1, preaching_hours: 18, bible_studies: 1 },
  { pioneerId: 'p-5', yearId: '2025-2026', month: 2, preaching_hours: 16, bible_studies: 1 },
  { pioneerId: 'p-5', yearId: '2025-2026', month: 3, preaching_hours: 20, bible_studies: 1 },
  { pioneerId: 'p-5', yearId: '2025-2026', month: 4, preaching_hours: 15, bible_studies: 1 },
  { pioneerId: 'p-5', yearId: '2025-2026', month: 5, preaching_hours: 17, bible_studies: 1 },
  { pioneerId: 'p-5', yearId: '2025-2026', month: 6, preaching_hours: 19, bible_studies: 1 },

  // Fernando Castro (Extraordinary high performance: 70 h/month)
  { pioneerId: 'p-6', yearId: '2025-2026', month: 1, preaching_hours: 72, bible_studies: 6 },
  { pioneerId: 'p-6', yearId: '2025-2026', month: 2, preaching_hours: 68, bible_studies: 5 },
  { pioneerId: 'p-6', yearId: '2025-2026', month: 3, preaching_hours: 75, bible_studies: 6 },
  { pioneerId: 'p-6', yearId: '2025-2026', month: 4, preaching_hours: 70, bible_studies: 6 },
  { pioneerId: 'p-6', yearId: '2025-2026', month: 5, preaching_hours: 69, bible_studies: 5 },
  { pioneerId: 'p-6', yearId: '2025-2026', month: 6, preaching_hours: 71, bible_studies: 6 },

  // Lucía Morales (Started February: month 6, 7)
  { pioneerId: 'p-7', yearId: '2025-2026', month: 6, preaching_hours: 52, bible_studies: 2 },
  { pioneerId: 'p-7', yearId: '2025-2026', month: 7, preaching_hours: 50, bible_studies: 3 },

  // Roberto Silva (Has reports 1 to 5, missing month 6 -> Sin informe)
  { pioneerId: 'p-8', yearId: '2025-2026', month: 1, preaching_hours: 50, bible_studies: 3 },
  { pioneerId: 'p-8', yearId: '2025-2026', month: 2, preaching_hours: 49, bible_studies: 3 },
  { pioneerId: 'p-8', yearId: '2025-2026', month: 3, preaching_hours: 52, bible_studies: 3 },
  { pioneerId: 'p-8', yearId: '2025-2026', month: 4, preaching_hours: 48, bible_studies: 2 },
  { pioneerId: 'p-8', yearId: '2025-2026', month: 5, preaching_hours: 51, bible_studies: 3 },

  // --- Informes Históricos Reales Año de Servicio 2024-2025 (Año Completo Cerrado) ---
  // Carlos Morales: 618 h total (51-53 h/mes) -> Cumplido
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-1',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: m % 2 === 0 ? 52 : 51,
    bible_studies: 4,
  })),

  // Elena Vázquez: 576 h total (48 h/mes) -> Mínimo alcanzado
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-2',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: 48,
    bible_studies: 3,
  })),

  // Javier Romero: 612 h total (51 h/mes) -> Cumplido
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-3',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: 51,
    bible_studies: 2,
  })),

  // Rosa Pérez: 216 h total (18 h/mes) -> Salud delicada
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-5',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: 18,
    bible_studies: 1,
  })),

  // Fernando Castro: 744 h total (62 h/mes) -> Cumplido
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-6',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: 62,
    bible_studies: 5,
  })),

  // Roberto Silva: 604 h total (50-51 h/mes) -> Cumplido
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    pioneerId: 'p-8',
    yearId: '2024-2025',
    month: m as ServiceMonthNumber,
    preaching_hours: m % 2 === 0 ? 51 : 50,
    bible_studies: 3,
  })),
];

export const INITIAL_CREDITS: CreditEntry[] = [
  // Carlos Morales has LDC assignment in Nov (mes 3)
  {
    id: 'cred-1',
    pioneerId: 'p-1',
    yearId: '2025-2026',
    month: 3,
    kind: 'asignacion',
    subtype: 'ldc',
    hours: 15,
    note: 'Apoyo en remodelación salón de asambleas',
  },
  // Elena Vázquez attended Pioneer School in Oct (mes 2) -> 30 h
  {
    id: 'cred-2',
    pioneerId: 'p-2',
    yearId: '2025-2026',
    month: 2,
    kind: 'escuela',
    hours: 30,
    note: 'Escuela del Servicio de Precursor',
  },
];

export const INITIAL_PRIVATE_NOTES: PrivateNote[] = [
  {
    pioneerId: 'p-3',
    note: 'El precursor mencionó dificultades con el nuevo turno laboral. Los superintendentes coordinarán para acompañarlo en las mañanas de fin de semana.',
    updatedAt: '2026-02-15T10:00:00Z',
    updatedBy: 'secretario@congregacion.org',
  },
  {
    pioneerId: 'p-5',
    note: 'Aprobado como precursor de salud delicada por el cuerpo de ancianos. Registrado en el S-21.',
    updatedAt: '2024-05-15T12:00:00Z',
    updatedBy: 'secretario@congregacion.org',
  },
];

export const INITIAL_LOCKED_MONTHS: MonthLockStatus[] = [];

export const INITIAL_REVIEWS: PioneerReview[] = [
  {
    id: 'p-2_2025-2026',
    pioneerId: 'p-2',
    yearId: '2025-2026',
    march_meeting_date: null,
    march_meeting_notes: '',
  },
  {
    id: 'p-3_2025-2026',
    pioneerId: 'p-3',
    yearId: '2025-2026',
    march_meeting_date: null,
    march_meeting_notes: '',
  },
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'log-1',
    uid: 'user-sec-01',
    user_email: 'secretario@congregacion.org',
    action: 'lock_month',
    entity: 'report',
    details: 'Mes de Septiembre 2025 marcado como enviado (bloqueado)',
    timestamp: '2025-10-06T18:00:00Z',
  },
  {
    id: 'log-2',
    uid: 'user-sec-01',
    user_email: 'secretario@congregacion.org',
    action: 'lock_month',
    entity: 'report',
    details: 'Mes de Octubre 2025 marcado como enviado (bloqueado)',
    timestamp: '2025-11-06T18:00:00Z',
  },
  {
    id: 'log-3',
    uid: 'user-sec-01',
    user_email: 'secretario@congregacion.org',
    action: 'create',
    entity: 'credit',
    details: 'Crédito de escuela registrado para Elena Vázquez (30 h)',
    timestamp: '2025-11-01T15:30:00Z',
  },
];
