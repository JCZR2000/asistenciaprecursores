import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Modal } from '../ui/Modal';
import {
  Calendar,
  Lock,
  Unlock,
  PlusCircle,
  History,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { SortableHeader } from '../ui/SortableHeader';

interface ServiceYearsViewProps {
  onSelectPioneer: (pioneerId: string) => void;
}

export const ServiceYearsView: React.FC<ServiceYearsViewProps> = ({ onSelectPioneer }) => {
  const {
    serviceYears,
    currentYearId,
    setCurrentYearId,
    pioneers,
    closeServiceYear,
    reopenServiceYear,
    createNewServiceYear,
    currentUser,
    activePioneersForYear,
    getPioneerHistory,
    availableGroups,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'years' | 'history'>('years');
  const [newYearLabel, setNewYearLabel] = useState<string>('2026-2027');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyGroup, setHistoryGroup] = useState<string>('all');
  const [historySortField, setHistorySortField] = useState<'name' | 'group' | 'current' | 'prev'>('name');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('asc');
  const [yearToConfirm, setYearToConfirm] = useState<{
    id: string;
    action: 'close' | 'reopen';
    label: string;
  } | null>(null);

  const handleStartNewYear = () => {
    if (!newYearLabel.trim()) return;
    createNewServiceYear(newYearLabel.trim());
  };

  const handleConfirmYearAction = () => {
    if (!yearToConfirm) return;
    if (yearToConfirm.action === 'close') {
      closeServiceYear(yearToConfirm.id);
    } else {
      reopenServiceYear(yearToConfirm.id);
    }
    setYearToConfirm(null);
  };

  const displayedHistory = useMemo(() => {
    return activePioneersForYear
      .filter(({ pioneer }) => {
        const fullName = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();
        if (historySearch.trim() && !fullName.includes(historySearch.toLowerCase())) return false;
        if (historyGroup !== 'all' && pioneer.group_number !== Number(historyGroup)) return false;
        return true;
      })
      .map((item) => {
        const history = getPioneerHistory(item.pioneer.id);
        const prevRecord = history.find((h) => h.year.id === '2024-2025');
        return {
          ...item,
          prevRecord,
        };
      })
      .sort((a, b) => {
        let comp = 0;
        if (historySortField === 'name') {
          comp = a.pioneer.first_name.localeCompare(b.pioneer.first_name);
        } else if (historySortField === 'group') {
          comp = a.pioneer.group_number - b.pioneer.group_number;
        } else if (historySortField === 'current') {
          comp = a.calc.total_hours - b.calc.total_hours;
        } else if (historySortField === 'prev') {
          const aPrev = a.prevRecord?.calc.total_hours || 0;
          const bPrev = b.prevRecord?.calc.total_hours || 0;
          comp = aPrev - bPrev;
        }
        return historySortOrder === 'asc' ? comp : -comp;
      });
  }, [activePioneersForYear, historySearch, historyGroup, historySortField, historySortOrder, getPioneerHistory]);

  const handleHistorySort = (field: string) => {
    const f = field as 'name' | 'group' | 'current' | 'prev';
    if (historySortField === f) {
      setHistorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setHistorySortField(f);
      setHistorySortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('years')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'years'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Años de Servicio Registrados
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial de Precursores en el Tiempo
          </button>
        </div>
      </div>

      {/* Tab 1: Service Years list and actions */}
      {activeTab === 'years' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceYears.map((year) => {
              const isCurrent = year.id === currentYearId;

              return (
                <Card
                  key={year.id}
                  className={`transition-all ${
                    isCurrent ? 'ring-2 ring-primary/40 border-primary/50' : ''
                  }`}
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          {year.label}
                        </CardTitle>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                            Seleccionado
                          </span>
                        )}
                        {year.closed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            Cerrado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {year.start_date} al {year.end_date}
                      </span>
                    </div>

                    <Calendar className="w-5 h-5 text-primary" />
                  </CardHeader>

                  <CardContent className="p-4 pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {year.closed
                        ? 'Este año teocrático se encuentra cerrado en modo solo lectura para resguardar los registros históricos.'
                        : 'Año teocrático activo para registro y consulta mensual.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      {!isCurrent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentYearId(year.id)}
                          className="text-xs"
                        >
                          Ver este año
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-primary">
                          Actualmente en pantalla
                        </span>
                      )}

                      {currentUser.role === 'secretary' && (
                        <div>
                          {year.closed ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setYearToConfirm({
                                  id: year.id,
                                  action: 'reopen',
                                  label: year.label,
                                })
                              }
                              className="text-xs gap-1 text-amber-600 hover:text-amber-700"
                            >
                              <Unlock className="w-3.5 h-3.5" /> Reabrir año
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setYearToConfirm({
                                  id: year.id,
                                  action: 'close',
                                  label: year.label,
                                })
                              }
                              className="text-xs gap-1 text-rose-600 hover:text-rose-700"
                            >
                              <Lock className="w-3.5 h-3.5" /> Cerrar año
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Secretary Action: Initialize next service year */}
          {currentUser.role === 'secretary' && (
            <Card className="border-dashed border-2">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-primary" />
                  Iniciar nuevo ciclo / año de servicio
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Al iniciar un nuevo año, los precursores regulares activos se traspasan automáticamente
                  al 1 de septiembre.
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <input
                    type="text"
                    placeholder="Ej. 2026-2027"
                    value={newYearLabel}
                    onChange={(e) => setNewYearLabel(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-card text-xs font-semibold max-w-xs"
                  />
                  <Button size="sm" variant="default" onClick={handleStartNewYear} className="text-xs">
                    Crear y Traspasar Precursores Activos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Pioneer History across service years */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o apellido..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={historyGroup}
                onChange={(e) => setHistoryGroup(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
              >
                <option value="all">Todos los grupos</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    Grupo {g}
                  </option>
                ))}
              </select>

              {(historySearch || historyGroup !== 'all') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryGroup('all');
                  }}
                  className="h-10 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/80">
              <h3 className="font-bold text-sm text-foreground">
                Trayectoria teocrática por precursor
              </h3>
              <p className="text-xs text-muted-foreground">
                Cálculo real de horas y estado frente a la meta a lo largo de los años registrados.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <SortableHeader
                      label="Precursor"
                      field="name"
                      currentSortField={historySortField}
                      currentSortOrder={historySortOrder}
                      onSort={handleHistorySort}
                    />
                    <SortableHeader
                      label="Grupo"
                      field="group"
                      currentSortField={historySortField}
                      currentSortOrder={historySortOrder}
                      onSort={handleHistorySort}
                    />
                    <SortableHeader
                      label={`Año Actual (${currentYearId})`}
                      field="current"
                      currentSortField={historySortField}
                      currentSortOrder={historySortOrder}
                      onSort={handleHistorySort}
                    />
                    <SortableHeader
                      label="Año Anterior (2024-2025)"
                      field="prev"
                      currentSortField={historySortField}
                      currentSortOrder={historySortOrder}
                      onSort={handleHistorySort}
                    />
                    <th className="p-3 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                        No se encontraron precursores con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    displayedHistory.map(({ pioneer, yearRecord, calc, prevRecord }) => {

                  return (
                    <tr key={pioneer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        {pioneer.first_name} {pioneer.last_name}
                      </td>
                      <td className="p-3 text-muted-foreground">Grupo {pioneer.group_number}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{calc.total_hours} h</span>
                          <Badge variant={calc.status}>
                            {calc.status === 'en_camino'
                              ? 'En camino'
                              : calc.status === 'cumplido'
                              ? 'Cumplido'
                              : calc.status === 'minimo'
                              ? 'Mínimo'
                              : calc.status === 'salud_delicada'
                              ? 'Salud delicada'
                              : 'En riesgo'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        {prevRecord ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {prevRecord.calc.total_hours} h
                            </span>
                            <Badge variant={prevRecord.calc.status}>
                              {prevRecord.calc.status === 'cumplido'
                                ? 'Cumplió meta'
                                : prevRecord.calc.status === 'minimo'
                                ? 'Alcanzó mínimo'
                                : prevRecord.calc.status === 'salud_delicada'
                                ? 'Salud delicada'
                                : 'No alcanzado'}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">— (Inicio reciente)</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectPioneer(pioneer.id)}
                          className="text-xs h-7"
                        >
                          Abrir
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>

          {/* Mobile Cards for History */}
          <div className="md:hidden divide-y divide-border/60">
            {displayedHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No se encontraron precursores con los filtros seleccionados.
              </div>
            ) : (
              displayedHistory.map(({ pioneer, yearRecord, calc, prevRecord }) => {
                return (
                  <div key={pioneer.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {pioneer.first_name} {pioneer.last_name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Grupo {pioneer.group_number}
                        </span>
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

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-xl bg-secondary/50 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase block">
                          Actual ({currentYearId})
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold">{calc.total_hours} h</span>
                          <Badge variant={calc.status} className="text-[10px] px-1.5">
                            {calc.status === 'en_camino' ? 'En camino' : calc.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-secondary/50 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase block">
                          2024-2025
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {prevRecord ? (
                            <>
                              <span className="font-bold">{prevRecord.calc.total_hours} h</span>
                              <Badge variant={prevRecord.calc.status} className="text-[10px] px-1.5">
                                {prevRecord.calc.status}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      )}

      {/* Confirmation Modal for Closing/Reopening Year */}
      {yearToConfirm && (
        <Modal
          isOpen={Boolean(yearToConfirm)}
          onClose={() => setYearToConfirm(null)}
          title={
            <div className="flex items-center gap-2 text-foreground font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>
                {yearToConfirm.action === 'close'
                  ? `¿Cerrar año de servicio ${yearToConfirm.label}?`
                  : `¿Reabrir año de servicio ${yearToConfirm.label}?`}
              </span>
            </div>
          }
          description={
            yearToConfirm.action === 'close'
              ? 'Al cerrar este año, quedará en modo de solo lectura para resguardar los registros históricos. No se podrán modificar informes, altas ni créditos a menos que se vuelva a abrir.'
              : 'Al reabrir el año de servicio, los secretarios podrán realizar modificaciones y correcciones en los informes y créditos registrados.'
          }
          maxWidth="md"
        >
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setYearToConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant={yearToConfirm.action === 'close' ? 'destructive' : 'default'}
              size="sm"
              onClick={handleConfirmYearAction}
            >
              {yearToConfirm.action === 'close' ? 'Confirmar Cierre' : 'Confirmar Reapertura'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
