// Domain types for Precursores Regulares Dashboard

export type ServiceMonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTH_NAMES: Record<ServiceMonthNumber, { name: string; short: string; calendarMonth: number }> = {
  1: { name: 'Septiembre', short: 'Sep', calendarMonth: 9 },
  2: { name: 'Octubre', short: 'Oct', calendarMonth: 10 },
  3: { name: 'Noviembre', short: 'Nov', calendarMonth: 11 },
  4: { name: 'Diciembre', short: 'Dic', calendarMonth: 12 },
  5: { name: 'Enero', short: 'Ene', calendarMonth: 1 },
  6: { name: 'Febrero', short: 'Feb', calendarMonth: 2 },
  7: { name: 'Marzo', short: 'Mar', calendarMonth: 3 },
  8: { name: 'Abril', short: 'Abr', calendarMonth: 4 },
  9: { name: 'Mayo', short: 'May', calendarMonth: 5 },
  10: { name: 'Junio', short: 'Jun', calendarMonth: 6 },
  11: { name: 'Julio', short: 'Jul', calendarMonth: 7 },
  12: { name: 'Agosto', short: 'Ago', calendarMonth: 8 },
};

export type PioneerType = 'regular' | 'salud_delicada';

export type CreditKind = 'asignacion' | 'escuela';
export type CreditSubtype = 'socorro' | 'ldc' | 'servicio_voluntario' | 'otra' | null;

export interface CongregationConfig {
  monthly_goal: number;             // default 50
  full_year_goal: number;           // default 600
  full_year_minimum: number;        // default 560
  monthly_cap: number;              // default 55
  require_hours_for_credit: boolean; // default true
  near_threshold: number;           // default 40
  pace_ok_pct: number;              // default 1.0 (100%)
  pace_late_pct: number;            // default 0.8 (80%)
  pace_unrealistic_hours: number;   // default 70
  reference_month_mode: 'last_report' | 'calendar' | 'manual';
}

export const DEFAULT_CONGREGATION_CONFIG: CongregationConfig = {
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
};

export interface CreditEntry {
  id?: string;
  pioneerId?: string;
  yearId?: string;
  month: ServiceMonthNumber;
  kind: CreditKind;
  subtype?: CreditSubtype;
  hours: number;
  note?: string;
}

export interface MonthlyReport {
  month: ServiceMonthNumber;
  preaching_hours: number;
  bible_studies?: number;
}

export interface PioneerYearData {
  pioneer_type: PioneerType;
  start_month: ServiceMonthNumber;
  goal_override?: number | null;
  approval_date?: string | null;
  s21_noted?: boolean;
}

export interface MonthCalculationResult {
  month: ServiceMonthNumber;
  isBeforeStart: boolean;
  preaching_hours: number;
  assign_entered: number;
  assign_applied: number;
  school_hours: number;
  credit_total_applied: number;
  total: number;
  bible_studies: number;
  hasReport: boolean;
}

export type StatusCategory =
  | 'cumplido'
  | 'minimo'
  | 'en_camino'
  | 'cerca'
  | 'atrasado'
  | 'riesgo'
  | 'salud_delicada';

export type PaceMeterStatus = 'va_bien' | 'atrasado' | 'ayuda' | 'sin_informe' | 'no_iniciado' | 'salud_delicada';

export interface PaceCalculationResult {
  status: PaceMeterStatus;
  elapsed_months: number;
  expected_hours: number;
  accumulated_hours: number;
  difference_hours: number;
  pace_pct: number;
  months_left: number;
  needed_pace: number | null;
  projected_year_end_hours: number | null;
  suggestion: string;
}

export interface PioneerYearCalculation {
  pioneer_type: PioneerType;
  start_month: ServiceMonthNumber;
  months_in_year: number;
  goal: number | null;
  minimum: number | null;
  total_hours: number;
  total_preaching: number;
  total_credits_applied: number;
  remaining_hours: number | null;
  status: StatusCategory;
  monthly_results: Record<ServiceMonthNumber, MonthCalculationResult>;
  pace: PaceCalculationResult;
  average_monthly_hours: number; // for march review
}
