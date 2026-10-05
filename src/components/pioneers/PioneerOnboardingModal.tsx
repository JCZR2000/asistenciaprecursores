import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MONTH_NAMES, PioneerType, ServiceMonthNumber } from '../../domain/types';
import { calculateProratedGoal } from '../../domain/calculations';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  HeartHandshake,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

interface PioneerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PioneerOnboardingModal: React.FC<PioneerOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { congregation, currentYearId, refMonth, addPioneerWithOnboarding, availableGroups, updateCongregation } = useApp();

  const [step, setStep] = useState<number>(1);

  // Step 1: Datos básicos
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [groupNumber, setGroupNumber] = useState<number>(1);

  // Step 2: Tipo de precursor
  const [pioneerType, setPioneerType] = useState<PioneerType>('regular');
  const [approvalDate, setApprovalDate] = useState<string>('');
  const [s21Noted, setS21Noted] = useState<boolean>(true);

  // Step 3: Situación en el año
  const [isFullYear, setIsFullYear] = useState<boolean>(true);
  const [startMonth, setStartMonth] = useState<ServiceMonthNumber>(1);

  // Step 4: Meta prorrateada y ajuste manual
  const { months_in_year, goal: standardGoal, minimum: standardMin } = calculateProratedGoal(
    isFullYear ? 1 : startMonth,
    null,
    congregation.config
  );
  const [goalOverride, setGoalOverride] = useState<number | null>(null);

  // Step 5: Horas de meses trabajados (desde start_month hasta refMonth)
  const effectiveStartMonth = isFullYear ? 1 : startMonth;
  const [monthlyInputs, setMonthlyInputs] = useState<
    Record<number, { preaching_hours: number; bible_studies: number }>
  >({});

  const handleMonthHourChange = (m: number, hours: number) => {
    setMonthlyInputs((prev) => ({
      ...prev,
      [m]: {
        preaching_hours: hours,
        bible_studies: prev[m]?.bible_studies || 0,
      },
    }));
  };

  const handleMonthStudiesChange = (m: number, studies: number) => {
    setMonthlyInputs((prev) => ({
      ...prev,
      [m]: {
        preaching_hours: prev[m]?.preaching_hours || 0,
        bible_studies: studies,
      },
    }));
  };

  // Paste row helper (e.g. from clipboard spreadsheet)
  const handlePasteSpreadsheetRow = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const tokens = text.trim().split(/[\t, ]+/);
      const parsedHours = tokens.map((t) => parseFloat(t)).filter((n) => !isNaN(n));

      if (parsedHours.length > 0) {
        const updated: Record<number, { preaching_hours: number; bible_studies: number }> = { ...monthlyInputs };
        let tokenIndex = 0;
        for (let m = effectiveStartMonth; m <= refMonth && tokenIndex < parsedHours.length; m++) {
          updated[m] = {
            preaching_hours: parsedHours[tokenIndex],
            bible_studies: updated[m]?.bible_studies || 0,
          };
          tokenIndex++;
        }
        setMonthlyInputs(updated);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleFinish = () => {
    const initial_reports = Object.entries(monthlyInputs)
      .map(([m, data]) => ({
        month: Number(m) as ServiceMonthNumber,
        preaching_hours: Number(data.preaching_hours) || 0,
        bible_studies: Number(data.bible_studies) || 0,
      }))
      .filter((r) => r.month >= effectiveStartMonth && r.month <= 12);

    addPioneerWithOnboarding({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      group_number: Number(groupNumber),
      pioneer_type: pioneerType,
      start_month: effectiveStartMonth,
      goal_override: pioneerType === 'regular' ? goalOverride : null,
      approval_date: pioneerType === 'salud_delicada' ? approvalDate : null,
      s21_noted: pioneerType === 'salud_delicada' ? s21Noted : false,
      initial_reports,
    });

    onClose();
  };

  const totalSteps = pioneerType === 'salud_delicada' ? 5 : 6;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alta de precursor (Paso a paso)"
      description={`Nuevo precursor regular en ${currentYearId}`}
      maxWidth="2xl"
    >
      {/* Step progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
          <span>Paso {step} de {totalSteps}</span>
          <span>
            {step === 1 && '1. Datos personales'}
            {step === 2 && '2. Tipo de precursor'}
            {step === 3 && '3. Mes de inicio'}
            {step === 4 && (pioneerType === 'salud_delicada' ? '4. Horas trabajadas' : '4. Meta anual')}
            {step === 5 && (pioneerType === 'salud_delicada' ? '5. Confirmación' : '5. Horas trabajadas')}
            {step === 6 && '6. Confirmación final'}
          </span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Datos básicos */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Nombre(s) *
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Apellidos *
              </label>
              <input
                type="text"
                placeholder="Ej. Morales Díaz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Grupo de servicio del campo
              </label>
              <button
                type="button"
                onClick={() => {
                  const maxGrp = Math.max(...availableGroups, congregation.groups_count || 1);
                  const nextGrp = maxGrp + 1;
                  updateCongregation({ groups_count: nextGrp });
                  setGroupNumber(nextGrp);
                }}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                + Añadir Grupo {Math.max(...availableGroups, congregation.groups_count || 1) + 1}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {availableGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupNumber(g)}
                  className={`h-10 rounded-xl border font-bold text-sm transition-all flex items-center justify-center ${
                    groupNumber === g
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  Grupo {g}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const maxGrp = Math.max(...availableGroups, congregation.groups_count || 1);
                  const nextGrp = maxGrp + 1;
                  updateCongregation({ groups_count: nextGrp });
                  setGroupNumber(nextGrp);
                }}
                className="h-10 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/5 font-semibold text-xs transition-all flex items-center justify-center"
              >
                + Grupo {Math.max(...availableGroups, congregation.groups_count || 1) + 1}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
              <span className="text-muted-foreground font-medium">O escribir otro número de grupo:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={groupNumber}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setGroupNumber(val);
                  if (val > (congregation.groups_count || 1)) {
                    updateCongregation({ groups_count: val });
                  }
                }}
                className="w-16 h-8 px-2 rounded-lg border border-border bg-card text-foreground font-bold text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Tipo de precursor */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPioneerType('regular')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                pioneerType === 'regular'
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="w-5 h-5" />
                Precursor Regular
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Requisito base de 50 h/mes (meta anual de 600 h prorrateada según inicio). Con medidor de ritmo y revisión periódica.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPioneerType('salud_delicada')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                pioneerType === 'salud_delicada'
                  ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <HeartHandshake className="w-5 h-5" />
                Salud delicada
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Arreglo amoroso para precursores de edad o salud precaria aprobado por los ancianos. <strong>Sin meta fija de horas</strong>.
              </p>
            </button>
          </div>

          {pioneerType === 'salud_delicada' && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-3">
              <div className="font-semibold text-purple-900 dark:text-purple-200">
                Condiciones del arreglo teocrático (Plan.md Sección 2.4):
              </div>
              <ul className="list-disc pl-4 space-y-1 text-purple-800 dark:text-purple-300">
                <li>Mayor de 50 años de edad.</li>
                <li>Al menos 15 años de servicio como precursor regular.</li>
                <li>Desea sinceramente seguir siendo precursor.</li>
                <li>Aprobado formalmente por el cuerpo de ancianos y anotado en el registro S-21.</li>
              </ul>
              <div className="pt-2 border-t border-purple-500/20 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block font-semibold mb-1">Fecha de aprobación por ancianos (opcional):</label>
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-card text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="s21Check"
                    checked={s21Noted}
                    onChange={(e) => setS21Noted(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="s21Check" className="font-medium cursor-pointer">
                    Anotado en tarjeta S-21
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Situación en este año de servicio */}
      {step === 3 && (
        <div className="space-y-4">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            ¿Cuándo inició su servicio en este año ({currentYearId})?
          </label>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setIsFullYear(true);
                setStartMonth(1);
              }}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                isFullYear
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-foreground">
                  Ya era precursor desde el inicio del año (Septiembre)
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Año completo de 12 meses (Septiembre a Agosto)
                </div>
              </div>
              {isFullYear && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFullYear(false);
                if (startMonth === 1) setStartMonth(5); // default January
              }}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                !isFullYear
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-foreground">
                  Comenzó a servir a mitad del año de servicio
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Se calculará su meta prorrateada de acuerdo con el mes de inicio
                </div>
              </div>
              {!isFullYear && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>
          </div>

          {!isFullYear && (
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Selecciona el mes en que comenzó:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setStartMonth(m)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      startMonth === m
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-accent'
                    }`}
                  >
                    {MONTH_NAMES[m].name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Meta prorrateada (Solo Regular) */}
      {step === 4 && pioneerType === 'regular' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-secondary/50 border border-border/80 text-center space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Meta teocrática anual prorrateada
            </span>
            <div className="text-4xl font-extrabold text-primary">
              {goalOverride || standardGoal} <span className="text-xl font-normal text-muted-foreground">horas</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculada: {months_in_year} meses restantes a 50 h/mes (mínimo para continuar: {Math.round(standardMin)} h)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Ajuste manual de meta (opcional)
            </label>
            <input
              type="number"
              placeholder={`Meta estándar: ${standardGoal} h`}
              value={goalOverride || ''}
              onChange={(e) => setGoalOverride(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Déjalo en blanco para usar la meta automática prorrateada ({standardGoal} h).
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Horas de meses ya trabajados (o Step 4 si salud delicada) */}
      {((step === 5 && pioneerType === 'regular') || (step === 4 && pioneerType === 'salud_delicada')) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingresa las horas de los meses ya informados (hasta el mes de referencia actual: {MONTH_NAMES[refMonth].name}). Puedes completar esto ahora o después.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteSpreadsheetRow}
              className="text-xs gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5 text-primary" />
              Pegar fila de Excel
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 border border-border rounded-xl p-2 bg-secondary/30">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => {
              const isDisabled = m < effectiveStartMonth;
              const isFuture = m > refMonth;

              return (
                <div
                  key={m}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isDisabled
                      ? 'bg-muted/30 border-dashed border-border text-muted-foreground/60'
                      : isFuture
                      ? 'bg-card/60 border-border/40 text-muted-foreground'
                      : 'bg-card border-border shadow-xs'
                  }`}
                >
                  <div className="w-28 font-medium text-xs">
                    {MONTH_NAMES[m].name}
                    {isDisabled && <span className="block text-[10px] text-muted-foreground">Previo a inicio</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Horas:</span>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        disabled={isDisabled}
                        placeholder={isDisabled ? '—' : '0'}
                        value={monthlyInputs[m]?.preaching_hours || ''}
                        onChange={(e) => handleMonthHourChange(m, Number(e.target.value))}
                        className="w-16 h-8 text-center text-xs font-semibold rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Cursos:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        disabled={isDisabled}
                        placeholder={isDisabled ? '—' : '0'}
                        value={monthlyInputs[m]?.bible_studies || ''}
                        onChange={(e) => handleMonthStudiesChange(m, Number(e.target.value))}
                        className="w-12 h-8 text-center text-xs font-semibold rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Final: Resumen y guardar */}
      {((step === 6 && pioneerType === 'regular') || (step === 5 && pioneerType === 'salud_delicada')) && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resumen del alta
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Nombre completo:</span>
                <span className="font-semibold text-foreground">{firstName} {lastName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Grupo de servicio:</span>
                <span className="font-semibold text-foreground">Grupo {groupNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Tipo de precursor:</span>
                <span className="font-semibold text-foreground">
                  {pioneerType === 'regular' ? 'Precursor Regular' : 'Salud delicada (sin meta)'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Mes de inicio:</span>
                <span className="font-semibold text-foreground">{MONTH_NAMES[effectiveStartMonth].name}</span>
              </div>
              {pioneerType === 'regular' && (
                <div>
                  <span className="text-muted-foreground block">Meta anual:</span>
                  <span className="font-bold text-primary">{goalOverride || standardGoal} horas</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Al confirmar, el precursor se registrará de inmediato y sus estadísticas se actualizarán en el panel.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-5 border-t border-border/60 mt-4">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Anterior
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
        )}

        {step < totalSteps ? (
          <Button
            variant="default"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && (!firstName.trim() || !lastName.trim())}
            className="gap-1.5 text-xs"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="success" onClick={handleFinish} className="gap-1.5 text-xs">
            <Check className="w-4 h-4" /> Guardar Precursor
          </Button>
        )}
      </div>
    </Modal>
  );
};
