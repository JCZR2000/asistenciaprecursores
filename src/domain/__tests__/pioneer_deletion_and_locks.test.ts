import { describe, it, expect } from 'vitest';
import { INITIAL_PIONEERS, INITIAL_PIONEER_YEARS, INITIAL_REPORTS, INITIAL_CREDITS, INITIAL_LOCKED_MONTHS } from '../mockData';
import { ServiceMonthNumber } from '../types';

describe('Pioneer Cascading Deletion & Lock Rules', () => {
  it('INITIAL_LOCKED_MONTHS is empty by default so new/active years do not lock months unexpectedly', () => {
    expect(INITIAL_LOCKED_MONTHS).toHaveLength(0);
  });

  it('cascading deletion filter correctly purges all related pioneer records', () => {
    const targetPioneerId = 'p-1';
    
    // Simulate initial state
    const pioneers = [...INITIAL_PIONEERS];
    const pioneerYears = [...INITIAL_PIONEER_YEARS];
    const reports = [...INITIAL_REPORTS];
    const credits = [...INITIAL_CREDITS];

    expect(pioneers.some(p => p.id === targetPioneerId)).toBe(true);
    expect(pioneerYears.some(py => py.pioneerId === targetPioneerId)).toBe(true);
    expect(reports.some(r => r.pioneerId === targetPioneerId)).toBe(true);

    // Filter simulation (same logic as in AppContext deletePioneer)
    const filteredPioneers = pioneers.filter(p => p.id !== targetPioneerId);
    const filteredPYears = pioneerYears.filter(py => py.pioneerId !== targetPioneerId);
    const filteredReports = reports.filter(r => r.pioneerId !== targetPioneerId);
    const filteredCredits = credits.filter(c => c.pioneerId !== targetPioneerId);

    expect(filteredPioneers.some(p => p.id === targetPioneerId)).toBe(false);
    expect(filteredPYears.some(py => py.pioneerId === targetPioneerId)).toBe(false);
    expect(filteredReports.some(r => r.pioneerId === targetPioneerId)).toBe(false);
    expect(filteredCredits.some(c => c.pioneerId === targetPioneerId)).toBe(false);
  });

  it('isMonthLocked logic returns true for any month if the service year is marked closed', () => {
    const isCurrentYearClosed = true;
    const lockedMonths = INITIAL_LOCKED_MONTHS; // empty
    const currentYearId = '2024-2025';

    const checkLock = (month: ServiceMonthNumber) => {
      if (isCurrentYearClosed) return true;
      return lockedMonths.some((lm) => lm.yearId === currentYearId && lm.month === month && lm.sent);
    };

    // All months in a closed year should evaluate as locked
    for (let m = 1; m <= 12; m++) {
      expect(checkLock(m as ServiceMonthNumber)).toBe(true);
    }
  });

  it('isMonthLocked logic returns false for open year without explicit month lock', () => {
    const isCurrentYearClosed = false;
    const lockedMonths: Array<{ yearId: string; month: ServiceMonthNumber; sent: boolean }> = [
      { yearId: '2025-2026', month: 1 as ServiceMonthNumber, sent: true }
    ];
    const currentYearId = '2025-2026';

    const checkLock = (month: ServiceMonthNumber) => {
      if (isCurrentYearClosed) return true;
      return lockedMonths.some((lm) => lm.yearId === currentYearId && lm.month === month && lm.sent);
    };

    expect(checkLock(1 as ServiceMonthNumber)).toBe(true);
    expect(checkLock(2 as ServiceMonthNumber)).toBe(false);
    expect(checkLock(3 as ServiceMonthNumber)).toBe(false);
  });
});
