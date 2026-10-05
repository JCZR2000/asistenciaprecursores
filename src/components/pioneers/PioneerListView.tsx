import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { MONTH_NAMES, PioneerType, ServiceMonthNumber, StatusCategory } from '../../domain/types';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ShieldCheck,
  HeartHandshake,
  UserPlus,
  Users,
} from 'lucide-react';

interface PioneerListViewProps {
  onSelectPioneer: (pioneerId: string) => void;
  onOpenNewPioneer: () => void;
}

export const PioneerListView: React.FC<PioneerListViewProps> = ({
  onSelectPioneer,
  onOpenNewPioneer,
}) => {
  const { activePioneersForYear, congregation, refMonth, currentUser, availableGroups, pioneers } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPace, setSelectedPace] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hours' | 'group' | 'pace'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredPioneers = useMemo(() => {
    return activePioneersForYear.filter((item) => {
      const { pioneer, yearRecord, calc } = item;
      const fullName = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();

      // Search query
      if (searchQuery.trim() && !fullName.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Group filter
      if (selectedGroup !== 'all' && pioneer.group_number !== Number(selectedGroup)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && calc.status !== selectedStatus) {
        return false;
      }

      // Pace filter
      if (selectedPace !== 'all' && calc.pace.status !== selectedPace) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && yearRecord.pioneer_type !== selectedType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.pioneer.first_name.localeCompare(b.pioneer.first_name);
      } else if (sortBy === 'hours') {
        comparison = a.calc.total_hours - b.calc.total_hours;
      } else if (sortBy === 'group') {
        comparison = a.pioneer.group_number - b.pioneer.group_number;
      } else if (sortBy === 'pace') {
        comparison = a.calc.pace.pace_pct - b.calc.pace.pace_pct;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [activePioneersForYear, searchQuery, selectedGroup, selectedStatus, selectedPace, selectedType, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'hours' | 'group' | 'pace') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action and search bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar precursor por nombre o apellido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Group filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos los grupos</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>

          {/* Pace meter filter */}
          <select
            value={selectedPace}
            onChange={(e) => setSelectedPace(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos los ritmos</option>
            <option value="va_bien">🟢 Va bien</option>
            <option value="atrasado">🟡 Atrasado</option>
            <option value="ayuda">🔴 Necesita ayuda</option>
            <option value="sin_informe">⚪ Sin informe</option>
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos los tipos</option>
            <option value="regular">Regular</option>
            <option value="salud_delicada">Salud delicada</option>
          </select>

          {currentUser.role === 'secretary' && (
            <Button
              size="sm"
              variant="default"
              onClick={onOpenNewPioneer}
              className="w-full sm:w-auto text-xs h-10 gap-1.5 whitespace-nowrap justify-center"
            >
              <UserPlus className="w-4 h-4" /> Alta Precursor
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Precursor</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('group')}>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Grupo</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5">Tipo</th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('hours')}>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Progreso Anual</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('pace')}>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>Ritmo ({MONTH_NAMES[refMonth].short})</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5 text-right font-bold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPioneers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  <div className="max-w-sm mx-auto space-y-3">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-foreground">
                      {pioneers.length === 0
                        ? 'Aún no hay precursores registrados en esta congregación.'
                        : 'No se encontraron precursores con los filtros seleccionados.'}
                    </p>
                    {pioneers.length === 0 ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={onOpenNewPioneer}
                        className="gap-2 text-xs font-bold"
                      >
                        <UserPlus className="w-4 h-4" /> Dar de alta primer precursor
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Prueba ajustando el texto de búsqueda o los filtros aplicados.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredPioneers.map(({ pioneer, yearRecord, calc }) => {
                const isDelicate = yearRecord.pioneer_type === 'salud_delicada';
                const pct = calc.goal ? Math.min(100, Math.round((calc.total_hours / calc.goal) * 100)) : null;

                // Expected progress percentage to reference month
                const expectedPct = calc.goal && calc.pace.expected_hours
                  ? Math.min(100, Math.round((calc.pace.expected_hours / calc.goal) * 100))
                  : null;

                return (
                  <tr
                    key={pioneer.id}
                    onClick={() => onSelectPioneer(pioneer.id)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    {/* Pioneer Name */}
                    <td className="p-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{pioneer.first_name} {pioneer.last_name}</span>
                        {yearRecord.start_month > 1 && (
                          <span className="text-[10px] font-normal text-muted-foreground">
                            (Desde {MONTH_NAMES[yearRecord.start_month].short})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Group */}
                    <td className="p-3.5 text-muted-foreground font-medium">
                      Grupo {pioneer.group_number}
                    </td>

                    {/* Pioneer Type */}
                    <td className="p-3.5">
                      {isDelicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                          <HeartHandshake className="w-3.5 h-3.5" /> Salud delicada
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Regular</span>
                      )}
                    </td>

                    {/* Progress Bar & Hours */}
                    <td className="p-3.5 w-64">
                      {isDelicate ? (
                        <div className="text-foreground font-semibold">
                          {calc.total_hours} h <span className="text-muted-foreground text-[11px] font-normal">(sin meta)</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                            <span className="text-foreground font-bold">{calc.total_hours} h</span>
                            <span className="text-muted-foreground">/ {calc.goal} h ({pct}%)</span>
                          </div>
                          {/* Progress bar with expected tick */}
                          <div className="relative w-full h-2 rounded-full bg-secondary overflow-visible">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                            {/* Expected marker tick */}
                            {expectedPct !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10 -mt-0.5 h-3"
                                style={{ left: `${expectedPct}%` }}
                                title={`Esperado a la fecha: ${calc.pace.expected_hours} h (${expectedPct}%)`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Pace Badge */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={calc.pace.status}>
                          {calc.pace.status === 'va_bien' && 'Va bien'}
                          {calc.pace.status === 'atrasado' && 'Un poco atrasado'}
                          {calc.pace.status === 'ayuda' && 'Necesita ayuda'}
                          {calc.pace.status === 'sin_informe' && 'Sin informe'}
                          {calc.pace.status === 'salud_delicada' && 'Salud delicada'}
                          {calc.pace.status === 'no_iniciado' && 'No iniciado'}
                        </Badge>
                        {calc.pace.difference_hours !== 0 && !isDelicate && calc.pace.status !== 'sin_informe' && (
                          <span className={`text-[11px] font-semibold ${calc.pace.difference_hours > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {calc.pace.difference_hours > 0 ? `+${Math.round(calc.pace.difference_hours)}` : Math.round(calc.pace.difference_hours)} h
                          </span>
                        )}
                      </div>
                      {calc.pace.projected_year_end_hours !== null && !isDelicate && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Proy. fin de año: <span className="font-semibold text-foreground">~{calc.pace.projected_year_end_hours} h</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right">
                      <button className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Ver detalle <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Shown on small screens) */}
      <div className="md:hidden space-y-3">
        {filteredPioneers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-border/80 bg-card rounded-2xl">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-xs font-semibold text-foreground mb-3">
              {pioneers.length === 0
                ? 'Aún no hay precursores registrados en esta congregación.'
                : 'No se encontraron precursores con los filtros seleccionados.'}
            </p>
            {pioneers.length === 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={onOpenNewPioneer}
                className="gap-2 text-xs font-bold"
              >
                <UserPlus className="w-4 h-4" /> Dar de alta primer precursor
              </Button>
            )}
          </div>
        ) : (
          filteredPioneers.map(({ pioneer, yearRecord, calc }) => {
            const isDelicate = yearRecord.pioneer_type === 'salud_delicada';
            const pct = calc.goal ? Math.min(100, Math.round((calc.total_hours / calc.goal) * 100)) : null;

            return (
              <Card
                key={pioneer.id}
                onClick={() => onSelectPioneer(pioneer.id)}
                className="cursor-pointer active:scale-[0.99] transition-transform"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {pioneer.first_name} {pioneer.last_name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Grupo {pioneer.group_number} · {isDelicate ? 'Salud delicada' : `Inicio: ${MONTH_NAMES[yearRecord.start_month].short}`}
                      </p>
                    </div>
                    <Badge variant={calc.pace.status}>
                      {calc.pace.status === 'va_bien' && 'Va bien'}
                      {calc.pace.status === 'atrasado' && 'Atrasado'}
                      {calc.pace.status === 'ayuda' && 'Ayuda'}
                      {calc.pace.status === 'sin_informe' && 'Sin inf.'}
                      {calc.pace.status === 'salud_delicada' && 'Salud del.'}
                    </Badge>
                  </div>

                  {/* Hours and Progress */}
                  {!isDelicate ? (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span>{calc.total_hours} h acumuladas</span>
                        <span className="text-primary">{pct}% de {calc.goal} h</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      {calc.total_hours} h acumuladas (arreglo de salud delicada)
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <div>
                      <span>
                        {calc.remaining_hours !== null ? `Faltan ${calc.remaining_hours} h` : 'Sin meta anual'}
                      </span>
                      {calc.pace.projected_year_end_hours !== null && !isDelicate && (
                        <div className="text-[10px] text-foreground font-semibold">
                          Proy. fin de año: ~{calc.pace.projected_year_end_hours} h
                        </div>
                      )}
                    </div>
                    <span className="text-primary font-bold flex items-center gap-0.5">
                      Abrir ficha <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
