import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SortableHeader } from '../ui/SortableHeader';
import {
  Printer,
  Search,
  Filter,
  X,
  ArrowUpDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { MONTH_NAMES } from '../../domain/types';

interface ReviewsViewProps {
  onSelectPioneer: (pioneerId: string) => void;
}

type SortField = 'name' | 'group' | 'average' | 'total' | 'diff' | 'status';

export const ReviewsView: React.FC<ReviewsViewProps> = ({ onSelectPioneer }) => {
  const {
    activePioneersForYear,
    currentYearId,
    congregation,
    currentUser,
    reviews,
    saveMarchReview,
    saveYearEndReview,
    refMonth,
    availableGroups,
  } = useApp();

  const [reviewTab, setReviewTab] = useState<'march' | 'year_end'>('march');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'done' | 'pending'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(f);
      setSortOrder('asc');
    }
  };

  // Base items per tab
  const baseMarchPioneers = useMemo(() => {
    return activePioneersForYear.filter((item) => {
      if (item.yearRecord.pioneer_type === 'salud_delicada') return false;
      return item.calc.average_monthly_hours < (congregation.config.monthly_goal || 50);
    });
  }, [activePioneersForYear, congregation.config.monthly_goal]);

  const baseYearEndPioneers = useMemo(() => {
    return activePioneersForYear.filter((item) => {
      if (item.yearRecord.pioneer_type === 'salud_delicada') return false;
      if (item.calc.minimum === null) return false;
      return item.calc.total_hours < item.calc.minimum;
    });
  }, [activePioneersForYear]);

  // Filter & Sort March
  const displayedMarchPioneers = useMemo(() => {
    return baseMarchPioneers
      .filter(({ pioneer }) => {
        const fullName = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();
        if (searchQuery.trim() && !fullName.includes(searchQuery.toLowerCase())) return false;
        if (selectedGroup !== 'all' && pioneer.group_number !== Number(selectedGroup)) return false;

        const rev = reviews.find((r) => r.pioneerId === pioneer.id && r.yearId === currentYearId);
        const isDone = Boolean(rev?.march_meeting_date);
        if (selectedStatus === 'done' && !isDone) return false;
        if (selectedStatus === 'pending' && isDone) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.pioneer.first_name.localeCompare(b.pioneer.first_name);
        } else if (sortField === 'group') {
          comp = a.pioneer.group_number - b.pioneer.group_number;
        } else if (sortField === 'average') {
          comp = a.calc.average_monthly_hours - b.calc.average_monthly_hours;
        } else if (sortField === 'total') {
          comp = a.calc.total_hours - b.calc.total_hours;
        } else if (sortField === 'status') {
          const aRev = reviews.find((r) => r.pioneerId === a.pioneer.id && r.yearId === currentYearId);
          const bRev = reviews.find((r) => r.pioneerId === b.pioneer.id && r.yearId === currentYearId);
          comp = Number(Boolean(aRev?.march_meeting_date)) - Number(Boolean(bRev?.march_meeting_date));
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [baseMarchPioneers, searchQuery, selectedGroup, selectedStatus, sortField, sortOrder, reviews, currentYearId]);

  // Filter & Sort Year-End
  const displayedYearEndPioneers = useMemo(() => {
    return baseYearEndPioneers
      .filter(({ pioneer, calc }) => {
        const fullName = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();
        if (searchQuery.trim() && !fullName.includes(searchQuery.toLowerCase())) return false;
        if (selectedGroup !== 'all' && pioneer.group_number !== Number(selectedGroup)) return false;

        const rev = reviews.find((r) => r.pioneerId === pioneer.id && r.yearId === currentYearId);
        const isDone = Boolean(rev?.year_end_review_date);
        if (selectedStatus === 'done' && !isDone) return false;
        if (selectedStatus === 'pending' && isDone) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.pioneer.first_name.localeCompare(b.pioneer.first_name);
        } else if (sortField === 'group') {
          comp = a.pioneer.group_number - b.pioneer.group_number;
        } else if (sortField === 'total') {
          comp = a.calc.total_hours - b.calc.total_hours;
        } else if (sortField === 'diff') {
          const aDiff = (a.calc.minimum || 560) - a.calc.total_hours;
          const bDiff = (b.calc.minimum || 560) - b.calc.total_hours;
          comp = aDiff - bDiff;
        } else if (sortField === 'status') {
          const aRev = reviews.find((r) => r.pioneerId === a.pioneer.id && r.yearId === currentYearId);
          const bRev = reviews.find((r) => r.pioneerId === b.pioneer.id && r.yearId === currentYearId);
          comp = Number(Boolean(aRev?.year_end_review_date)) - Number(Boolean(bRev?.year_end_review_date));
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [baseYearEndPioneers, searchQuery, selectedGroup, selectedStatus, sortField, sortOrder, reviews, currentYearId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top bar with tabs and Print Button */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        {/* Review selector tabs */}
        <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-xl">
          <button
            onClick={() => setReviewTab('march')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              reviewTab === 'march'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Revisión de Marzo ({baseMarchPioneers.length})
          </button>
          <button
            onClick={() => setReviewTab('year_end')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              reviewTab === 'year_end'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Revisión de Fin de Año ({baseYearEndPioneers.length})
          </button>
        </div>

        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs h-9">
          <Printer className="w-3.5 h-3.5 text-primary" /> Imprimir informe / PDF
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
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

        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Group filter */}
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

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full md:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todas las revisiones</option>
            <option value="done">✓ Realizada</option>
            <option value="pending">⏳ Pendiente</option>
          </select>

          {/* Mobile sort select */}
          <div className="col-span-2 md:hidden flex items-center gap-1.5 w-full">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="flex-1 h-10 px-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="name">Ordenar: Nombre</option>
              <option value="group">Ordenar: Grupo</option>
              {reviewTab === 'march' && <option value="average">Ordenar: Promedio</option>}
              <option value="total">Ordenar: Total</option>
              {reviewTab === 'year_end' && <option value="diff">Ordenar: Diferencia</option>}
              <option value="status">Ordenar: Estado</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-border bg-background text-foreground"
              title="Cambiar dirección de orden"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {(searchQuery || selectedGroup !== 'all' || selectedStatus !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedGroup('all');
                setSelectedStatus('all');
              }}
              className="h-10 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs print-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/80 gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {reviewTab === 'march'
                ? 'Revisión Periódica de Marzo (Actividad de Precursores Regulares)'
                : 'Evaluación de Fin de Año de Servicio (Comité de Servicio)'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {congregation.name} · Año teocrático: <strong>{currentYearId}</strong> · Mes de corte:{' '}
              <strong>{MONTH_NAMES[refMonth].name}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-muted-foreground block">
              Generado:{' '}
              {new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Instructions guideline box */}
        <div className="mt-4 p-3.5 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground leading-relaxed">
          {reviewTab === 'march' ? (
            <div>
              <strong>Indicación teocrática (Marzo):</strong> El secretario y el superintendente de
              servicio revisan a los precursores que no informan habitualmente un promedio de{' '}
              <strong>50 h mensuales</strong>. El superintendente de servicio y el de grupo se
              reúnen con ellos para entender sus circunstancias, ofrecerles ayuda amorosa y evaluar
              si es realista que alcancen el requisito anual.
            </div>
          ) : (
            <div>
              <strong>Indicación teocrática (Fin de año):</strong> Quien alcanza{' '}
              <strong>560 h o más</strong> (o su mínimo proporcional prorrateado) puede continuar
              como precursor regular. Para quienes no alcanzaron el mínimo, el Comité de Servicio de
              la Congregación evalúa la situación con equilibrio y amor cristiano.
            </div>
          )}
        </div>

        {/* Table list */}
        <div className="mt-5 overflow-x-auto">
          {reviewTab === 'march' ? (
            baseMarchPioneers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-xs">
                ¡Excelente! Todos los precursores regulares tienen un promedio mensual igual o
                superior a 50 horas.
              </p>
            ) : displayedMarchPioneers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-xs">
                No se encontraron precursores con los filtros seleccionados.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table for March */}
                <table className="hidden md:table w-full text-left text-xs">
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
                        label="Promedio Mensual"
                        field="average"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Total Acumulado"
                        field="total"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <th className="p-3">Ritmo Necesario</th>
                      <th className="p-3">Sugerencia de Ayuda</th>
                      <SortableHeader
                        label="Reunión de Apoyo"
                        field="status"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                        align="right"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedMarchPioneers.map(({ pioneer, yearRecord, calc }) => {
                      const review = reviews.find(
                        (r) => r.pioneerId === pioneer.id && r.yearId === currentYearId
                      );
                      const meetingDone = Boolean(review?.march_meeting_date);

                      return (
                        <tr key={pioneer.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">
                            <button
                              onClick={() => onSelectPioneer(pioneer.id)}
                              className="hover:underline text-left"
                            >
                              {pioneer.first_name} {pioneer.last_name}
                            </button>
                          </td>
                          <td className="p-3 text-muted-foreground">Grupo {pioneer.group_number}</td>
                          <td className="p-3">
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {Math.round(calc.average_monthly_hours)} h/mes
                            </span>
                            <span className="text-[10px] text-muted-foreground block">(Meta: 50)</span>
                          </td>
                          <td className="p-3 font-semibold text-foreground">
                            {calc.total_hours} h / {calc.goal} h
                          </td>
                          <td className="p-3 font-semibold text-amber-600">
                            {calc.pace.needed_pace !== null
                              ? `${Math.round(calc.pace.needed_pace)} h/mes`
                              : '—'}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs text-[11px]">
                            {calc.pace.suggestion}
                          </td>
                          <td className="p-3 text-right">
                            {currentUser.role === 'secretary' ? (
                              <div className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={meetingDone}
                                  onChange={(e) =>
                                    saveMarchReview(
                                      pioneer.id,
                                      e.target.checked ? new Date().toISOString().slice(0, 10) : null
                                    )
                                  }
                                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                />
                                <span className="text-[11px] font-medium">
                                  {meetingDone ? review?.march_meeting_date : 'Pendiente'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-medium">
                                {meetingDone ? `Realizada (${review?.march_meeting_date})` : 'Pendiente'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Cards for March Reviews */}
                <div className="md:hidden space-y-3">
                  {displayedMarchPioneers.map(({ pioneer, yearRecord, calc }) => {
                    const review = reviews.find(
                      (r) => r.pioneerId === pioneer.id && r.yearId === currentYearId
                    );
                    const meetingDone = Boolean(review?.march_meeting_date);

                    return (
                      <div
                        key={pioneer.id}
                        className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">
                              {pioneer.first_name} {pioneer.last_name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Grupo {pioneer.group_number} · Promedio:{' '}
                              <strong className="text-rose-600 dark:text-rose-400">
                                {Math.round(calc.average_monthly_hours)} h/mes
                              </strong>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectPioneer(pioneer.id)}
                            className="h-7 px-2 text-xs"
                          >
                            Ficha
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {calc.pace.suggestion}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                          <span className="text-muted-foreground">
                            Acumulado: {calc.total_hours} h (Meta: {calc.goal} h)
                          </span>
                          {currentUser.role === 'secretary' ? (
                            <label className="flex items-center gap-1.5 font-semibold text-primary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={meetingDone}
                                onChange={(e) =>
                                  saveMarchReview(
                                    pioneer.id,
                                    e.target.checked ? new Date().toISOString().slice(0, 10) : null
                                  )
                                }
                                className="rounded text-primary focus:ring-primary w-4 h-4"
                              />
                              <span>{meetingDone ? 'Reunión hecha' : 'Marcar hecha'}</span>
                            </label>
                          ) : (
                            <span className="font-semibold text-foreground">
                              {meetingDone ? '✓ Reunión realizada' : 'Pendiente'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : baseYearEndPioneers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-xs">
              ¡Maravilloso! Todos los precursores regulares alcanzaron el requisito mínimo de horas
              para continuar el servicio.
            </p>
          ) : displayedYearEndPioneers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-xs">
              No se encontraron precursores con los filtros seleccionados.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table for Year End */}
              <table className="hidden md:table w-full text-left text-xs">
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
                      label="Total Anual"
                      field="total"
                      currentSortField={sortField}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="p-3">Mínimo Requerido</th>
                    <SortableHeader
                      label="Diferencia"
                      field="diff"
                      currentSortField={sortField}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="p-3">Tiempo de Precursor</th>
                    <SortableHeader
                      label="Evaluación del Comité"
                      field="status"
                      currentSortField={sortField}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      align="right"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedYearEndPioneers.map(({ pioneer, yearRecord, calc }) => {
                    const review = reviews.find(
                      (r) => r.pioneerId === pioneer.id && r.yearId === currentYearId
                    );
                    const isReviewed = Boolean(review?.year_end_review_date);
                    const diff = (calc.minimum || 560) - calc.total_hours;

                    return (
                      <tr key={pioneer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          <button
                            onClick={() => onSelectPioneer(pioneer.id)}
                            className="hover:underline text-left"
                          >
                            {pioneer.first_name} {pioneer.last_name}
                          </button>
                        </td>
                        <td className="p-3 text-muted-foreground">Grupo {pioneer.group_number}</td>
                        <td className="p-3 font-bold text-foreground">{calc.total_hours} h</td>
                        <td className="p-3 font-semibold text-primary">
                          {Math.round(calc.minimum || 560)} h
                        </td>
                        <td className="p-3 font-bold text-rose-600">-{Math.round(diff)} h</td>
                        <td className="p-3 text-muted-foreground text-[11px]">
                          {pioneer.pioneer_since || 'No registrado'}
                        </td>
                        <td className="p-3 text-right">
                          {currentUser.role === 'secretary' ? (
                            <div className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isReviewed}
                                onChange={(e) =>
                                  saveYearEndReview(
                                    pioneer.id,
                                    e.target.checked ? new Date().toISOString().slice(0, 10) : null
                                  )
                                }
                                className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[11px] font-medium">
                                {isReviewed ? review?.year_end_review_date : 'Pendiente'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium">
                              {isReviewed ? `Evaluado (${review?.year_end_review_date})` : 'Pendiente'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Cards for Year End */}
              <div className="md:hidden space-y-3">
                {displayedYearEndPioneers.map(({ pioneer, yearRecord, calc }) => {
                  const review = reviews.find(
                    (r) => r.pioneerId === pioneer.id && r.yearId === currentYearId
                  );
                  const isReviewed = Boolean(review?.year_end_review_date);
                  const diff = (calc.minimum || 560) - calc.total_hours;

                  return (
                    <div
                      key={pioneer.id}
                      className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {pioneer.first_name} {pioneer.last_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Grupo {pioneer.group_number} · Total:{' '}
                            <strong className="text-foreground">{calc.total_hours} h</strong> (Mín:{' '}
                            {Math.round(calc.minimum || 560)} h)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectPioneer(pioneer.id)}
                          className="h-7 px-2 text-xs"
                        >
                          Ficha
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                        <span className="font-bold text-rose-600">Faltaron {Math.round(diff)} h</span>
                        {currentUser.role === 'secretary' ? (
                          <label className="flex items-center gap-1.5 font-semibold text-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isReviewed}
                              onChange={(e) =>
                                saveYearEndReview(
                                  pioneer.id,
                                  e.target.checked ? new Date().toISOString().slice(0, 10) : null
                                )
                              }
                              className="rounded text-primary focus:ring-primary w-4 h-4"
                            />
                            <span>{isReviewed ? 'Evaluado' : 'Marcar evaluado'}</span>
                          </label>
                        ) : (
                          <span className="font-semibold text-foreground">
                            {isReviewed ? '✓ Evaluado' : 'Pendiente'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
