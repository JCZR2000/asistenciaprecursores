import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MONTH_NAMES } from '../../domain/types';
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  Layers,
  FileQuestion,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onSelectPioneer: (pioneerId: string) => void;
  onNavigateToReviews: () => void;
  onNavigateToMonthly?: () => void;
  onOpenNewPioneer?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectPioneer,
  onNavigateToReviews,
  onNavigateToMonthly,
  onOpenNewPioneer,
}) => {
  const {
    activePioneersForYear,
    refMonth,
    currentYearId,
    availableGroups,
    openExcelImportModal,
    loadSampleMockData,
  } = useApp();

  const totalPioneers = activePioneersForYear.length;
  const regularPioneers = activePioneersForYear.filter((p) => p.yearRecord.pioneer_type === 'regular');
  const delicatePioneers = activePioneersForYear.filter((p) => p.yearRecord.pioneer_type === 'salud_delicada');

  const countCumplidos = regularPioneers.filter((p) => p.calc.status === 'cumplido').length;
  const countMinimo = regularPioneers.filter((p) => p.calc.status === 'minimo').length;
  const countEnCamino = regularPioneers.filter((p) => p.calc.status === 'en_camino').length;
  const countCerca = regularPioneers.filter((p) => p.calc.status === 'cerca').length;
  const countAtrasadosStatus = regularPioneers.filter((p) => p.calc.status === 'atrasado').length;
  const countRiesgo = regularPioneers.filter((p) => p.calc.status === 'riesgo').length;

  const countVaBien = regularPioneers.filter((p) => p.calc.pace.status === 'va_bien').length;
  const countAtrasados = regularPioneers.filter((p) => p.calc.pace.status === 'atrasado').length;
  const countAyuda = regularPioneers.filter((p) => p.calc.pace.status === 'ayuda').length;
  const countSinInforme = regularPioneers.filter((p) => p.calc.pace.status === 'sin_informe').length;

  // Pioneers with missing report in current reference month
  const pioneersMissingThisMonth = activePioneersForYear.filter((p) => {
    const res = p.calc.monthly_results[refMonth];
    return res && !res.isBeforeStart && !res.hasReport;
  });

  // Group missing counts
  const missingByGroup = pioneersMissingThisMonth.reduce<Record<number, number>>((acc, p) => {
    const grp = p.pioneer.group_number;
    acc[grp] = (acc[grp] || 0) + 1;
    return acc;
  }, {});

  // Group performance matrix data
  const groupStats = availableGroups.map((grpNum) => {
    const pioneersInGroup = activePioneersForYear.filter((p) => p.pioneer.group_number === grpNum);
    const totalGroupHours = pioneersInGroup.reduce((sum, p) => sum + p.calc.total_hours, 0);
    const avgHours = pioneersInGroup.length > 0 ? Math.round(totalGroupHours / pioneersInGroup.length) : 0;
    const missingCount = missingByGroup[grpNum] || 0;
    const vaBienCount = pioneersInGroup.filter((p) => p.calc.pace.status === 'va_bien').length;
    const necesitaAyudaCount = pioneersInGroup.filter((p) => p.calc.pace.status === 'ayuda' || p.calc.pace.status === 'atrasado').length;

    return {
      groupNumber: grpNum,
      count: pioneersInGroup.length,
      totalHours: totalGroupHours,
      avgHours,
      missingCount,
      vaBienCount,
      necesitaAyudaCount,
    };
  });

  // Pioneers needing help list
  const pioneersNeedingHelp = regularPioneers
    .filter((p) => p.calc.pace.status === 'ayuda' || p.calc.pace.status === 'atrasado')
    .sort((a, b) => a.calc.pace.pace_pct - b.calc.pace.pace_pct);

  // Pioneers closest to goal list
  const pioneersClosest = regularPioneers
    .filter((p) => p.calc.status !== 'cumplido' && p.calc.remaining_hours !== null)
    .sort((a, b) => (a.calc.remaining_hours || 0) - (b.calc.remaining_hours || 0))
    .slice(0, 4);

  // Data for status pie chart
  const statusPieData = [
    { name: 'Cumplido', value: countCumplidos, color: '#10b981' },
    { name: 'En camino', value: countEnCamino, color: '#10b981' },
    { name: 'Mínimo', value: countMinimo, color: '#3b82f6' },
    { name: 'Cerca', value: countCerca, color: '#f59e0b' },
    { name: 'Atrasado', value: countAtrasadosStatus, color: '#f59e0b' },
    { name: 'En riesgo', value: countRiesgo, color: '#ef4444' },
    { name: 'Salud delicada', value: delicatePioneers.length, color: '#a855f7' },
  ].filter((d) => d.value > 0);

  // Monthly congregational total activity
  const monthlyCongregationData = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((m) => {
    let monthTotal = 0;
    activePioneersForYear.forEach((p) => {
      const res = p.calc.monthly_results[m];
      if (res && !res.isBeforeStart) {
        monthTotal += res.total;
      }
    });
    return {
      monthName: MONTH_NAMES[m].short,
      horas: monthTotal,
      isRef: m === refMonth,
    };
  });

  return (
    <div className="space-y-6">
      {/* Alert banner for March Review if in February / March / April */}
      {refMonth >= 6 && refMonth <= 8 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Período de Revisión de Marzo (Instrucciones para ancianos)
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300">
                El secretario y el superintendente de servicio revisan la actividad de los precursores que promedian menos de 50 h para coordinar el apoyo con los superintendentes de grupo.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToReviews}
            className="text-xs font-semibold whitespace-nowrap bg-card border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
          >
            Ver lista de revisión →
          </Button>
        </div>
      )}

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total precursores */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Precursores
            </span>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-foreground">{totalPioneers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {regularPioneers.length} regulares · {delicatePioneers.length} salud delicada
            </p>
          </CardContent>
        </Card>

        {/* Va bien / Cumplidos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Al día / Va bien
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {countVaBien}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ritmo ≥ 100% de la meta esperada
            </p>
          </CardContent>
        </Card>

        {/* Un poco atrasados */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Atrasados
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-amber-500">
              {countAtrasados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ritmo entre 80% y 99%
            </p>
          </CardContent>
        </Card>

        {/* Necesitan ayuda */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Necesitan Ayuda
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {countAyuda}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {countSinInforme > 0 ? `+ ${countSinInforme} sin informe del mes` : 'Requieren apoyo amoroso'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Banner if 0 pioneers */}
      {totalPioneers === 0 && (
        <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8 text-center rounded-3xl shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                ¡Tu congregación está lista para comenzar!
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Aún no has registrado precursores para el año de servicio {currentYearId}.
                Puedes dar de alta a tus precursores uno por uno o importar tus datos existentes desde una hoja de cálculo Excel.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onOpenNewPioneer && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onOpenNewPioneer}
                  className="gap-2 text-xs font-bold shadow-xs"
                >
                  <Sparkles className="w-4 h-4" /> Dar de alta primer precursor
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={openExcelImportModal}
                className="gap-2 text-xs font-semibold bg-card"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Importar desde Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSampleMockData}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cargar datos de demostración
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Activity Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Actividad Total de la Congregación por Mes
            </CardTitle>
            <span className="text-xs text-muted-foreground">Año {currentYearId}</span>
          </CardHeader>
          <CardContent className="p-4 pt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCongregationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthName" interval={0} stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} horas`, 'Total horas']}
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar
                  dataKey="horas"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center justify-center">
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center text-[10px] mt-1">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Section: "Necesitan Ayuda" & "Más cerca de la meta" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Necesitan Ayuda Card */}
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" /> Precursores que necesitan apoyo
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Mes ref: {MONTH_NAMES[refMonth].name}
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {pioneersNeedingHelp.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                ¡Excelente! Todos los precursores mantienen un ritmo óptimo a la fecha.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pioneersNeedingHelp.map((item) => {
                  const { pioneer, calc } = item;
                  return (
                    <div
                      key={pioneer.id}
                      onClick={() => onSelectPioneer(pioneer.id)}
                      className="p-3 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span>{pioneer.first_name} {pioneer.last_name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (Grupo {pioneer.group_number})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Acumulado: <strong className="text-foreground">{calc.total_hours} h</strong> / {calc.goal} h
                          {calc.pace.difference_hours < 0 && (
                            <span className="text-rose-600 ml-1">
                              ({Math.round(calc.pace.difference_hours)} h atraso)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={calc.pace.status}>
                          {calc.pace.status === 'ayuda' ? 'Necesita ayuda' : 'Un poco atrasado'}
                        </Badge>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Más cerca de la meta Card */}
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" /> Más cerca de alcanzar la meta anual
            </CardTitle>
            <span className="text-xs text-muted-foreground">Metas activas</span>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {pioneersClosest.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Todos los precursores han completado su meta o están en proceso inicial.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pioneersClosest.map((item) => {
                  const { pioneer, calc } = item;
                  const pctProgress = calc.goal ? Math.min(100, Math.round((calc.total_hours / calc.goal) * 100)) : 0;

                  return (
                    <div
                      key={pioneer.id}
                      onClick={() => onSelectPioneer(pioneer.id)}
                      className="p-3 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex-1 mr-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                          <span>{pioneer.first_name} {pioneer.last_name}</span>
                          <span className="text-primary font-bold">{pctProgress}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pctProgress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Lleva {calc.total_hours} h · Faltan <strong>{calc.remaining_hours} h</strong> para la meta ({calc.goal} h)
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Precursores sin informe este mes Card */}
      {pioneersMissingThisMonth.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <FileQuestion className="w-5 h-5 shrink-0" />
              <div>
                <CardTitle className="text-sm font-bold">
                  Precursores sin informe registrado en {MONTH_NAMES[refMonth].name} ({pioneersMissingThisMonth.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Precursores activos que aún no tienen horas registradas para este mes de servicio.
                </p>
              </div>
            </div>
            {onNavigateToMonthly && (
              <Button
                size="sm"
                variant="outline"
                onClick={onNavigateToMonthly}
                className="text-xs bg-card border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 shrink-0"
              >
                Ir a Captura Mensual →
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {/* Group summary pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {availableGroups
                .filter((grp) => (missingByGroup[grp] || 0) > 0)
                .map((grp) => (
                  <span
                    key={grp}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-xs font-semibold text-amber-800 dark:text-amber-300"
                  >
                    <span>Grupo {grp}:</span>
                    <strong className="text-amber-900 dark:text-amber-100">{missingByGroup[grp]} pendiente(s)</strong>
                  </span>
                ))}
            </div>

            {/* List of missing pioneers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {pioneersMissingThisMonth.map(({ pioneer }) => (
                <div
                  key={pioneer.id}
                  onClick={() => onSelectPioneer(pioneer.id)}
                  className="p-2.5 rounded-xl border border-border bg-card/80 hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-foreground truncate block">
                      {pioneer.first_name} {pioneer.last_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Grupo {pioneer.group_number}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendimiento por Grupo Card */}
      <Card>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Comparativa y Rendimiento por Grupos ({availableGroups.length} Grupos)
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">Mes ref: {MONTH_NAMES[refMonth].short}</span>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2.5 font-bold">Grupo</th>
                  <th className="p-2.5 font-bold">Precursores</th>
                  <th className="p-2.5 font-bold">Total Horas Acum.</th>
                  <th className="p-2.5 font-bold">Promedio / Precursor</th>
                  <th className="p-2.5 font-bold">Al Día (Va bien)</th>
                  <th className="p-2.5 font-bold">Atrasados / Ayuda</th>
                  <th className="p-2.5 font-bold">Sin Informe ({MONTH_NAMES[refMonth].short})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupStats.map((stat) => (
                  <tr key={stat.groupNumber} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 font-bold text-foreground">
                      Grupo {stat.groupNumber}
                    </td>
                    <td className="p-2.5 font-medium text-foreground">
                      {stat.count}
                    </td>
                    <td className="p-2.5 font-bold text-primary">
                      {stat.totalHours} h
                    </td>
                    <td className="p-2.5 text-foreground">
                      {stat.avgHours} h
                    </td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {stat.vaBienCount}
                    </td>
                    <td className="p-2.5 text-amber-600 dark:text-amber-400 font-semibold">
                      {stat.necesitaAyudaCount}
                    </td>
                    <td className="p-2.5">
                      {stat.missingCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                          {stat.missingCount} pendiente(s)
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Al día ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
