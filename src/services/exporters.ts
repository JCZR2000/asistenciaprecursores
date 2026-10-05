// Official export services for Precursores Regulares
import * as XLSX from 'xlsx';
import { Congregation, Pioneer, PioneerYearRecord, ServiceYear, MonthLockStatus, PioneerReview, AuditLogEntry } from '../domain/models';
import { CreditEntry, MonthlyReport, PioneerYearCalculation, MONTH_NAMES, ServiceMonthNumber } from '../domain/types';

export interface ExportDataPayload {
  congregation: Congregation;
  currentYearId: string;
  activePioneersForYear: {
    pioneer: Pioneer;
    yearRecord: PioneerYearRecord;
    calc: PioneerYearCalculation;
  }[];
  allPioneers: Pioneer[];
  allPioneerYears: PioneerYearRecord[];
  reports: (MonthlyReport & { pioneerId: string; yearId: string })[];
  credits: CreditEntry[];
  reviews: PioneerReview[];
  serviceYears: ServiceYear[];
  lockedMonths: MonthLockStatus[];
  auditLog: AuditLogEntry[];
}

/**
 * Generates and downloads a rich multi-sheet Excel workbook
 */
export function exportExcelWorkbook(payload: ExportDataPayload): void {
  const { congregation, currentYearId, activePioneersForYear, credits, reviews } = payload;
  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: Resumen Anual ---
  const summaryRows = activePioneersForYear.map(({ pioneer, yearRecord, calc }) => {
    return {
      'Grupo': pioneer.group_number,
      'Apellidos': pioneer.last_name,
      'Nombres': pioneer.first_name,
      'Tipo de Precursor': yearRecord.pioneer_type === 'salud_delicada' ? 'Salud Delicada' : 'Regular',
      'Meta Anual': calc.goal ?? 'Sin meta fija',
      'Mínimo Anual': calc.minimum ?? '—',
      'Total Horas': calc.total_hours,
      'Horas de Predicación': calc.total_preaching,
      'Créditos Aplicados': calc.total_credits_applied,
      'Promedio Mensual': Math.round(calc.average_monthly_hours * 10) / 10,
      'Estado': calc.status,
      'Ritmo': calc.pace.status === 'va_bien'
        ? 'Va bien'
        : calc.pace.status === 'atrasado'
        ? 'Atrasado'
        : calc.pace.status === 'ayuda'
        ? 'Necesita ayuda'
        : calc.pace.status === 'sin_informe'
        ? 'Sin informe'
        : 'Salud delicada',
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows.length > 0 ? summaryRows : [{ 'Mensaje': 'No hay precursores registrados en este año' }]);
  wsSummary['!cols'] = [
    { wch: 8 },  // Grupo
    { wch: 18 }, // Apellidos
    { wch: 18 }, // Nombres
    { wch: 18 }, // Tipo
    { wch: 12 }, // Meta
    { wch: 12 }, // Mínimo
    { wch: 12 }, // Total
    { wch: 16 }, // Predicación
    { wch: 16 }, // Créditos
    { wch: 16 }, // Promedio
    { wch: 14 }, // Estado
    { wch: 16 }, // Ritmo
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen Anual');

  // --- Sheet 2: Detalle Mensual ---
  const detailRows = activePioneersForYear.map(({ pioneer, calc }) => {
    const row: Record<string, any> = {
      'Grupo': pioneer.group_number,
      'Precursor': `${pioneer.last_name}, ${pioneer.first_name}`,
    };

    for (let m = 1; m <= 12; m++) {
      const mNum = m as ServiceMonthNumber;
      const res = calc.monthly_results[mNum];
      const mName = MONTH_NAMES[mNum].short;
      row[mName] = res.isBeforeStart ? '—' : res.total;
    }

    row['TOTAL'] = calc.total_hours;
    return row;
  });

  const wsDetail = XLSX.utils.json_to_sheet(detailRows.length > 0 ? detailRows : [{ 'Mensaje': 'Sin datos' }]);
  wsDetail['!cols'] = [{ wch: 8 }, { wch: 25 }, ...Array(13).fill({ wch: 8 })];
  XLSX.utils.book_append_sheet(workbook, wsDetail, 'Detalle Mensual');

  // --- Sheet 3: Créditos Teocráticos ---
  const yearCredits = credits.filter((c) => c.yearId === currentYearId || !c.yearId);
  const creditRows = yearCredits.map((c) => {
    const p = payload.allPioneers.find((p) => p.id === c.pioneerId);
    return {
      'Precursor': p ? `${p.last_name}, ${p.first_name}` : c.pioneerId,
      'Mes': MONTH_NAMES[c.month]?.name || c.month,
      'Clase de Crédito': c.kind === 'escuela' ? 'Escuela del Servicio de Precursor' : 'Asignación Teocrática',
      'Subtipo': c.subtype || '—',
      'Horas': c.hours,
      'Nota': c.note || '',
    };
  });

  const wsCredits = XLSX.utils.json_to_sheet(creditRows.length > 0 ? creditRows : [{ 'Mensaje': 'No hay créditos registrados este año' }]);
  wsCredits['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, wsCredits, 'Créditos');

  // --- Sheet 4: Revisiones Teocráticas ---
  const reviewRows = activePioneersForYear.map(({ pioneer }) => {
    const rev = reviews.find((r) => r.pioneerId === pioneer.id && r.yearId === currentYearId);
    return {
      'Grupo': pioneer.group_number,
      'Precursor': `${pioneer.last_name}, ${pioneer.first_name}`,
      'Reunión Marzo (Fecha)': rev?.march_meeting_date || 'Pendiente',
      'Evaluación Fin de Año (Fecha)': rev?.year_end_review_date || 'Pendiente',
    };
  });

  const wsReviews = XLSX.utils.json_to_sheet(reviewRows.length > 0 ? reviewRows : [{ 'Mensaje': 'Sin datos' }]);
  wsReviews['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 24 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(workbook, wsReviews, 'Revisiones');

  // Write file with safe filename and proper Excel MIME type
  const cleanCongName = congregation.name.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  const filename = `Precursores_${cleanCongName}_${currentYearId}.xlsx`;
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

/**
 * Safely triggers a browser file download using a Blob and anchor element.
 * Retains object URL for 30 seconds to prevent Chromium from aborting or renaming to a raw UUID.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  if (a.style) {
    a.style.display = 'none';
  }
  a.href = url;
  a.setAttribute('download', filename);
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup error if already removed
    }
  }, 30000);
}

/**
 * Downloads a complete JSON backup using a safe Blob URL
 */
export function exportBackupJSON(payload: ExportDataPayload): void {
  const { congregation } = payload;
  const backup = {
    schemaVersion: '2.0',
    exportDate: new Date().toISOString(),
    congregation: payload.congregation,
    currentYearId: payload.currentYearId,
    serviceYears: payload.serviceYears,
    pioneers: payload.allPioneers,
    pioneerYears: payload.allPioneerYears,
    reports: payload.reports,
    credits: payload.credits,
    reviews: payload.reviews,
    lockedMonths: payload.lockedMonths,
    auditLog: payload.auditLog,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

  const cleanCongName = congregation.name.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `CopiaSeguridad_${cleanCongName}_${dateStr}.json`;

  downloadBlob(blob, filename);
}
