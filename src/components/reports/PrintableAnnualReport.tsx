import React from 'react';
import { useApp } from '../../context/AppContext';
import { MONTH_NAMES } from '../../domain/types';
import { Button } from '../ui/Button';
import { Printer, Download, X } from 'lucide-react';

interface PrintableAnnualReportProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const PrintableAnnualReport: React.FC<PrintableAnnualReportProps> = ({ onClose, isModal = false }) => {
  const {
    congregation,
    currentYearId,
    refMonth,
    activePioneersForYear,
    currentUser,
  } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const totalHoursCong = activePioneersForYear.reduce((acc, curr) => acc + curr.calc.total_hours, 0);
  const totalPreachingCong = activePioneersForYear.reduce((acc, curr) => acc + curr.calc.total_preaching, 0);
  const totalCreditsCong = activePioneersForYear.reduce((acc, curr) => acc + curr.calc.total_credits_applied, 0);
  const regularCount = activePioneersForYear.filter((p) => p.yearRecord.pioneer_type === 'regular').length;
  const healthCount = activePioneersForYear.filter((p) => p.yearRecord.pioneer_type === 'salud_delicada').length;
  const averageCong = activePioneersForYear.length > 0 ? Math.round((totalHoursCong / activePioneersForYear.length) * 10) / 10 : 0;

