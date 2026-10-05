import { describe, expect, it } from 'vitest';
import {
  calculateMonthCredits,
  calculatePace,
  calculatePioneerYear,
  calculateProratedGoal,
  getCurrentTheocraticServiceMonth,
  getCurrentTheocraticServiceYear,
  getPreviousTheocraticServiceMonth,
} from '../calculations';
import { CreditEntry, MonthlyReport, PioneerYearData, ServiceMonthNumber } from '../types';

describe('Plan.md Sección 9 — Pruebas de cálculo de reglas de negocio', () => {
  describe('Cálculo de créditos mensuales y tope de 55 h', () => {
    it('Caso 1: Tope de asignaciones (40 h reales + 30 h asignación -> se suman 15; total 55)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'asignacion', subtype: 'socorro', hours: 30 },
      ];
      const result = calculateMonthCredits(40, credits);

      expect(result.assign_entered).toBe(30);
      expect(result.assign_applied).toBe(15);
      expect(result.school_hours).toBe(0);
      expect(result.credit_total_applied).toBe(15);
      expect(result.month_total).toBe(55);
    });

    it('Caso 2: Escuela completa (40 h reales + 30 h escuela -> se suman 30 completas; total 70)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'escuela', hours: 30 },
      ];
      const result = calculateMonthCredits(40, credits);

      expect(result.assign_applied).toBe(0);
      expect(result.school_hours).toBe(30);
      expect(result.credit_total_applied).toBe(30);
      expect(result.month_total).toBe(70);
    });

    it('Caso 3: Mixto (40 h reales + 30 h asignación + 20 h escuela -> 40 + 15 + 20 = 75)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'asignacion', subtype: 'ldc', hours: 30 },
        { month: 1, kind: 'escuela', hours: 20 },
      ];
      const result = calculateMonthCredits(40, credits);

      expect(result.assign_applied).toBe(15); // hasta 55
      expect(result.school_hours).toBe(20);  // completa
      expect(result.credit_total_applied).toBe(35);
      expect(result.month_total).toBe(75);
    });

    it('Caso 4: Mes ya en 55 (55 h reales + 10 h asignación -> aplicado 0; total 55)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'asignacion', subtype: 'servicio_voluntario', hours: 10 },
      ];
      const result = calculateMonthCredits(55, credits);

      expect(result.assign_applied).toBe(0);
      expect(result.month_total).toBe(55);
    });

    it('Caso 5: Horas reales altas (60 h reales + 10 h asignación -> aplicado 0; total 60, horas reales no se recortan)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'asignacion', subtype: 'otra', hours: 10 },
      ];
      const result = calculateMonthCredits(60, credits);

      expect(result.assign_applied).toBe(0);
      expect(result.month_total).toBe(60);
    });

    it('Caso 6: Sin horas de predicación (0 reales + 10 h asignación -> aplicado 0 con require_hours_for_credit)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'asignacion', subtype: 'socorro', hours: 10 },
      ];
      const result = calculateMonthCredits(0, credits, { require_hours_for_credit: true });

      expect(result.assign_applied).toBe(0);
      expect(result.month_total).toBe(0);
    });

    it('Caso 6b: Sin horas de predicación pero con escuela (0 reales + 10 escuela -> 10 h totales)', () => {
      const credits: CreditEntry[] = [
        { month: 1, kind: 'escuela', hours: 10 },
      ];
      const result = calculateMonthCredits(0, credits, { require_hours_for_credit: true });

      expect(result.school_hours).toBe(10);
      expect(result.month_total).toBe(10);
    });

    it('Caso: Escuela dividida (30 h de escuela que abarcan dos meses, 20 h en mes 1 y 10 h en mes 2)', () => {
      const res1 = calculateMonthCredits(35, [{ month: 1, kind: 'escuela', hours: 20 }]);
      const res2 = calculateMonthCredits(40, [{ month: 2, kind: 'escuela', hours: 10 }]);

      expect(res1.school_hours).toBe(20);
      expect(res1.month_total).toBe(55);

      expect(res2.school_hours).toBe(10);
      expect(res2.month_total).toBe(50);
    });
  });

  describe('Metas prorrateadas según mes de inicio', () => {
    it('Caso: Inicio en septiembre (mes 1) -> 12 meses, meta 600, mínimo 560', () => {
      const { months_in_year, goal, minimum } = calculateProratedGoal(1);
      expect(months_in_year).toBe(12);
      expect(goal).toBe(600);
      expect(minimum).toBe(560);
    });

    it('Caso: Inicio en enero (mes 5) -> 8 meses, meta 400, mínimo proporcional ~373.33', () => {
      const { months_in_year, goal, minimum } = calculateProratedGoal(5);
      expect(months_in_year).toBe(8);
      expect(goal).toBe(400);
      expect(minimum).toBeCloseTo((400 * 560) / 600, 2);
    });

    it('Caso: Inicio en febrero (mes 6) -> 7 meses, meta 350', () => {
      const { months_in_year, goal, minimum } = calculateProratedGoal(6);
      expect(months_in_year).toBe(7);
      expect(goal).toBe(350);
      expect(minimum).toBeCloseTo((350 * 560) / 600, 2);
    });
  });

  describe('Medidor de ritmo ("¿va bien?")', () => {
    it('Caso: Inicio enero (mes 5), referencia marzo (mes 7), 120 h acumuladas', () => {
      // elapsed = 7 - 5 + 1 = 3 meses.
      // esperado = 50 * 3 = 150 h.
      // acumulado = 120 h.
      // diferencia = -30 h.
      // ritmo_% = 120 / 150 = 0.80 (80%) -> "atrasado".
      const pace = calculatePace(
        'regular',
        5, // start_month: enero
        120, // accumulated
        7, // ref_month: marzo
        true, // hasReportInRefMonth
        280 // remaining (400 - 120)
      );

      expect(pace.elapsed_months).toBe(3);
      expect(pace.expected_hours).toBe(150);
      expect(pace.difference_hours).toBe(-30);
      expect(pace.pace_pct).toBe(0.8);
      expect(pace.status).toBe('atrasado');
      expect(pace.months_left).toBe(5); // meses restantes (abril, mayo, junio, julio, agosto)
      expect(pace.needed_pace).toBe(280 / 5); // 56 h/mes
    });

    it('Caso: Sin informe en el mes de referencia -> estado "sin_informe"', () => {
      const pace = calculatePace('regular', 1, 150, 4, false, 450);
      expect(pace.status).toBe('sin_informe');
    });

    it('Caso: Va bien (ritmo >= 100%)', () => {
      // Inicio sep (1), ref nov (3), acumuladas 160 h (esperado 150 h)
      const pace = calculatePace('regular', 1, 160, 3, true, 440);
      expect(pace.status).toBe('va_bien');
      expect(pace.difference_hours).toBe(10);
    });

    it('Caso: Necesita ayuda cuando ritmo < 80% o ritmo necesario es irrealista (>70 h/mes)', () => {
      // Inicio sep (1), ref junio (10), acumuladas 250 h (esperadas 500 h) -> ritmo 50%
      const pace = calculatePace('regular', 1, 250, 10, true, 350);
      expect(pace.status).toBe('ayuda');
      expect(pace.needed_pace).toBe(350 / 2); // 175 h/mes > 70 h/mes
    });
  });

  describe('Precursor de salud delicada (sin meta fija)', () => {
    it('Caso: Salud delicada tiene estado propio, sin meta ni restantes contra 50 h', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'salud_delicada',
        start_month: 1,
      };

      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 15 },
        { month: 2, preaching_hours: 20 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, [], 2);

      expect(result.pioneer_type).toBe('salud_delicada');
      expect(result.status).toBe('salud_delicada');
      expect(result.goal).toBeNull();
      expect(result.minimum).toBeNull();
      expect(result.remaining_hours).toBeNull();
      expect(result.total_hours).toBe(35);
      expect(result.pace.status).toBe('salud_delicada');
    });
  });

  describe('Casos reales del Excel (Sección 9)', () => {
    it('Caso: Precursor con 524 h reales + 160 h de crédito aplicado -> 684 h, cumplido', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      // Simulamos los 12 meses distribuyendo 524 h y créditos aplicados de 160 h
      // Por simplicidad de cálculo de año completo:
      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 524 },
      ];
      // 160 h de crédito (ej. escuelas o aprobadas ya sumadas)
      const credits: CreditEntry[] = [
        { month: 1, kind: 'escuela', hours: 160 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, credits, 12);
      expect(result.total_hours).toBe(684);
      expect(result.status).toBe('cumplido');
      expect(result.remaining_hours).toBe(0);
    });

    it('Caso: 574 h + 6 h -> 580 h, mínimo, faltan 20', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 574 },
      ];
      const credits: CreditEntry[] = [
        { month: 1, kind: 'escuela', hours: 6 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, credits, 12);
      expect(result.total_hours).toBe(580);
      expect(result.status).toBe('minimo');
      expect(result.remaining_hours).toBe(20);
    });

    it('Caso: 413 h + 177 h -> 590 h, mínimo, faltan 10', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 413 },
      ];
      const credits: CreditEntry[] = [
        { month: 1, kind: 'escuela', hours: 177 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, credits, 12);
      expect(result.total_hours).toBe(590);
      expect(result.status).toBe('minimo');
      expect(result.remaining_hours).toBe(10);
    });

    it('Caso: Fin de año con 540 h con meta de 600 -> bajo el mínimo de 560 (cerca de la meta)', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 540 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, [], 12);
      expect(result.total_hours).toBe(540);
      // Mínimo es 560. 560 - 540 = 20 <= 40 (near_threshold) -> 'cerca'
      expect(result.status).toBe('cerca');
      expect(result.remaining_hours).toBe(60);
    });

    it('Caso: Revisión de marzo: promedio menor de 50 h detectado', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      // 6 meses con 45 h cada uno (septiembre a febrero)
      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 45 },
        { month: 2, preaching_hours: 45 },
        { month: 3, preaching_hours: 45 },
        { month: 4, preaching_hours: 45 },
        { month: 5, preaching_hours: 45 },
        { month: 6, preaching_hours: 45 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, [], 6);
      expect(result.total_hours).toBe(270);
      expect(result.average_monthly_hours).toBe(45);
      expect(result.average_monthly_hours < 50).toBe(true);
    });

    it('Caso: Durante el año de servicio, precursor que va bien (425 h en Feb, 142% ritmo) tiene estado "en_camino" y no "riesgo"', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      // Fernando Castro: 70 h/mes meses 1 a 6 = 425 h en febrero (mes 6)
      const reports: MonthlyReport[] = [
        { month: 1, preaching_hours: 72 },
        { month: 2, preaching_hours: 68 },
        { month: 3, preaching_hours: 75 },
        { month: 4, preaching_hours: 70 },
        { month: 5, preaching_hours: 69 },
        { month: 6, preaching_hours: 71 },
      ];

      const result = calculatePioneerYear(pioneerYear, reports, [], 6);
      expect(result.total_hours).toBe(425);
      expect(result.pace.status).toBe('va_bien');
      expect(result.pace.pace_pct).toBeGreaterThan(1.0);
      expect(result.status).toBe('en_camino');
    });

    it('Caso: Año cerrado evalúa estatus final cumplido con 618 h anuales', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      // 12 meses de informes (Carlos Morales 2024-2025)
      const reports: MonthlyReport[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
        month: m as ServiceMonthNumber,
        preaching_hours: m % 2 === 0 ? 52 : 51,
      }));

      const result = calculatePioneerYear(pioneerYear, reports, [], 12);
      expect(result.total_hours).toBe(618);
      expect(result.status).toBe('cumplido');
      expect(result.remaining_hours).toBe(0);
    });

    it('Caso: Año cerrado con 576 h anuales alcanza estatus "minimo" (>= 560 y < 600)', () => {
      const pioneerYear: PioneerYearData = {
        pioneer_type: 'regular',
        start_month: 1,
      };

      const reports: MonthlyReport[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
        month: m as ServiceMonthNumber,
        preaching_hours: 48,
      }));

      const result = calculatePioneerYear(pioneerYear, reports, [], 12);
      expect(result.total_hours).toBe(576);
      expect(result.status).toBe('minimo');
      expect(result.remaining_hours).toBe(24);
    });
  });

  describe('Theocratic calendar conversions', () => {
    it('correctly maps calendar months to theocratic service months (Sep=1 ... Aug=12)', () => {
      // Month indices: 0 = Jan ... 11 = Dec
      expect(getCurrentTheocraticServiceMonth(new Date(2025, 8, 15))).toBe(1); // Septiembre
      expect(getCurrentTheocraticServiceMonth(new Date(2025, 9, 5))).toBe(2); // Octubre
      expect(getCurrentTheocraticServiceMonth(new Date(2025, 11, 25))).toBe(4); // Diciembre
      expect(getCurrentTheocraticServiceMonth(new Date(2026, 0, 10))).toBe(5); // Enero
      expect(getCurrentTheocraticServiceMonth(new Date(2026, 1, 14))).toBe(6); // Febrero
      expect(getCurrentTheocraticServiceMonth(new Date(2026, 7, 31))).toBe(12); // Agosto
    });

    it('correctly calculates service year string based on month', () => {
      // September to December 2025 belongs to 2025-2026
      expect(getCurrentTheocraticServiceYear(new Date(2025, 8, 1))).toBe('2025-2026');
      expect(getCurrentTheocraticServiceYear(new Date(2025, 11, 31))).toBe('2025-2026');
      // January to August 2026 belongs to 2025-2026
      expect(getCurrentTheocraticServiceYear(new Date(2026, 0, 1))).toBe('2025-2026');
      expect(getCurrentTheocraticServiceYear(new Date(2026, 7, 31))).toBe('2025-2026');
      // September 2026 belongs to 2026-2027
      expect(getCurrentTheocraticServiceYear(new Date(2026, 8, 1))).toBe('2026-2027');
    });

    it('correctly returns previous reporting month for congregation workflow', () => {
      // In October (month index 9), reports being processed are from September (month 1)
      expect(getPreviousTheocraticServiceMonth(new Date(2026, 9, 5))).toBe(1);
      // In November (month index 10), reports are from October (month 2)
      expect(getPreviousTheocraticServiceMonth(new Date(2026, 10, 2))).toBe(2);
      // In January (month index 0), reports are from December (month 4)
      expect(getPreviousTheocraticServiceMonth(new Date(2026, 0, 6))).toBe(4);
      // In September (month index 8), reports are from August (month 12)
      expect(getPreviousTheocraticServiceMonth(new Date(2026, 8, 3))).toBe(12);
    });
  });
});
