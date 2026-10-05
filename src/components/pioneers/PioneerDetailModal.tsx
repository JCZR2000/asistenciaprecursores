import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PaceMeter } from '../ui/PaceMeter';
import { MONTH_NAMES, ServiceMonthNumber } from '../../domain/types';
import { useApp } from '../../context/AppContext';
import { AddCreditModal } from '../credits/AddCreditModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  Calendar,
  Lock,
  Plus,
  Save,
  Trash2,
  Users,
  Shield,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PioneerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pioneerId: string;
}

export const PioneerDetailModal: React.FC<PioneerDetailModalProps> = ({
  isOpen,
  onClose,
  pioneerId,
}) => {
  const {
    pioneers,
    pioneerYears,
    pioneerCalculations,
    currentYearId,
    currentUser,
    saveMonthlyReport,
    credits,
    deleteCreditEntry,
    getPrivateNote,
    savePrivateNote,
    isMonthLocked,
    refMonth,
    getPioneerHistory,
    togglePioneerActive,
    deletePioneer,
    setCurrentYearId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'summary' | 'months' | 'notes' | 'history'>('summary');
  const [creditModalMonth, setCreditModalMonth] = useState<ServiceMonthNumber | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const pioneer = pioneers.find((p) => p.id === pioneerId);
  const yearRecord = pioneerYears.find(
    (py) => py.pioneerId === pioneerId && py.yearId === currentYearId
  );
  const calc = pioneerCalculations.get(pioneerId);

  // Private note local edit state
  const [noteText, setNoteText] = useState<string>(() => (pioneerId ? getPrivateNote(pioneerId) : ''));
  const [isNoteSaved, setIsNoteSaved] = useState<boolean>(false);

  if (!pioneer || !yearRecord || !calc) return null;

  const handleSaveNote = () => {
    savePrivateNote(pioneerId, noteText);
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  // Prepare data for monthly stacked bar chart
  const chartData = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => {
    const res = calc.monthly_results[m];
    return {
      name: MONTH_NAMES[m].short,
      'Horas Reales': res.isBeforeStart ? 0 : res.preaching_hours,
      'Crédito Asignación': res.isBeforeStart ? 0 : res.assign_applied,
      'Crédito Escuela': res.isBeforeStart ? 0 : res.school_hours,
      Total: res.total,
      isBefore: res.isBeforeStart,
    };
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span>{pioneer.first_name} {pioneer.last_name}</span>
            <Badge variant={calc.status}>
              {calc.status === 'en_camino'
                ? 'En camino a cumplir'
                : calc.status === 'salud_delicada'
                ? 'Salud delicada'
                : calc.status === 'cumplido'
                ? 'Cumplió la meta'
                : calc.status === 'minimo'
                ? 'Mínimo alcanzado'
                : calc.status === 'atrasado'
                ? 'Un poco atrasado'
                : calc.status === 'cerca'
                ? 'Cerca de la meta'
                : 'En riesgo'}
            </Badge>
          </div>
        }
        description={`Grupo ${pioneer.group_number} · Año de servicio ${currentYearId} · Inicio: ${MONTH_NAMES[yearRecord.start_month].name}`}
        maxWidth="3xl"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-border pb-1 mb-4 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 px-3 border-b-2 shrink-0 transition-all ${
              activeTab === 'summary'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Resumen y Ritmo
          </button>
          <button
            onClick={() => setActiveTab('months')}
            className={`pb-2 px-3 border-b-2 shrink-0 transition-all ${
              activeTab === 'months'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Desglose de Meses y Créditos
          </button>
          {currentUser.role === 'secretary' && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 px-3 border-b-2 shrink-0 transition-all ${
                activeTab === 'notes'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Notas Privadas (Secretario)
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-3 border-b-2 shrink-0 transition-all ${
              activeTab === 'history'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial por Años
          </button>
        </div>

        {/* Tab 1: Summary & Pace Gauge */}
        {activeTab === 'summary' && (
          <div className="space-y-5">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Total Acumulado
                </span>
                <span className="text-xl font-bold text-foreground">{calc.total_hours} h</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  ({calc.total_preaching} h + {calc.total_credits_applied} h créd.)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Meta del Año
                </span>
                <span className="text-xl font-bold text-primary">
                  {calc.goal !== null ? `${calc.goal} h` : 'Sin meta fija'}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {calc.minimum !== null ? `Mín: ${Math.round(calc.minimum)} h` : 'Según posib.'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Horas Restantes
                </span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {calc.remaining_hours !== null ? `${calc.remaining_hours} h` : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Para alcanzar 100%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Ritmo Requerido
                </span>
                <span className="text-xl font-bold text-foreground">
                  {calc.pace.needed_pace !== null ? `${Math.round(calc.pace.needed_pace)} h/m` : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {calc.pace.months_left} meses restantes
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Proyección Fin de Año
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {calc.pace.projected_year_end_hours !== null ? `~${calc.pace.projected_year_end_hours} h` : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {calc.goal && calc.pace.projected_year_end_hours !== null
                    ? calc.pace.projected_year_end_hours >= calc.goal
                      ? 'Cumpliría meta'
                      : `${calc.goal - calc.pace.projected_year_end_hours} h bajo meta`
                    : 'Al ritmo actual'}
                </span>
              </div>
            </div>

            {/* Pace Meter & Semicircular Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Medidor de Ritmo al mes de referencia ({MONTH_NAMES[refMonth].name})
                </span>
                <PaceMeter pace={calc.pace} showDetails={true} />
              </div>

              {/* Monthly Stacked Bar Chart */}
              <div className="h-64 p-3 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                  <span>ACTIVIDAD MENSUAL (APILADA)</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Línea guía: 50 h</span>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" interval={0} stroke="#888888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(23, 23, 23, 0.95)',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <ReferenceLine y={50} stroke="#3b82f6" strokeDasharray="3 3" />
                      <Bar dataKey="Horas Reales" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Crédito Asignación" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Crédito Escuela" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Breakdown & Credits Table */}
        {activeTab === 'months' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Haz clic en una fila para editar las horas reales o agregar créditos teocráticos.
              </p>
              {currentUser.role === 'secretary' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreditModalMonth(refMonth)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" /> Agregar crédito al mes
                </Button>
              )}
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/70 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-2.5">Mes</th>
                    <th className="p-2.5">Horas Reales</th>
                    <th className="p-2.5">Crédito Asignación</th>
                    <th className="p-2.5">Crédito Escuela</th>
                    <th className="p-2.5 font-bold text-foreground">Total Mes</th>
                    <th className="p-2.5">Cursos</th>
                    <th className="p-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => {
                    const row = calc.monthly_results[m];
                    const isLocked = isMonthLocked(m);
                    const isRef = m === refMonth;

                    return (
                      <tr
                        key={m}
                        className={`transition-colors hover:bg-muted/40 ${
                          isRef ? 'bg-primary/5 font-medium' : ''
                        } ${row.isBeforeStart ? 'opacity-40 bg-muted/20' : ''}`}
                      >
                        <td className="p-2.5 font-medium flex items-center gap-1.5">
                          {isLocked && <Lock className="w-3 h-3 text-rose-500" />}
                          <span>{MONTH_NAMES[m].name}</span>
                          {row.isBeforeStart && (
                            <span className="text-[9px] text-muted-foreground">(Previo)</span>
                          )}
                          {isRef && (
                            <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-bold">
                              Ref
                            </span>
                          )}
                        </td>

                        {/* Editable real hours if secretary and unlocked */}
                        <td className="p-2.5">
                          {currentUser.role === 'secretary' && !isLocked && !row.isBeforeStart ? (
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={row.preaching_hours || ''}
                              onChange={(e) =>
                                saveMonthlyReport(
                                  pioneerId,
                                  m,
                                  Number(e.target.value) || 0,
                                  row.bible_studies
                                )
                              }
                              className="w-16 h-7 text-xs font-semibold px-1.5 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <span className="font-semibold">
                              {row.isBeforeStart ? '—' : `${row.preaching_hours} h`}
                            </span>
                          )}
                        </td>

                        <td className="p-2.5">
                          {row.assign_entered > 0 ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              +{row.assign_applied} h{' '}
                              {row.assign_entered > row.assign_applied && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({row.assign_entered} ingr.)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="p-2.5">
                          {row.school_hours > 0 ? (
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              +{row.school_hours} h
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="p-2.5 font-bold text-foreground">
                          {row.isBeforeStart ? '—' : `${row.total} h`}
                        </td>

                        <td className="p-2.5">
                          {currentUser.role === 'secretary' && !isLocked && !row.isBeforeStart ? (
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={row.bible_studies || ''}
                              onChange={(e) =>
                                saveMonthlyReport(
                                  pioneerId,
                                  m,
                                  row.preaching_hours,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-12 h-7 text-xs px-1.5 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <span>{row.isBeforeStart ? '—' : row.bible_studies}</span>
                          )}
                        </td>

                        <td className="p-2.5 text-right">
                          {currentUser.role === 'secretary' && !row.isBeforeStart && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCreditModalMonth(m)}
                              className="h-6 px-2 text-[11px]"
                            >
                              + Crédito
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* List of registered credits for this pioneer */}
            {credits.filter((c) => c.pioneerId === pioneerId && c.yearId === currentYearId).length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-secondary/40 border border-border/80">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Créditos Teocráticos Registrados
                </span>
                <div className="space-y-1.5">
                  {credits
                    .filter((c) => c.pioneerId === pioneerId && c.yearId === currentYearId)
                    .map((cred) => (
                      <div
                        key={cred.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            {MONTH_NAMES[cred.month].name}: +{cred.hours} h ({cred.kind === 'escuela' ? 'Escuela' : `Asignación ${cred.subtype || ''}`})
                          </span>
                          {cred.note && <span className="text-muted-foreground block text-[11px]">{cred.note}</span>}
                        </div>
                        {currentUser.role === 'secretary' && (
                          <button
                            onClick={() => deleteCreditEntry(cred.id!)}
                            className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                            title="Eliminar crédito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Private Notes (Secretary Only) */}
        {activeTab === 'notes' && currentUser.role === 'secretary' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">Confidencialidad Teocrática:</span>
              Las notas privadas solo son visibles para el secretario. Nunca se comparten con usuarios con rol de lector ni se incluyen en exportaciones generales.
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Notas y observaciones de seguimiento:
              </label>
              <textarea
                rows={5}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Anota acuerdos con los superintendentes, fechas de conversación de ayuda, circunstancias de salud o trabajo..."
                className="w-full p-3 rounded-xl border border-border bg-card text-foreground text-xs leading-relaxed focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {isNoteSaved && <span className="text-emerald-600 font-semibold">✓ Nota guardada correctamente</span>}
              </span>
              <Button size="sm" variant="default" onClick={handleSaveNote} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" /> Guardar nota privada
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Multi-Year History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div>
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Historial Teocrático por Años de Servicio
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Registro real de horas, créditos y cumplimiento del precursor a lo largo del tiempo.
                </p>
              </div>
              {currentUser.role === 'secretary' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePioneerActive(pioneer.id, !pioneer.active)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                      pioneer.active
                        ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                        : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {pioneer.active ? 'Registrar Baja / Inactivo' : 'Reactivar en el Servicio'}
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors flex items-center gap-1"
                    title="Eliminar precursor definitivamente"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              )}
            </div>

            {getPioneerHistory(pioneerId).length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">
                No hay registros anteriores disponibles para este precursor.
              </p>
            ) : (
              <div className="space-y-3">
                {getPioneerHistory(pioneerId).map(({ year, yearRecord: py, calc: yrCalc }) => (
                  <div
                    key={year.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      year.id === currentYearId
                        ? 'border-primary/40 bg-primary/5 shadow-xs'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{year.label}</span>
                        {year.id === currentYearId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                            Año en Curso
                          </span>
                        )}
                        {year.closed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            Cerrado
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {py.pioneer_type === 'salud_delicada' ? 'Salud delicada' : 'Regular'}
                        </span>
                      </div>

                      <Badge variant={yrCalc.status}>
                        {yrCalc.status === 'en_camino'
                          ? 'En camino'
                          : yrCalc.status === 'cumplido'
                          ? 'Meta Cumplida'
                          : yrCalc.status === 'minimo'
                          ? 'Mínimo Cumplido'
                          : yrCalc.status === 'salud_delicada'
                          ? 'Salud delicada'
                          : yrCalc.status === 'atrasado'
                          ? 'Un poco atrasado'
                          : yrCalc.status === 'cerca'
                          ? 'Cerca'
                          : 'En riesgo'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Total Anual
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {yrCalc.total_hours} h
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Meta: {yrCalc.goal || '—'} h
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Predicación Real
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {yrCalc.total_preaching} h
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Promedio: {Math.round(yrCalc.average_monthly_hours)} h/mes
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Créditos Aplicados
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {yrCalc.total_credits_applied} h
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {yrCalc.total_credits_applied > 0 ? 'Aprobados' : 'Sin créditos'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Mínimo Exigido
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {yrCalc.minimum ? `${Math.round(yrCalc.minimum)} h` : '—'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {yrCalc.total_hours >= (yrCalc.minimum || 0) ? 'Alcanzado' : 'No alcanzado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal footer danger action for Secretary */}
        {currentUser.role === 'secretary' && (
          <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
              ID: {pioneer.id} · Grupo {pioneer.group_number}
            </span>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar este precursor
            </button>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title={
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar Eliminación de Precursor</span>
            </div>
          }
          description={`¿Estás seguro de que deseas eliminar permanentemente a ${pioneer.first_name} ${pioneer.last_name}?`}
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta acción eliminará de forma irreversible al hermano de la congregación,
              junto con todos sus informes de horas, créditos y registros del año.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deletePioneer(pioneer.id);
                  setIsDeleteConfirmOpen(false);
                  onClose();
                }}
                className="text-xs font-bold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sí, eliminar precursor
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Credit modal triggered from month row */}
      {creditModalMonth !== null && (
        <AddCreditModal
          isOpen={creditModalMonth !== null}
          onClose={() => setCreditModalMonth(null)}
          pioneerId={pioneerId}
          pioneerName={`${pioneer.first_name} ${pioneer.last_name}`}
          initialMonth={creditModalMonth}
        />
      )}
    </>
  );
};
