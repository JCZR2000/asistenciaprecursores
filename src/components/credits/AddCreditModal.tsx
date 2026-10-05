import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CreditKind, CreditSubtype, MONTH_NAMES, ServiceMonthNumber } from '../../domain/types';
import { useApp } from '../../context/AppContext';
import { AlertCircle, CheckCircle, Info, Split } from 'lucide-react';

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pioneerId: string;
  pioneerName: string;
  initialMonth?: ServiceMonthNumber;
}

export const AddCreditModal: React.FC<AddCreditModalProps> = ({
  isOpen,
  onClose,
  pioneerId,
  pioneerName,
  initialMonth = 1,
}) => {
  const { congregation, reports, currentYearId, addCreditEntry, isMonthLocked } = useApp();

  const [month, setMonth] = useState<ServiceMonthNumber>(initialMonth);
  const [kind, setKind] = useState<CreditKind>('asignacion');
  const [subtype, setSubtype] = useState<CreditSubtype>('ldc');
  const [hours, setHours] = useState<number>(15);
  const [note, setNote] = useState<string>('');

  // School hour split feature (for courses spanning two consecutive months)
  const [isSplitAcrossMonths, setIsSplitAcrossMonths] = useState<boolean>(false);
  const [splitMonth2Hours, setSplitMonth2Hours] = useState<number>(10);

  // Month 1 data
  const currentMonthReport = reports.find(
    (r) => r.pioneerId === pioneerId && r.yearId === currentYearId && r.month === month
  );
  const preachingHoursM1 = currentMonthReport ? currentMonthReport.preaching_hours : 0;
  const hasPreachingHoursM1 = preachingHoursM1 > 0;

  // Next month data for split
  const nextMonthNumber = (month < 12 ? month + 1 : 12) as ServiceMonthNumber;
  const nextMonthReport = reports.find(
    (r) => r.pioneerId === pioneerId && r.yearId === currentYearId && r.month === nextMonthNumber
  );
  const preachingHoursM2 = nextMonthReport ? nextMonthReport.preaching_hours : 0;

  // Compute live preview of credit application
  const monthlyCap = congregation.config.monthly_cap || 55;

  let previewMessage = '';
  let previewType: 'success' | 'warning' | 'info' = 'info';

  if (kind === 'escuela') {
    if (isSplitAcrossMonths && month < 12) {
      previewMessage = `Se sumarán las ${hours} h completas en ${MONTH_NAMES[month].name} y ${splitMonth2Hours} h completas en ${MONTH_NAMES[nextMonthNumber].name} (las horas de escuela no tienen tope).`;
      previewType = 'success';
    } else {
      previewMessage = `Se sumarán las ${hours} h completas a ${MONTH_NAMES[month].name} (las clases y escuelas teocráticas no tienen tope).`;
      previewType = 'success';
    }
  } else {
    // Asignación aprobada
    if (congregation.config.require_hours_for_credit && !hasPreachingHoursM1) {
      previewMessage = `Sin horas de predicación en ${MONTH_NAMES[month].name} (0 h reportadas): según la indicación, el crédito de asignaciones no se aplica este mes hasta registrar al menos 1 h de predicación.`;
      previewType = 'warning';
    } else {
      const roomUnderCap = Math.max(0, monthlyCap - preachingHoursM1);
      const applied = Math.min(hours, roomUnderCap);
      if (applied === hours) {
        previewMessage = `Se sumarán ${applied} de ${hours} h. Total del mes pasará de ${preachingHoursM1} h a ${preachingHoursM1 + applied} h.`;
        previewType = 'success';
      } else {
        previewMessage = `Se sumarán ${applied} de ${hours} h debido al tope de ${monthlyCap} h mensuales. (${preachingHoursM1} h reales + ${applied} h crédito = ${monthlyCap} h). Lo sobrante (${hours - applied} h) no se acumula.`;
        previewType = 'info';
      }
    }
  }

  const handleSave = () => {
    if (hours <= 0) return;

    if (kind === 'escuela' && isSplitAcrossMonths && month < 12) {
      // Add first part
      addCreditEntry({
        pioneerId,
        yearId: currentYearId,
        month,
        kind: 'escuela',
        hours: Number(hours),
        note: note ? `${note} (Parte 1/${MONTH_NAMES[month].short})` : 'Escuela (Parte 1)',
      });

      // Add second part
      if (splitMonth2Hours > 0) {
        addCreditEntry({
          pioneerId,
          yearId: currentYearId,
          month: nextMonthNumber,
          kind: 'escuela',
          hours: Number(splitMonth2Hours),
          note: note ? `${note} (Parte 2/${MONTH_NAMES[nextMonthNumber].short})` : 'Escuela (Parte 2)',
        });
      }
    } else {
      addCreditEntry({
        pioneerId,
        yearId: currentYearId,
        month,
        kind,
        subtype: kind === 'asignacion' ? subtype : null,
        hours: Number(hours),
        note,
      });
    }

    onClose();
  };

  const isLocked = isMonthLocked(month);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar crédito de horas"
      description={`Registrar crédito teocrático para ${pioneerName} en ${currentYearId}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-sm">
        {/* Month selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Mes de aplicación
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value) as ServiceMonthNumber)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
          >
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => (
              <option key={m} value={m}>
                Mes {m}: {MONTH_NAMES[m].name}
              </option>
            ))}
          </select>
          {isLocked && (
            <p className="text-xs text-rose-600 font-semibold mt-1">
              ⚠️ Este mes está marcado como enviado (bloqueado para edición).
            </p>
          )}
        </div>

        {/* Credit kind tabs */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Tipo de crédito
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setKind('asignacion');
                setIsSplitAcrossMonths(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                kind === 'asignacion'
                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                  : 'border-border bg-card hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-sm">Asignación aprobada</div>
              <div className="text-[11px] opacity-80 mt-0.5">Sujeto a tope de 55 h/mes</div>
            </button>
            <button
              type="button"
              onClick={() => setKind('escuela')}
              className={`p-3 rounded-xl border text-left transition-all ${
                kind === 'escuela'
                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                  : 'border-border bg-card hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-sm">Escuela teocrática</div>
              <div className="text-[11px] opacity-80 mt-0.5">Se cuenta completa</div>
            </button>
          </div>
        </div>

        {/* Subtype for assignment */}
        {kind === 'asignacion' && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Subtipo de asignación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'ldc', label: 'LDC' },
                { id: 'socorro', label: 'Socorro' },
                { id: 'servicio_voluntario', label: 'S. Voluntario' },
                { id: 'otra', label: 'Otra' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubtype(item.id as CreditSubtype)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    subtype === item.id
                      ? 'border-primary bg-primary text-primary-foreground font-semibold'
                      : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* School month-split toggle */}
        {kind === 'escuela' && month < 12 && (
          <div className="p-3 rounded-xl bg-secondary/60 border border-border/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSplitAcrossMonths}
                onChange={(e) => setIsSplitAcrossMonths(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-medium text-xs text-foreground flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-primary" />
                La escuela abarca dos meses ({MONTH_NAMES[month].short} y {MONTH_NAMES[nextMonthNumber].short})
              </span>
            </label>
            {isSplitAcrossMonths && (
              <p className="text-[11px] text-muted-foreground mt-1 ml-6">
                Permite dividir las horas entre ambos meses tal como indican las instrucciones teocráticas.
              </p>
            )}
          </div>
        )}

        {/* Hours input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {isSplitAcrossMonths ? `Horas en ${MONTH_NAMES[month].short}` : 'Horas de crédito'}
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={hours || ''}
              onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-semibold text-lg focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>

          {kind === 'escuela' && isSplitAcrossMonths && month < 12 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Horas en {MONTH_NAMES[nextMonthNumber].short}
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={splitMonth2Hours || ''}
                onChange={(e) => setSplitMonth2Hours(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-semibold text-lg focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Optional note */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Nota u observación (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. Apoyo en construcción LDC Salón de Asambleas"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
          />
        </div>

        {/* Live Preview Card */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
            previewType === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
              : previewType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-100'
          }`}
        >
          {previewType === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <span className="font-bold block mb-0.5">Vista previa del cálculo:</span>
            {previewMessage}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={hours <= 0 || isLocked}
          >
            Guardar crédito
          </Button>
        </div>
      </div>
    </Modal>
  );
};