  return (
    <div className={isModal ? 'bg-background p-6 rounded-2xl max-w-5xl mx-auto shadow-2xl border border-border' : ''}>
      {/* On-screen control bar (hidden in print) */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border no-print">
        <div>
          <h3 className="font-bold text-base text-foreground">Vista Previa para Impresión / Guardar en PDF</h3>
          <p className="text-xs text-muted-foreground">
            Formato oficial optimizado para hojas A4 / Carta en orientación horizontal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" /> Imprimir o Guardar PDF
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div className="printable-document bg-white text-neutral-900 p-8 rounded-lg shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Header */}
        <div className="border-b-2 border-neutral-800 pb-4 mb-6 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase block">
              Testigos de Jehová · Registro de Servicio del Campo
            </span>
            <h1 className="text-xl font-black text-neutral-900 mt-1 uppercase tracking-tight">
              Informe Anual de Precursores Regulares
            </h1>
            <p className="text-sm font-semibold text-neutral-700 mt-0.5">
              Congregación: <span className="font-bold text-neutral-900">{congregation.name}</span>
            </p>
          </div>

          <div className="text-right text-xs text-neutral-600 space-y-1">
            <p>
              Año de servicio: <strong className="text-neutral-900">{currentYearId}</strong>
            </p>
            <p>
              Mes de corte: <strong className="text-neutral-900">{MONTH_NAMES[refMonth].name}</strong>
            </p>
            <p>
              Fecha: <strong className="text-neutral-900">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
            </p>
          </div>
        </div>

        {/* Pioneers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse border border-neutral-300">
            <thead>
              <tr className="bg-neutral-100 text-neutral-800 font-bold uppercase text-[9px] tracking-wider border-b border-neutral-300">
                <th className="p-2 border-r border-neutral-300 text-center w-12">Grupo</th>
                <th className="p-2 border-r border-neutral-300">Precursor (Apellidos y Nombres)</th>
                <th className="p-2 border-r border-neutral-300">Tipo</th>
                <th className="p-2 border-r border-neutral-300 text-center">Inicio</th>
                <th className="p-2 border-r border-neutral-300 text-right">Predicación</th>
                <th className="p-2 border-r border-neutral-300 text-right">Créditos</th>
                <th className="p-2 border-r border-neutral-300 text-right font-black">Total</th>
                <th className="p-2 border-r border-neutral-300 text-right">Meta</th>
                <th className="p-2 border-r border-neutral-300 text-right">Promedio</th>
                <th className="p-2 border-r border-neutral-300 text-center">Estado</th>
                <th className="p-2 text-center">Ritmo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {activePioneersForYear.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-neutral-500 italic">
                    No hay precursores regulares registrados en este año de servicio.
                  </td>
                </tr>
              ) : (
                activePioneersForYear.map(({ pioneer, yearRecord, calc }, idx) => {
                  return (
                    <tr key={pioneer.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/70'}>
                      <td className="p-2 border-r border-neutral-300 text-center font-bold">
                        {pioneer.group_number}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-semibold text-neutral-900">
                        {pioneer.last_name}, {pioneer.first_name}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-neutral-700">
                        {yearRecord.pioneer_type === 'salud_delicada' ? 'Salud delicada' : 'Regular'}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-center text-neutral-600">
                        {MONTH_NAMES[yearRecord.start_month].short}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right font-mono">
                        {calc.total_preaching} h
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right font-mono">
                        {calc.total_credits_applied > 0 ? `+${calc.total_credits_applied} h` : '—'}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right font-bold font-mono text-neutral-900">
                        {calc.total_hours} h
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right font-mono text-neutral-600">
                        {calc.goal ? `${calc.goal} h` : '—'}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-right font-mono">
                        {Math.round(calc.average_monthly_hours * 10) / 10} h
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-center font-semibold text-[10px]">
                        {calc.status === 'cumplido'
                          ? 'Cumplido'
                          : calc.status === 'en_camino'
                          ? 'En camino'
                          : calc.status === 'minimo'
                          ? 'Mínimo'
                          : calc.status === 'salud_delicada'
                          ? 'Salud del.'
                          : calc.status === 'atrasado'
                          ? 'Atrasado'
                          : 'Riesgo'}
                      </td>
                      <td className="p-2 text-center text-[10px] font-semibold">
                        {calc.pace.status === 'va_bien'
                          ? '🟢 Va bien'
                          : calc.pace.status === 'atrasado'
                          ? '🟡 Atrasado'
                          : calc.pace.status === 'ayuda'
                          ? '🔴 Necesita ayuda'
                          : calc.pace.status === 'salud_delicada'
                          ? '🟣 Salud del.'
                          : '⚪ Sin informe'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals Footer */}
            <tfoot>
              <tr className="bg-neutral-200 font-bold text-neutral-900 border-t-2 border-neutral-400">
                <td colSpan={4} className="p-2 border-r border-neutral-300 text-right uppercase text-[10px]">
                  Totales de la Congregación ({activePioneersForYear.length} precursores):
                </td>
                <td className="p-2 border-r border-neutral-300 text-right font-mono font-bold">
                  {totalPreachingCong} h
                </td>
                <td className="p-2 border-r border-neutral-300 text-right font-mono font-bold">
                  {totalCreditsCong > 0 ? `+${totalCreditsCong} h` : '0 h'}
                </td>
                <td className="p-2 border-r border-neutral-300 text-right font-mono font-black text-neutral-950">
                  {totalHoursCong} h
                </td>
                <td colSpan={4} className="p-2 text-neutral-700 text-[10px]">
                  Promedio congregacional: <strong>{averageCong} h/mes por precursor</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statistical summary & Signatures box */}
        <div className="mt-8 pt-4 border-t border-neutral-300 grid grid-cols-2 gap-8 text-xs text-neutral-700">
          <div>
            <h4 className="font-bold text-[11px] text-neutral-900 uppercase tracking-wide mb-2">
              Resumen Estadístico del Año
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li>• Total de precursores regulares activos: <strong>{regularCount}</strong></li>
              <li>• Precursores bajo arreglo de salud delicada: <strong>{healthCount}</strong></li>
              <li>• Total horas acumuladas en predicación: <strong>{totalPreachingCong} h</strong></li>
              <li>• Total créditos aplicados (asignaciones / escuela): <strong>{totalCreditsCong} h</strong></li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="text-center">
              <div className="border-b border-neutral-400 pb-1 mb-1 font-semibold text-neutral-900">
                {currentUser.displayName || 'Hermano Secretario'}
              </div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Secretario de la Congregación
              </span>
            </div>
            <div className="text-center">
              <div className="border-b border-neutral-400 pb-1 mb-1 font-semibold text-neutral-900">
                &nbsp;
              </div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Coordinador del Cuerpo de Ancianos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
