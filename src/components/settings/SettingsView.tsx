import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Modal } from '../ui/Modal';
import {
  Settings,
  Users,
  Shield,
  History,
  Download,
  Upload,
  Save,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  FileJson,
  Trash2,
  AlertTriangle,
  FileText,
  Search,
  LogOut,
  Cloud,
  RefreshCw,
  Sparkles,
  Building2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { validateGroupCountReduction } from '../../domain/groups';
import { exportExcelWorkbook, exportBackupJSON } from '../../services/exporters';
import { PrintableAnnualReport } from '../reports/PrintableAnnualReport';

export const SettingsView: React.FC = () => {
  const {
    congregation,
    updateCongregationConfig,
    updateCongregation,
    currentUser,
    auditLog,
    activePioneersForYear,
    currentYearId,
    pioneers,
    pioneerYears,
    reports,
    credits,
    reviews,
    lockedMonths,
    serviceYears,
    resetCongregationData,
    openExcelImportModal,
    showToast,
    firebaseUser,
    isDemoMode,
    handleLogout,
    openAuthModal,
    openCongregationSetup,
    loadSampleMockData,
    clearAllCongregationData,
    syncWithCloud,
  } = useApp();

  const [settingsTab, setSettingsTab] = useState<'config' | 'users' | 'audit' | 'export'>('config');

  // Form local state for congregation configuration
  const [configForm, setConfigForm] = useState(congregation.config);
  const [groupsCount, setGroupsCount] = useState<number>(congregation.groups_count || 5);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Invite user state
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'secretary'>('viewer');
  const [invites, setInvites] = useState<{ email: string; role: 'viewer' | 'secretary'; date: string }[]>([
    { email: 'coordinador@congregacion.org', role: 'viewer', date: '2025-09-02' },
    { email: 'super.servicio@congregacion.org', role: 'viewer', date: '2025-09-02' },
  ]);

  // Reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const filteredAuditLog = useMemo(() => {
    return auditLog.filter((log) => {
      const q = auditSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.user_email.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);
      const matchesAction = auditActionFilter === 'all' || log.action.toLowerCase() === auditActionFilter.toLowerCase();
      return matchesSearch && matchesAction;
    });
  }, [auditLog, auditSearch, auditActionFilter]);

  const handleSaveConfig = () => {
    const assigned = pioneers.filter((p) => p.active).map((p) => p.group_number);
    const validation = validateGroupCountReduction(groupsCount, assigned);
    if (!validation.valid) {
      showToast(
        `No se puede reducir a ${groupsCount} grupos: hay ${validation.conflictingCount} precursor(es) en grupo(s) hasta el ${validation.maxAssigned}. Reasígnalos primero.`
      );
      return;
    }
    updateCongregation({
      groups_count: Math.max(1, groupsCount),
      config: configForm,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    setInvites((prev) => [
      ...prev,
      {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setInviteEmail('');
    showToast(`Invitación enviada como ${inviteRole === 'secretary' ? 'Secretario' : 'Lector'}.`);
  };

  const handleRevokeInvite = (email: string) => {
    setInvites((prev) => prev.filter((i) => i.email !== email));
    showToast(`Acceso revocado para ${email}.`);
  };

  // Export current year data to Excel using multi-sheet exporter
  const handleExportExcel = () => {
    exportExcelWorkbook({
      congregation,
      currentYearId,
      activePioneersForYear,
      allPioneers: pioneers,
      allPioneerYears: pioneerYears,
      reports,
      credits,
      reviews,
      serviceYears,
      lockedMonths,
      auditLog,
    });
    showToast('Archivo Excel descargado con éxito.');
  };

  // Export full congregation JSON backup with safe Blob URL
  const handleExportBackupJSON = () => {
    exportBackupJSON({
      congregation,
      currentYearId,
      activePioneersForYear,
      allPioneers: pioneers,
      allPioneerYears: pioneerYears,
      reports,
      credits,
      reviews,
      serviceYears,
      lockedMonths,
      auditLog,
    });
    showToast('Copia de seguridad descargada en formato JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Top tabs */}
      <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center no-print">
        <button
          onClick={() => setSettingsTab('config')}
          className={`h-11 md:h-9 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            settingsTab === 'config'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground bg-secondary/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Reglas y Metas</span>
        </button>
        <button
          onClick={() => setSettingsTab('users')}
          className={`h-11 md:h-9 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            settingsTab === 'users'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground bg-secondary/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Usuarios y Accesos</span>
        </button>
        <button
          onClick={() => setSettingsTab('export')}
          className={`h-11 md:h-9 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            settingsTab === 'export'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground bg-secondary/50'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Exportar y Copia</span>
        </button>
        {currentUser.role === 'secretary' && (
          <button
            onClick={() => setSettingsTab('audit')}
            className={`h-11 md:h-9 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              settingsTab === 'audit'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-secondary/50'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Bitácora de Cambios</span>
          </button>
        )}
      </div>

      {/* Tab 1: Config */}
      {settingsTab === 'config' && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-foreground">
              Configuración de Metas Teocráticas y Reglas de Negocio
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Valores oficiales según las pautas teocráticas vigentes.
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Número de grupos de la congregación
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  disabled={currentUser.role !== 'secretary'}
                  value={groupsCount}
                  onChange={(e) => setGroupsCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Crea los grupos 1 a {groupsCount} para asignar precursores
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Meta mensual base
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.monthly_goal}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, monthly_goal: Number(e.target.value) }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Por defecto: 50 h</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Meta año completo
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.full_year_goal}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, full_year_goal: Number(e.target.value) }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Por defecto: 600 h</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Mínimo anual para continuar
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.full_year_minimum}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, full_year_minimum: Number(e.target.value) }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Por defecto: 560 h</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Tope de créditos por mes (asignaciones)
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.monthly_cap}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, monthly_cap: Number(e.target.value) }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Por defecto: 55 h</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Modo del mes de referencia
                </label>
                <select
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.reference_month_mode}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      reference_month_mode: e.target.value as any,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs font-semibold"
                >
                  <option value="last_report">Último informe registrado en la congregación</option>
                  <option value="calendar">Mes calendario actual</option>
                  <option value="manual">Manual (elegir en el encabezado)</option>
                </select>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Define cómo se calcula el mes de análisis
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                  Umbral de ritmo poco realista
                </label>
                <input
                  type="number"
                  disabled={currentUser.role !== 'secretary'}
                  value={configForm.pace_unrealistic_hours}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      pace_unrealistic_hours: Number(e.target.value),
                    }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Alerta si necesita más de {configForm.pace_unrealistic_hours} h/mes
                </span>
              </div>
            </div>

            {/* Checkbox for require hours for credit */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={currentUser.role !== 'secretary'}
                  checked={configForm.require_hours_for_credit}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, require_hours_for_credit: e.target.checked }))
                  }
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-foreground">
                  Exigir al menos 1 h de predicación para aplicar crédito de asignaciones (regla del Excel y pautas teocráticas)
                </span>
              </label>
            </div>

            {currentUser.role === 'secretary' && (
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  {isSaved && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Configuración guardada
                    </span>
                  )}
                </div>
                <Button size="sm" variant="default" onClick={handleSaveConfig} className="gap-1.5 text-xs">
                  <Save className="w-3.5 h-3.5" /> Guardar Cambios
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Users & Access */}
      {settingsTab === 'users' && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-foreground">
              Cuenta y Control de Accesos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Gestiona tu sesión de secretario y los permisos para el Comité de Servicio y Ancianos.
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-5">
            {/* Current Logged In Account Card */}
            <div className="p-4 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'SE'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground">
                      {currentUser.displayName || 'Hermano Secretario'}
                    </h4>
                    {isDemoMode ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        Modo Demostración Local
                      </span>
                    ) : firebaseUser ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Conectado a Firebase
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {currentUser.email} · Congregación: {congregation.name || congregation.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDemoMode ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openAuthModal}
                    className="text-xs gap-1.5"
                  >
                    Iniciar Sesión Oficial
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                    className="text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                  </Button>
                )}
              </div>
            </div>
            {currentUser.role === 'secretary' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Correo electrónico del hermano (ej. hermano@jwpub.org)"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-xs font-medium"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-10 px-3 rounded-lg border border-border bg-card text-xs font-semibold"
                >
                  <option value="viewer">Rol: Lector (Comité)</option>
                  <option value="secretary">Rol: Secretario / Co-editor</option>
                </select>
                <Button size="sm" variant="default" onClick={handleSendInvite} className="text-xs">
                  Enviar Invitación
                </Button>
              </div>
            )}

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Correo</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Fecha de invitación</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{currentUser.email} (Tú)</td>
                    <td className="p-3"><span className="text-primary font-bold">Secretario Titular</span></td>
                    <td className="p-3 text-muted-foreground">—</td>
                    <td className="p-3 text-right text-muted-foreground">Activo</td>
                  </tr>
                  {invites.map((inv) => (
                    <tr key={inv.email}>
                      <td className="p-3 font-medium text-foreground">{inv.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.role === 'secretary'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {inv.role === 'secretary' ? 'Secretario' : 'Lector'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{inv.date}</td>
                      <td className="p-3 text-right">
                        {currentUser.role === 'secretary' && (
                          <button
                            onClick={() => handleRevokeInvite(inv.email)}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Export & Backup */}
      {settingsTab === 'export' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Exportación y Respaldo Oficial
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Descarga los registros en formatos abiertos (Excel, JSON o PDF para impresión oficial).
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              {/* Option 1: Excel */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar año actual ({currentYearId})
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Genera una hoja de cálculo con todos los precursores, totales, metas, meses y créditos aplicados.
                  </p>
                </div>
                <Button size="sm" variant="success" onClick={handleExportExcel} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Descargar Excel
                </Button>
              </div>

              {/* Option 2: Full JSON backup */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-primary" /> Respaldo Completo de la Congregación (JSON)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Exporta todos los años de servicio, precursores, informes, créditos, notas y auditoría en un único archivo.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleExportBackupJSON} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Descargar JSON
                </Button>
              </div>

              {/* Option 3: Print / PDF */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <Printer className="w-4 h-4 text-sky-600" /> Imprimir Resumen Anual Teocrático (PDF)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Prepara el informe oficial formateado con tabla de precursores, totales y firmas para imprimir o guardar en PDF.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsPrintModalOpen(true)} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Ver e Imprimir PDF
                </Button>
              </div>

              {/* Option 4: Excel Import Trigger */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" /> Importar desde Hoja de Cálculo (.xlsx / .csv)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Carga un archivo con nombres e informes mensuales utilizando el asistente de importación.
                  </p>
                </div>
                <Button size="sm" variant="default" onClick={openExcelImportModal} className="gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> Asistente de Importación
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone / Maintenance: Data Reset & Actions */}
          {currentUser.role === 'secretary' && (
            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Asistente y Gestión de Datos
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Gestiona la configuración inicial, sincronización con la nube o restablecimiento.
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex flex-wrap gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCongregationSetup}
                  className="text-xs gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Reconfigurar Congregación
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncWithCloud}
                  className="text-xs gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-600" /> Sincronizar con la Nube
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSampleMockData}
                  className="text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cargar Datos de Demostración
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar Todo (Empezar Limpio)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {settingsTab === 'audit' && currentUser.role === 'secretary' && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-foreground">
              Bitácora de Auditoría Teocrática
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Registro inmutable de acciones realizadas en el panel (solo visible para el secretario).
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, acción o detalle..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-card text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-card text-xs font-semibold"
                >
                  <option value="all">Todas las acciones</option>
                  <option value="pioneer_created">PIONEER_CREATED</option>
                  <option value="report_updated">REPORT_UPDATED</option>
                  <option value="credit_added">CREDIT_ADDED</option>
                  <option value="review_saved">REVIEW_SAVED</option>
                  <option value="data_reset">DATA_RESET</option>
                </select>
                {(auditSearch || auditActionFilter !== 'all') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAuditSearch('');
                      setAuditActionFilter('all');
                    }}
                    className="text-xs h-9"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAuditLog.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">
                        No se encontraron registros de auditoría con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3 font-medium text-foreground">{log.user_email}</td>
                        <td className="p-3">
                          <span className="font-semibold uppercase text-[10px] text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-foreground">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-muted-foreground text-right">
              Mostrando {filteredAuditLog.length} de {auditLog.length} eventos registrados
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => {
            setIsResetModalOpen(false);
            setResetConfirmationText('');
          }}
          title={
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmar restablecimiento completo</span>
            </div>
          }
          description="Esta acción borrará todos los precursores, informes, créditos y revisiones registrados, dejando la congregación completamente limpia para comenzar de cero."
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Para confirmar, escribe exactamente la palabra <strong className="text-foreground">BORRAR</strong> en el campo inferior:
            </p>
            <input
              type="text"
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              placeholder="Escribe BORRAR para confirmar"
              className="w-full h-10 px-3 rounded-xl border border-rose-500/40 bg-card text-xs font-bold text-center"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmationText('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={resetConfirmationText !== 'BORRAR'}
                onClick={() => {
                  clearAllCongregationData();
                  setIsResetModalOpen(false);
                  setResetConfirmationText('');
                }}
              >
                Sí, vaciar datos
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex items-center justify-center">
          <PrintableAnnualReport isModal onClose={() => setIsPrintModalOpen(false)} />
        </div>
      )}
    </div>
  );
};
