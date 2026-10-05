import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportExcelWorkbook, exportBackupJSON, ExportDataPayload } from '../exporters';

vi.mock('xlsx', () => {
  return {
    utils: {
      book_new: vi.fn(() => ({})),
      json_to_sheet: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    write: vi.fn(() => new Uint8Array([80, 75, 3, 4])),
    writeFile: vi.fn(),
  };
});

describe('Export service utilities', () => {
  const dummyPayload: ExportDataPayload = {
    congregation: {
      id: 'c1',
      name: 'Congregación Central',
      groups_count: 6,
      config: {
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
      createdAt: '2025-09-01',
    },
    currentYearId: '2025-2026',
    activePioneersForYear: [],
    allPioneers: [],
    allPioneerYears: [],
    reports: [],
    credits: [],
    reviews: [],
    serviceYears: [],
    lockedMonths: [],
    auditLog: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates multi-sheet Excel without throwing even with empty data', async () => {
    const XLSX = await import('xlsx');
    const clickMock = vi.fn();
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    const originalURL = globalThis.URL;
    const originalDocument = (globalThis as any).document;

    (globalThis as any).URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };

    (globalThis as any).document = {
      body: {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      },
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        style: {},
        setAttribute: vi.fn(),
        click: clickMock,
      })),
    };

    try {
      expect(() => exportExcelWorkbook(dummyPayload)).not.toThrow();
      expect(XLSX.write).toHaveBeenCalled();
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
    } finally {
      globalThis.URL = originalURL;
      (globalThis as any).document = originalDocument;
    }
  });

  it('creates a blob download link for JSON backup', () => {
    const clickMock = vi.fn();
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    // Setup global browser mocks for node environment
    const originalURL = globalThis.URL;
    const originalDocument = (globalThis as any).document;

    (globalThis as any).URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };

    (globalThis as any).document = {
      body: {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      },
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        style: {},
        setAttribute: vi.fn(),
        click: clickMock,
      })),
    };

    try {
      expect(() => exportBackupJSON(dummyPayload)).not.toThrow();
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
    } finally {
      globalThis.URL = originalURL;
      (globalThis as any).document = originalDocument;
    }
  });
});
