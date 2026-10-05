import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Users,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface CongregationSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const CongregationSetupModal: React.FC<CongregationSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    congregation,
    currentYearId,
    completeCongregationSetup,
    openExcelImportModal,
    showToast,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState<string>(
    congregation.name && congregation.name !== 'Congregación Central'
      ? congregation.name
      : ''
  );
  const [congregationNumber, setCongregationNumber] = useState<string>(
    congregation.congregation_number || ''
  );
  const [groupsCount, setGroupsCount] = useState<number>(
    congregation.groups_count && congregation.groups_count >= 1
      ? congregation.groups_count
      : 6
  );
  const [serviceYear, setServiceYear] = useState<string>(currentYearId);
  const [startMode, setStartMode] = useState<'clean' | 'excel' | 'sample'>('clean');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la congregación.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinish = () => {
    completeCongregationSetup({
      name: name.trim(),
      congregation_number: congregationNumber.trim() || undefined,
      groups_count: Math.max(1, groupsCount),
      serviceYear,
      mode: startMode,
    });

    if (startMode === 'excel') {
      setTimeout(() => {
        openExcelImportModal();
      }, 300);
    }

    if (onClose) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if setup is already completed
        if (congregation.setup_completed && onClose) {
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Bienvenida y Configuración de Congregación
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Paso {step} de 2 · {step === 1 ? 'Datos de tu Congregación' : 'Punto de partida'}
            </p>
          </div>
        </div>
      }
      description="Configura los detalles de tu congregación para iniciar la gestión teocrática de los precursores."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 h-1.5 rounded-full transition-all ${
              step >= 1 ? 'bg-primary' : 'bg-secondary'
            }`}
          />
          <div
            className={`flex-1 h-1.5 rounded-full transition-all ${
              step === 2 ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: CONGREGATION INFO */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Nombre de la Congregación <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Ej. La Esperanza, Bella Vista, etc."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Número de Congregación (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 12345"
                  value={congregationNumber}
                  onChange={(e) => setCongregationNumber(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Año de Servicio Inicial
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={serviceYear}
                    onChange={(e) => setServiceYear(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Groups Count Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Cantidad de Grupos de Predicación
                </label>
                <span className="text-xs font-bold text-primary">
                  {groupsCount} {groupsCount === 1 ? 'grupo' : 'grupos'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Selecciona la cantidad de grupos en los que está organizada tu congregación.
              </p>

              {/* Quick group selector pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[3, 4, 5, 6, 7, 8, 9, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGroupsCount(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      groupsCount === num
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Otro número:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={groupsCount}
                  onChange={(e) => setGroupsCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 h-9 px-2 text-center rounded-lg border border-border bg-background text-xs font-bold focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STARTING MODE */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Selecciona cómo te gustaría empezar a registrar los precursores de <strong>{name}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: Clean start (Recommended) */}
              <button
                type="button"
                onClick={() => setStartMode('clean')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  startMode === 'clean'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    startMode === 'clean'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">
                      Comenzar desde cero (Recomendado)
                    </h4>
                    {startMode === 'clean' && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Tu congregación iniciará limpia, sin datos de prueba, lista para dar de alta
                    los precursores reales de tu congregación y registrar sus horas.
                  </p>
                </div>
              </button>

              {/* Option 2: Excel Import */}
              <button
                type="button"
                onClick={() => setStartMode('excel')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  startMode === 'excel'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    startMode === 'excel'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">
                      Importar archivo de Excel
                    </h4>
                    {startMode === 'excel' && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Si ya tienes un archivo de Excel con los precursores y sus horas mensuales,
                    el asistente te permitirá cargarlo de una sola vez.
                  </p>
                </div>
              </button>

              {/* Option 3: Sample data */}
              <button
                type="button"
                onClick={() => setStartMode('sample')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  startMode === 'sample'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    startMode === 'sample'
                      ? 'bg-blue-600 text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">
                      Cargar datos de demostración
                    </h4>
                    {startMode === 'sample' && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Carga 10 precursores de muestra con informes simulados. Ideal si deseas explorar
                    los gráficos, medidores y revisiones antes de ingresar datos reales.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {step === 2 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleNext}
              className="gap-2 text-xs font-bold"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleFinish}
              className="gap-2 text-xs font-bold bg-primary text-primary-foreground"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar y Entrar al Dashboard</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
