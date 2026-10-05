import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';
import { Pioneer, PioneerYearRecord } from '../../domain/models';
import { CreditEntry, MonthlyReport, ServiceMonthNumber } from '../../domain/types';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedPioneerRow {
  first_name: string;
  last_name: string;
  group_number: number;
  pioneer_type: 'regular' | 'salud_delicada';
  monthly_hours: Record<ServiceMonthNumber, number>;
  total_hours: number;
  hasSchoolCredit: boolean;
  schoolCreditMonth: ServiceMonthNumber;
  isExisting: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { pioneers, currentYearId, batchImportExcelData, congregation, updateCongregation } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPioneerRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    processExcelFile(selected);
  };

  const processExcelFile = (uploadedFile: File) => {
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawData || rawData.length < 2) {
          setErrorMsg('El archivo seleccionado no contiene filas de datos suficientes.');
          setIsProcessing(false);
          return;
        }

        // Header detection (search first 5 rows for column names)
        let headerRowIndex = 0;
        let colFirst = -1;
        let colLast = -1;
        let colGroup = -1;
        let colType = -1;
        const monthCols: Record<ServiceMonthNumber, number> = {
          1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1,
          7: -1, 8: -1, 9: -1, 10: -1, 11: -1, 12: -1,
        };

        const monthKeywords: Record<ServiceMonthNumber, string[]> = {
          1: ['sep', 'septiembre', 'mes 1', 'm1'],
          2: ['oct', 'octubre', 'mes 2', 'm2'],
          3: ['nov', 'noviembre', 'mes 3', 'm3'],
          4: ['dic', 'diciembre', 'mes 4', 'm4'],
          5: ['ene', 'enero', 'mes 5', 'm5'],
          6: ['feb', 'febrero', 'mes 6', 'm6'],
          7: ['mar', 'marzo', 'mes 7', 'm7'],
          8: ['abr', 'abril', 'mes 8', 'm8'],
          9: ['may', 'mayo', 'mes 9', 'm9'],
          10: ['jun', 'junio', 'mes 10', 'm10'],
          11: ['jul', 'julio', 'mes 11', 'm11'],
          12: ['ago', 'agosto', 'mes 12', 'm12'],
        };

        for (let r = 0; r < Math.min(rawData.length, 5); r++) {
          const row = rawData[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim().toLowerCase();
            if (cellVal.includes('nombre') || cellVal === 'name' || cellVal === 'precursor') {
              colFirst = c;
              headerRowIndex = r;
            }
            if (cellVal.includes('apellido')) {
              colLast = c;
            }
            if (cellVal.includes('grupo')) {
              colGroup = c;
            }
            if (cellVal.includes('tipo') || cellVal.includes('condición') || cellVal.includes('salud')) {
              colType = c;
            }

            // Month columns check
            for (let m = 1; m <= 12; m++) {
              const num = m as ServiceMonthNumber;
              if (monthKeywords[num].some((k) => cellVal.includes(k))) {
                monthCols[num] = c;
              }
            }
          }
          if (colFirst !== -1) break;
        }

        // Fallback for default column indices if headers weren't named identically
        if (colFirst === -1) colFirst = 0;
        if (colLast === -1) colLast = 1;
        if (colGroup === -1) colGroup = 2;

        const results: ParsedPioneerRow[] = [];

        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          let fullName = String(row[colFirst] || '').trim();
          let lastName = colLast !== -1 ? String(row[colLast] || '').trim() : '';

          // If single full name column (e.g. "Castro, Fernando" or "Fernando Castro")
          if (!lastName && fullName.includes(' ')) {
            if (fullName.includes(',')) {
              const parts = fullName.split(',');
              lastName = parts[0].trim();
              fullName = parts[1].trim();
            } else {
              const parts = fullName.split(' ');
              fullName = parts[0].trim();
              lastName = parts.slice(1).join(' ').trim();
            }
          }

          if (!fullName && !lastName) continue;

          const groupNum = colGroup !== -1 && !isNaN(Number(row[colGroup])) ? Number(row[colGroup]) : 1;
          const typeStr = colType !== -1 ? String(row[colType] || '').toLowerCase() : '';
          const pType: 'regular' | 'salud_delicada' = typeStr.includes('salud') || typeStr.includes('delicada')
            ? 'salud_delicada'
            : 'regular';

          const monthly_hours = {} as Record<ServiceMonthNumber, number>;
          let rowTotal = 0;
          let hasSchool = false;
          let schoolMonth: ServiceMonthNumber = 2; // Default October

          for (let m = 1; m <= 12; m++) {
            const mNum = m as ServiceMonthNumber;
            const cIdx = monthCols[mNum];
            let hours = 0;
            if (cIdx !== -1 && row[cIdx] !== undefined) {
              const cellText = String(row[cIdx]).toLowerCase();
              if (cellText.includes('escuela')) {
                hasSchool = true;
                schoolMonth = mNum;
              }
              const numVal = parseFloat(cellText.replace(/[^0-9.]/g, ''));
              if (!isNaN(numVal) && numVal >= 0 && numVal <= 250) {
                hours = Math.round(numVal);
              }
            }
            monthly_hours[mNum] = hours;
            rowTotal += hours;
          }

          // Check if already in current pioneers
          const isExisting = pioneers.some(
            (p) =>
              p.first_name.toLowerCase() === fullName.toLowerCase() &&
              p.last_name.toLowerCase() === lastName.toLowerCase()
          );

          results.push({
            first_name: fullName,
            last_name: lastName,
            group_number: groupNum,
            pioneer_type: pType,
            monthly_hours,
            total_hours: rowTotal,
            hasSchoolCredit: hasSchool,
            schoolCreditMonth: schoolMonth,
            isExisting,
          });
        }

        if (results.length === 0) {
          setErrorMsg('No se detectaron registros válidos en la hoja. Verifica la estructura del archivo.');
        } else {
          setParsedRows(results);
        }
      } catch (err: any) {
        setErrorMsg('Error al procesar el archivo Excel: ' + (err.message || 'Formato no soportado'));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newPioneers: Pioneer[] = [];
    const newPioneerYears: PioneerYearRecord[] = [];
    const newReports: (MonthlyReport & { pioneerId: string; yearId: string })[] = [];
    const newCredits: CreditEntry[] = [];

    parsedRows.forEach((row, idx) => {
      // Find or generate pioneer ID
      const existing = pioneers.find(
        (p) =>
          p.first_name.toLowerCase() === row.first_name.toLowerCase() &&
          p.last_name.toLowerCase() === row.last_name.toLowerCase()
      );

      const pioneerId = existing ? existing.id : `p-${Date.now()}-${idx}`;

      const pioneerObj: Pioneer = {
        id: pioneerId,
        first_name: row.first_name,
        last_name: row.last_name,
        group_number: row.group_number,
        active: true,
        pioneer_since: `${currentYearId.slice(0, 4)}-09-01`,
      };

      const yearRecordObj: PioneerYearRecord = {
        id: `${pioneerId}_${currentYearId}`,
        pioneerId,
        yearId: currentYearId,
        pioneer_type: row.pioneer_type,
        start_month: 1,
      };

      newPioneers.push(pioneerObj);
      newPioneerYears.push(yearRecordObj);

      // Monthly reports
      for (let m = 1; m <= 12; m++) {
        const mNum = m as ServiceMonthNumber;
        const hours = row.monthly_hours[mNum];
        if (hours > 0) {
          newReports.push({
            pioneerId,
            yearId: currentYearId,
            month: mNum,
            preaching_hours: hours,
            bible_studies: 0,
          });
        }
      }

      // School credit if detected
      if (row.hasSchoolCredit) {
        newCredits.push({
          id: `cred-imp-${Date.now()}-${idx}`,
          pioneerId,
          yearId: currentYearId,
          month: row.schoolCreditMonth,
          kind: 'escuela',
          hours: 30,
          note: 'Escuela del Servicio de Precursor (Importada)',
        });
      }
    });

    const maxGroupImported = Math.max(0, ...parsedRows.map((r) => r.group_number));
    if (maxGroupImported > (congregation.groups_count || 5)) {
      updateCongregation({ groups_count: maxGroupImported });
    }

    batchImportExcelData({
      pioneers: newPioneers,
      pioneerYears: newPioneerYears,
      reports: newReports,
      credits: newCredits,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Importar Precursores e Informes desde Excel</span>
        </div>
      }
      description="Carga hojas de cálculo oficiales o registros de congregación (.xlsx, .csv) con vista previa interactiva"
      maxWidth="3xl"
    >
      <div className="space-y-4 pt-1">
        {/* Upload Zone */}
        <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-6 text-center bg-secondary/30">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-semibold text-foreground mb-1">
            {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic para seleccionarlo'}
          </p>
          <span className="text-[11px] text-muted-foreground block mb-3">
            Formatos soportados: .xlsx, .xls, .csv (detecta nombres, grupos, meses Sep–Ago y créditos de escuela)
          </span>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs cursor-pointer hover:bg-primary/90 transition-all shadow-xs">
            <span>Seleccionar Archivo</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview of Parsed Data */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Vista Previa ({parsedRows.length} precursores detectados)
                </span>
                <span className="text-xs text-muted-foreground">
                  · {parsedRows.filter((r) => !r.isExisting).length} nuevos,{' '}
                  {parsedRows.filter((r) => r.isExisting).length} existentes para actualizar
                </span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/70 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border sticky top-0">
                  <tr>
                    <th className="p-2.5">Precursor</th>
                    <th className="p-2.5">Grupo</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Horas Totales</th>
                    <th className="p-2.5">Escuela</th>
                    <th className="p-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-2.5 font-semibold text-foreground">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="p-2.5 text-muted-foreground">Grupo {row.group_number}</td>
                      <td className="p-2.5">
                        <span className="text-[11px] font-medium text-foreground">
                          {row.pioneer_type === 'salud_delicada' ? 'Salud delicada' : 'Regular'}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-primary">{row.total_hours} h</td>
                      <td className="p-2.5">
                        {row.hasSchoolCredit ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            +30 h Escuela
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {row.isExisting ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400">
                            Actualizar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Nuevo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirmation actions */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                Los datos se sincronizarán de inmediato en la base de datos teocrática.
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmImport}
                  className="gap-1.5 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar e Importar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
