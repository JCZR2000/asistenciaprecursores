import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MONTH_NAMES, ServiceMonthNumber } from '../../domain/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddCreditModal } from '../credits/AddCreditModal';
import { SortableHeader } from '../ui/SortableHeader';
import {
  Calendar,
  Lock,
  Unlock,
  Check,
  Plus,
  Info,
  Search,
  Filter,
  CheckCircle2,
  X,
  ArrowUpDown,
} from 'lucide-react';

interface QuickMonthEntryViewProps {
  onSelectPioneer: (pioneerId: string) => void;
}

type SortField = 'name' | 'group' | 'hours' | 'credits' | 'total' | 'studies';

export const QuickMonthEntryView: React.FC<QuickMonthEntryViewProps> = ({ onSelectPioneer }) => {
  const {
    activePioneersForYear,
    currentYearId,
    refMonth,
    saveMonthlyReport,
    isMonthLocked,
    toggleMonthLock,
    currentUser,
    availableGroups,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<ServiceMonthNumber>(refMonth);
  const [creditPioneerId, setCreditPioneerId] = useState<string | null>(null);
  const [creditPioneerName, setCreditPioneerName] = useState<string>('');

  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedReportFilter, setSelectedReportFilter] = useState<'all' | 'sin_informe' | 'con_informe' | 'con_credito'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Local draft inputs to prevent cursor jumps and eliminate lag while typing
  const [draftInputs, setDraftInputs] = useState<Record<string, { hours?: string; studies?: string }>>({});
  const [savedBadge, setSavedBadge] = useState<Record<string, boolean>>({});
  const debounceTimers = useRef<Record<string, any>>({});

  const isLocked = isMonthLocked(selectedMonth);

  // Clear drafts when changing month
  useEffect(() => {
    setDraftInputs({});
  }, [selectedMonth]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleOpenCredit = (pioneerId: string, name: string) => {
    setCreditPioneerId(pioneerId);
    setCreditPioneerName(name);
  };

  const handleSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(f);
      setSortOrder('asc');
    }
  };

  // Debounced commit helper
  const commitReport = (pioneerId: string, hoursVal: number, studiesVal: number) => {
    saveMonthlyReport(pioneerId, selectedMonth, hoursVal, studiesVal);
    setSavedBadge((prev) => ({ ...prev, [pioneerId]: true }));
    setTimeout(() => {
      setSavedBadge((prev) => ({ ...prev, [pioneerId]: false }));
    }, 1800);
  };

  const handleHoursChange = (pioneerId: string, text: string, currentStudies: number) => {
    setDraftInputs((prev) => ({
      ...prev,
      [pioneerId]: {
        ...prev[pioneerId],
        hours: text,
      },
    }));

    if (debounceTimers.current[`h_${pioneerId}`]) {
      clearTimeout(debounceTimers.current[`h_${pioneerId}`]);
    }

    debounceTimers.current[`h_${pioneerId}`] = setTimeout(() => {
      const num = text.trim() === '' ? 0 : Math.max(0, Math.min(250, Number(text) || 0));
      const studies = draftInputs[pioneerId]?.studies !== undefined
        ? Number(draftInputs[pioneerId]?.studies) || 0
        : currentStudies;
      commitReport(pioneerId, num, studies);
    }, 600);
  };

  const handleHoursBlur = (pioneerId: string, currentStudies: number) => {
    if (debounceTimers.current[`h_${pioneerId}`]) {
      clearTimeout(debounceTimers.current[`h_${pioneerId}`]);
    }
    const draft = draftInputs[pioneerId]?.hours;
    if (draft !== undefined) {
      const num = draft.trim() === '' ? 0 : Math.max(0, Math.min(250, Number(draft) || 0));
      const studies = draftInputs[pioneerId]?.studies !== undefined
        ? Number(draftInputs[pioneerId]?.studies) || 0
        : currentStudies;
      commitReport(pioneerId, num, studies);
    }
  };

  const handleStudiesChange = (pioneerId: string, text: string, currentHours: number) => {
    setDraftInputs((prev) => ({
      ...prev,
      [pioneerId]: {
        ...prev[pioneerId],
        studies: text,
      },
    }));

    if (debounceTimers.current[`s_${pioneerId}`]) {
      clearTimeout(debounceTimers.current[`s_${pioneerId}`]);
    }

    debounceTimers.current[`s_${pioneerId}`] = setTimeout(() => {
      const studiesNum = text.trim() === '' ? 0 : Math.max(0, Math.min(50, Number(text) || 0));
      const hours = draftInputs[pioneerId]?.hours !== undefined
        ? Number(draftInputs[pioneerId]?.hours) || 0
        : currentHours;
      commitReport(pioneerId, hours, studiesNum);
    }, 600);
  };

  const handleStudiesBlur = (pioneerId: string, currentHours: number) => {
    if (debounceTimers.current[`s_${pioneerId}`]) {
      clearTimeout(debounceTimers.current[`s_${pioneerId}`]);
    }
    const draft = draftInputs[pioneerId]?.studies;
    if (draft !== undefined) {
      const studiesNum = draft.trim() === '' ? 0 : Math.max(0, Math.min(50, Number(draft) || 0));
      const hours = draftInputs[pioneerId]?.hours !== undefined
        ? Number(draftInputs[pioneerId]?.hours) || 0
        : currentHours;
      commitReport(pioneerId, hours, studiesNum);
    }
  };

  // Filtered and Sorted pioneers
  const displayedPioneers = useMemo(() => {
    return activePioneersForYear.filter(({ pioneer, calc }) => {
      const monthData = calc.monthly_results[selectedMonth];
      const fullName = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();

      // Search
      if (searchQuery.trim() && !fullName.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Group
      if (selectedGroup !== 'all' && pioneer.group_number !== Number(selectedGroup)) {
        return false;
      }

      // Report status
      if (selectedReportFilter === 'sin_informe') {
        if (monthData.preaching_hours > 0 || monthData.isBeforeStart) return false;
      } else if (selectedReportFilter === 'con_informe') {
        if (monthData.preaching_hours === 0 || monthData.isBeforeStart) return false;
      } else if (selectedReportFilter === 'con_credito') {
        if (monthData.credit_total_applied <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      const aMonth = a.calc.monthly_results[selectedMonth];
      const bMonth = b.calc.monthly_results[selectedMonth];
      let comp = 0;

      if (sortField === 'name') {
        comp = a.pioneer.first_name.localeCompare(b.pioneer.first_name);
      } else if (sortField === 'group') {
        comp = a.pioneer.group_number - b.pioneer.group_number;
      } else if (sortField === 'hours') {
        comp = aMonth.preaching_hours - bMonth.preaching_hours;
      } else if (sortField === 'credits') {
        comp = aMonth.credit_total_applied - bMonth.credit_total_applied;
      } else if (sortField === 'total') {
        comp = aMonth.total - bMonth.total;
      } else if (sortField === 'studies') {
        comp = aMonth.bible_studies - bMonth.bible_studies;
      }

      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [
    activePioneersForYear,
    selectedMonth,
    searchQuery,
    selectedGroup,
    selectedReportFilter,
    sortField,
    sortOrder,
  ]);

  return (
    <div className="space-y-4">
      {/* Top month selection & lock bar */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-sm text-foreground whitespace-nowrap">Mes de captura:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value) as ServiceMonthNumber)}
            className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => (
              <option key={m} value={m}>
                {MONTH_NAMES[m].name} (Mes {m})
              </option>
            ))}
          </select>
        </div>

        {/* Lock/Unlock month button for secretary */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentUser.role === 'secretary' && (
            <Button
              size="sm"
              variant={isLocked ? 'secondary' : 'outline'}
              onClick={() => toggleMonthLock(selectedMonth)}
              className="w-full sm:w-auto text-xs h-10 gap-1.5 justify-center"
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-500" /> Reabrir mes para edición
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-500" /> Marcar mes como enviado (Bloquear)
                </>
              )}
            </Button>
          )}

          {isLocked && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Mes bloqueado
            </span>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span>
            Este mes ha sido marcado como enviado a la sucursal. La edición de horas está bloqueada para evitar modificaciones accidentales.
          </span>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full md:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos los grupos</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>

          {/* Report Status Filter */}
          <select
            value={selectedReportFilter}
            onChange={(e) => setSelectedReportFilter(e.target.value as any)}
            className="w-full md:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="sin_informe">⚪ Sin informe este mes</option>
            <option value="con_informe">🟢 Con horas registradas</option>
            <option value="con_credito">⭐ Con crédito aplicado</option>
          </select>

          {/* Mobile Sort Selector */}
          <div className="col-span-2 md:hidden flex items-center gap-1.5 w-full">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="flex-1 h-10 px-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="name">Ordenar: Nombre</option>
              <option value="group">Ordenar: Grupo</option>
              <option value="hours">Ordenar: Horas</option>
              <option value="total">Ordenar: Total</option>
              <option value="studies">Ordenar: Cursos</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-border bg-background text-foreground"
              title="Cambiar dirección de orden"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {(searchQuery || selectedGroup !== 'all' || selectedReportFilter !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedGroup('all');
                setSelectedReportFilter('all');
              }}
              className="h-10 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Pioneer entry table */}
      <div className="hidden md:block border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <SortableHeader
                label="Precursor"
                field="name"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Grupo"
                field="group"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Horas de Predicación"
                field="hours"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Crédito Aplicado"
                field="credits"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Total del Mes"
                field="total"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Cursos Bíblicos"
                field="studies"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <th className="p-3.5 text-right">Crédito / Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedPioneers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {activePioneersForYear.length === 0
                        ? 'No hay precursores registrados en este año de servicio.'
                        : 'No se encontraron precursores con los filtros seleccionados.'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activePioneersForYear.length === 0
                        ? 'Da de alta a tus precursores desde la pestaña "Precursores" para comenzar a ingresar sus horas.'
                        : 'Prueba ajustando los filtros de búsqueda o de grupo.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedPioneers.map(({ pioneer, yearRecord, calc }, idx) => {
                const monthData = calc.monthly_results[selectedMonth];
                const isBefore = monthData.isBeforeStart;

                const currentHoursVal = draftInputs[pioneer.id]?.hours !== undefined
                  ? draftInputs[pioneer.id]?.hours
                  : (monthData.preaching_hours ? String(monthData.preaching_hours) : '');

                const currentStudiesVal = draftInputs[pioneer.id]?.studies !== undefined
                  ? draftInputs[pioneer.id]?.studies
                  : (monthData.bible_studies ? String(monthData.bible_studies) : '');

                return (
                  <tr
                    key={pioneer.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isBefore ? 'opacity-40 bg-muted/20' : ''
                    }`}
                  >
                    <td className="p-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectPioneer(pioneer.id)}
                          className="hover:underline text-left"
                        >
                          {pioneer.first_name} {pioneer.last_name}
                        </button>
                        {savedBadge[pioneer.id] && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-pulse">
                            <CheckCircle2 className="w-3 h-3" /> Guardado
                          </span>
                        )}
                      </div>
                      {isBefore && (
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          Inicia en {MONTH_NAMES[yearRecord.start_month].short}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-muted-foreground font-medium">
                      Grupo {pioneer.group_number}
                    </td>

                    {/* Preaching Hours Input with Debounce & Keyboard Navigation */}
                    <td className="p-3.5">
                      {currentUser.role === 'secretary' && !isLocked && !isBefore ? (
                        <input
                          id={`input-hours-${idx}`}
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          max="200"
                          value={currentHoursVal}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              const next = document.getElementById(`input-hours-${idx + 1}`);
                              next?.focus();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev = document.getElementById(`input-hours-${idx - 1}`);
                              prev?.focus();
                            }
                          }}
                          onChange={(e) => handleHoursChange(pioneer.id, e.target.value, monthData.bible_studies)}
                          onBlur={() => handleHoursBlur(pioneer.id, monthData.bible_studies)}
                          className="w-20 h-8 text-center text-xs font-bold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      ) : (
                        <span className="font-semibold text-foreground">
                          {isBefore ? '—' : `${monthData.preaching_hours} h`}
                        </span>
                      )}
                    </td>

                    {/* Credit Applied */}
                    <td className="p-3.5">
                      {monthData.credit_total_applied > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{monthData.credit_total_applied} h
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Total Month */}
                    <td className="p-3.5 font-bold text-foreground">
                      {isBefore ? '—' : `${monthData.total} h`}
                    </td>

                    {/* Bible Studies Input with Debounce */}
                    <td className="p-3.5">
                      {currentUser.role === 'secretary' && !isLocked && !isBefore ? (
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={currentStudiesVal}
                          onChange={(e) => handleStudiesChange(pioneer.id, e.target.value, monthData.preaching_hours)}
                          onBlur={() => handleStudiesBlur(pioneer.id, monthData.preaching_hours)}
                          className="w-14 h-8 text-center text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      ) : (
                        <span>{isBefore ? '—' : monthData.bible_studies}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser.role === 'secretary' && !isLocked && !isBefore && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleOpenCredit(
                                pioneer.id,
                                `${pioneer.first_name} ${pioneer.last_name}`
                              )
                            }
                            className="h-7 px-2 text-[11px] gap-1"
                          >
                            <Plus className="w-3 h-3 text-primary" /> Crédito
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectPioneer(pioneer.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          Ficha
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {displayedPioneers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs bg-card rounded-2xl border border-border">
            <p className="font-semibold text-foreground mb-1">
              {activePioneersForYear.length === 0
                ? 'No hay precursores registrados.'
                : 'No se encontraron precursores.'}
            </p>
            <p className="text-muted-foreground">
              {activePioneersForYear.length === 0
                ? 'Agrega precursores en la pestaña "Precursores" para capturar sus informes.'
                : 'Prueba ajustando los filtros.'}
            </p>
          </div>
        ) : (
          displayedPioneers.map(({ pioneer, yearRecord, calc }) => {
            const monthData = calc.monthly_results[selectedMonth];
            const isBefore = monthData.isBeforeStart;

            const currentHoursVal = draftInputs[pioneer.id]?.hours !== undefined
              ? draftInputs[pioneer.id]?.hours
              : (monthData.preaching_hours ? String(monthData.preaching_hours) : '');

            const currentStudiesVal = draftInputs[pioneer.id]?.studies !== undefined
              ? draftInputs[pioneer.id]?.studies
              : (monthData.bible_studies ? String(monthData.bible_studies) : '');

            return (
              <div
                key={pioneer.id}
                className={`p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3 ${
                  isBefore ? 'opacity-50 bg-muted/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-foreground">
                        {pioneer.first_name} {pioneer.last_name}
                      </h4>
                      {savedBadge[pioneer.id] && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Guardado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Grupo {pioneer.group_number} ·{' '}
                      {isBefore ? `Inicia en ${MONTH_NAMES[yearRecord.start_month].short}` : `Total mes: ${monthData.total} h`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentUser.role === 'secretary' && !isLocked && !isBefore && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleOpenCredit(
                            pioneer.id,
                            `${pioneer.first_name} ${pioneer.last_name}`
                          )
                        }
                        className="h-7 px-2 text-xs"
                      >
                        + Crédito
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectPioneer(pioneer.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Ficha
                    </Button>
                  </div>
                </div>

                {!isBefore && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Horas
                      </label>
                      {currentUser.role === 'secretary' && !isLocked ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          max="200"
                          value={currentHoursVal}
                          onChange={(e) => handleHoursChange(pioneer.id, e.target.value, monthData.bible_studies)}
                          onBlur={() => handleHoursBlur(pioneer.id, monthData.bible_studies)}
                          className="w-full h-9 text-center text-sm font-bold rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <div className="h-9 flex items-center justify-center font-bold text-sm bg-secondary/50 rounded-lg">
                          {monthData.preaching_hours} h
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Créditos
                      </label>
                      <div className="h-9 flex items-center justify-center font-bold text-xs bg-secondary/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                        {monthData.credit_total_applied > 0 ? `+${monthData.credit_total_applied} h` : '0 h'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Cursos
                      </label>
                      {currentUser.role === 'secretary' && !isLocked ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          max="50"
                          value={currentStudiesVal}
                          onChange={(e) => handleStudiesChange(pioneer.id, e.target.value, monthData.preaching_hours)}
                          onBlur={() => handleStudiesBlur(pioneer.id, monthData.preaching_hours)}
                          className="w-full h-9 text-center text-sm font-semibold rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <div className="h-9 flex items-center justify-center font-semibold text-sm bg-secondary/50 rounded-lg">
                          {monthData.bible_studies}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {creditPioneerId && (
        <AddCreditModal
          isOpen={Boolean(creditPioneerId)}
          onClose={() => setCreditPioneerId(null)}
          pioneerId={creditPioneerId}
          pioneerName={creditPioneerName}
          initialMonth={selectedMonth}
        />
      )}
    </div>
  );
};
