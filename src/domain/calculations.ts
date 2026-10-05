import {
  CongregationConfig,
  CreditEntry,
  DEFAULT_CONGREGATION_CONFIG,
  MonthCalculationResult,
  MonthlyReport,
  PaceCalculationResult,
  PioneerType,
  PioneerYearCalculation,
  PioneerYearData,
  ServiceMonthNumber,
  StatusCategory,
} from './types';

/**
 * Maps a standard Date to the corresponding theocratic ServiceMonthNumber (1=Sep ... 12=Aug).
 */
export function getCurrentTheocraticServiceMonth(date: Date = new Date()): ServiceMonthNumber {
  const jsMonth = date.getMonth(); // 0 = Jan, 8 = Sep, 11 = Dec
  return (((jsMonth + 4) % 12) + 1) as ServiceMonthNumber;
}

/**
 * Returns the completed theocratic service month immediately preceding the current date.
 * Congregation reports are submitted and captured at the beginning of the following month
 * (e.g. In October, reports for September [Mes 1] are processed).
 */
export function getPreviousTheocraticServiceMonth(date: Date = new Date()): ServiceMonthNumber {
  const currentMonth = getCurrentTheocraticServiceMonth(date);
  return currentMonth === 1 ? 12 : ((currentMonth - 1) as ServiceMonthNumber);
}

/**
 * Calculates the current theocratic ServiceYear string (e.g. '2025-2026').
 * Service year begins in September and ends in August.
 */
export function getCurrentTheocraticServiceYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const jsMonth = date.getMonth();
  if (jsMonth >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Calculates monthly credit applications based on the business rules in Plan.md:
 * - Assignment credit: capped at monthly_cap (default 55 h) when added to preaching hours.
 * - School credit: counted in full, even if the total exceeds 55 h.
 * - If require_hours_for_credit is true, assignment credits are 0 if preaching_hours == 0.
 * - School credits are NOT subject to preaching_hours requirement.
 * - Preaching hours are never reduced (e.g. 60 h preaching + 10 credit -> 60 h total).
 */
export function calculateMonthCredits(
  preaching_hours: number,
  credits: CreditEntry[] = [],
  customConfig?: Partial<CongregationConfig>
) {
  const config = { ...DEFAULT_CONGREGATION_CONFIG, ...customConfig };

  const assign_entered = credits
    .filter((c) => c.kind === 'asignacion')
    .reduce((sum, c) => sum + (Number(c.hours) || 0), 0);

  const school_hours = credits
    .filter((c) => c.kind === 'escuela')
    .reduce((sum, c) => sum + (Number(c.hours) || 0), 0);

  let assign_applied = 0;
  if (config.require_hours_for_credit && preaching_hours === 0) {
    assign_applied = 0;
  } else {
    const availableUnderCap = Math.max(0, config.monthly_cap - preaching_hours);
    assign_applied = Math.min(assign_entered, availableUnderCap);
  }

  const credit_total_applied = assign_applied + school_hours;
  const month_total = preaching_hours + credit_total_applied;

  return {
    assign_entered,
    assign_applied,
    school_hours,
    credit_total_applied,
    month_total,
  };
}

/**
 * Calculates prorated goals for a service year based on start month:
 * September (1) = 12 months (600 h)
 * January (5) = 8 months (400 h)
 * February (6) = 7 months (350 h)
 * Proportional minimum = goal * (full_year_minimum / full_year_goal)
 */
export function calculateProratedGoal(
  start_month: ServiceMonthNumber,
  goal_override?: number | null,
  customConfig?: Partial<CongregationConfig>
) {
  const config = { ...DEFAULT_CONGREGATION_CONFIG, ...customConfig };

  const months_in_year = 12 - start_month + 1;
  const standardGoal = Math.min(config.full_year_goal, config.monthly_goal * months_in_year);
  const goal = goal_override != null && goal_override > 0 ? goal_override : standardGoal;

  const minimum = (goal * config.full_year_minimum) / config.full_year_goal;

  return {
    months_in_year,
    goal,
    minimum,
  };
}

/**
 * Calculates pace meter and rhythm indicators based on Plan.md section 2.3 & 6:
 * - elapsed = ref_month - start_month + 1
 * - expected = 50 * elapsed
 * - pace_% = accumulated / expected
 * - needed_pace = remaining / months_left
 */
export function calculatePace(
  pioneerType: PioneerType,
  start_month: ServiceMonthNumber,
  accumulated_hours: number,
  ref_month: ServiceMonthNumber,
  hasReportInRefMonth: boolean,
  remaining_hours: number,
  customConfig?: Partial<CongregationConfig>
): PaceCalculationResult {
  const config = { ...DEFAULT_CONGREGATION_CONFIG, ...customConfig };

  if (pioneerType === 'salud_delicada') {
    return {
      status: 'salud_delicada',
      elapsed_months: 0,
      expected_hours: 0,
      accumulated_hours,
      difference_hours: 0,
      pace_pct: 1,
      months_left: Math.max(0, 12 - ref_month),
      needed_pace: null,
      projected_year_end_hours: null,
      suggestion: 'Salud delicada — sirve según sus posibilidades.',
    };
  }

  if (ref_month < start_month) {
    return {
      status: 'no_iniciado',
      elapsed_months: 0,
      expected_hours: 0,
      accumulated_hours: 0,
      difference_hours: 0,
      pace_pct: 1,
      months_left: 12 - ref_month,
      needed_pace: null,
      projected_year_end_hours: null,
      suggestion: 'Aún no inicia su servicio en el año teocrático.',
    };
  }

  const elapsed_months = ref_month - start_month + 1;
  const expected_hours = config.monthly_goal * elapsed_months;
  const difference_hours = accumulated_hours - expected_hours;
  const pace_pct = expected_hours > 0 ? accumulated_hours / expected_hours : 1;
  const months_left = Math.max(0, 12 - ref_month);
  const needed_pace = months_left > 0 ? remaining_hours / months_left : null;
  const monthsInPioneerYear = 13 - start_month;
  const projected_year_end_hours =
    elapsed_months > 0 ? Math.round((accumulated_hours / elapsed_months) * monthsInPioneerYear) : null;

  if (!hasReportInRefMonth) {
    return {
      status: 'sin_informe',
      elapsed_months,
      expected_hours,
      accumulated_hours,
      difference_hours,
      pace_pct,
      months_left,
      needed_pace,
      projected_year_end_hours,
      suggestion: 'Sin informe registrado en el mes de referencia.',
    };
  }

  const isUnrealistic = needed_pace !== null && needed_pace > config.pace_unrealistic_hours;

  if (pace_pct >= config.pace_ok_pct && !isUnrealistic) {
    return {
      status: 'va_bien',
      elapsed_months,
      expected_hours,
      accumulated_hours,
      difference_hours,
      pace_pct,
      months_left,
      needed_pace,
      projected_year_end_hours,
      suggestion: '🟢 Va bien: mantiene un ritmo óptimo para alcanzar la meta anual.',
    };
  }

  if (pace_pct >= config.pace_late_pct && !isUnrealistic) {
    const roundedNeeded = needed_pace !== null ? Math.round(needed_pace) : 0;
    const diffAbs = Math.abs(Math.round(difference_hours));
    return {
      status: 'atrasado',
      elapsed_months,
      expected_hours,
      accumulated_hours,
      difference_hours,
      pace_pct,
      months_left,
      needed_pace,
      projected_year_end_hours,
      suggestion: `🟡 Un poco atrasado: lleva ${diffAbs} h de retraso. Necesita ${roundedNeeded} h/mes en los ${months_left} meses restantes.`,
    };
  }

  const roundedNeeded = needed_pace !== null ? Math.round(needed_pace) : 0;
  return {
    status: 'ayuda',
    elapsed_months,
    expected_hours,
    accumulated_hours,
    difference_hours,
    pace_pct,
    months_left,
    needed_pace,
    projected_year_end_hours,
    suggestion: `🔴 Necesita ayuda: el ritmo requerido (${roundedNeeded} h/mes) o el acumulado actual requiere apoyo amoroso de los superintendentes.`,
  };
}

/**
 * Computes full calculations for a pioneer in a service year:
 * - Monthly breakdown with credits applied
 * - Year totals, goal, minimum, status, and pace
 */
export function calculatePioneerYear(
  pioneerYear: PioneerYearData,
  reports: MonthlyReport[] = [],
  credits: CreditEntry[] = [],
  ref_month: ServiceMonthNumber = 12,
  customConfig?: Partial<CongregationConfig>
): PioneerYearCalculation {
  const config = { ...DEFAULT_CONGREGATION_CONFIG, ...customConfig };
  const { start_month, pioneer_type, goal_override } = pioneerYear;

  const { months_in_year, goal, minimum } = calculateProratedGoal(start_month, goal_override, config);

  const reportMap = new Map<ServiceMonthNumber, MonthlyReport>();
  reports.forEach((r) => reportMap.set(r.month, r));

  const creditMap = new Map<ServiceMonthNumber, CreditEntry[]>();
  credits.forEach((c) => {
    const list = creditMap.get(c.month) || [];
    list.push(c);
    creditMap.set(c.month, list);
  });

  const monthly_results = {} as Record<ServiceMonthNumber, MonthCalculationResult>;

  let total_hours = 0;
  let total_preaching = 0;
  let total_credits_applied = 0;
  let total_to_ref = 0;
  let reported_months_count = 0;

  for (let m = 1; m <= 12; m++) {
    const monthNum = m as ServiceMonthNumber;
    const isBeforeStart = monthNum < start_month;
    const report = reportMap.get(monthNum);
    const monthCredits = creditMap.get(monthNum) || [];

    const preaching_hours = report ? report.preaching_hours : 0;
    const bible_studies = report && report.bible_studies != null ? report.bible_studies : 0;
    const hasReport = Boolean(report);

    if (isBeforeStart) {
      monthly_results[monthNum] = {
        month: monthNum,
        isBeforeStart: true,
        preaching_hours: 0,
        assign_entered: 0,
        assign_applied: 0,
        school_hours: 0,
        credit_total_applied: 0,
        total: 0,
        bible_studies: 0,
        hasReport: false,
      };
      continue;
    }

    const { assign_entered, assign_applied, school_hours, credit_total_applied, month_total } =
      calculateMonthCredits(preaching_hours, monthCredits, config);

    monthly_results[monthNum] = {
      month: monthNum,
      isBeforeStart: false,
      preaching_hours,
      assign_entered,
      assign_applied,
      school_hours,
      credit_total_applied,
      total: month_total,
      bible_studies,
      hasReport,
    };

    total_hours += month_total;
    total_preaching += preaching_hours;
    total_credits_applied += credit_total_applied;

    if (hasReport) {
      reported_months_count++;
    }

    if (monthNum <= ref_month) {
      total_to_ref += month_total;
    }
  }

  const effectiveGoal = pioneer_type === 'salud_delicada' ? null : goal;
  const effectiveMinimum = pioneer_type === 'salud_delicada' ? null : minimum;
  const remaining_hours =
    pioneer_type === 'salud_delicada' || effectiveGoal === null ? null : Math.max(0, effectiveGoal - total_hours);

  const hasReportInRef = Boolean(monthly_results[ref_month]?.hasReport);

  const pace = calculatePace(
    pioneer_type,
    start_month,
    total_to_ref,
    ref_month,
    hasReportInRef,
    remaining_hours ?? 0,
    config
  );

  // Status computation: adapts depending on whether year is completed (month 12) or in-progress
  let status: StatusCategory = 'riesgo';
  if (pioneer_type === 'salud_delicada') {
    status = 'salud_delicada';
  } else if (effectiveGoal !== null && effectiveMinimum !== null) {
    if (total_hours >= effectiveGoal) {
      status = 'cumplido';
    } else if (total_hours >= effectiveMinimum) {
      status = 'minimo';
    } else if (ref_month >= 12) {
      // Year-end final result (August or closed year)
      if (effectiveMinimum - total_hours <= config.near_threshold) {
        status = 'cerca';
      } else {
        status = 'riesgo';
      }
    } else {
      // Year in progress: status reflects pace and projection towards goal
      if (pace.status === 'va_bien') {
        status = 'en_camino';
      } else if (pace.status === 'atrasado') {
        status = 'atrasado';
      } else if (pace.status === 'sin_informe') {
        status = 'atrasado';
      } else {
        status = 'riesgo';
      }
    }
  }

  const average_monthly_hours = reported_months_count > 0 ? total_hours / reported_months_count : 0;

  return {
    pioneer_type,
    start_month,
    months_in_year,
    goal: effectiveGoal,
    minimum: effectiveMinimum,
    total_hours,
    total_preaching,
    total_credits_applied,
    remaining_hours,
    status,
    monthly_results,
    pace,
    average_monthly_hours,
  };
}
