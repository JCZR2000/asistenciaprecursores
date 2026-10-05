import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { MONTH_NAMES, ServiceMonthNumber } from '../../domain/types';
import { Button } from '../ui/Button';
import {
  Calendar,
  Moon,
  Sun,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  ChevronDown,
  X,
  SlidersHorizontal,
  UserPlus,
  Cloud,
  LogIn,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Search,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewPioneer: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewPioneer, onOpenSearch }) => {
  const {
    congregation,
    currentYearId,
    setCurrentYearId,
    serviceYears,
    refMonth,
    setRefMonth,
    currentUser,
    toggleRole,
    theme,
    toggleTheme,
    isMonthLocked,
    firebaseUser,
    openAuthModal,
    handleLogout,
    syncWithCloud,
    isCloudConnected,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const currentYearObj = serviceYears.find((y) => y.id === currentYearId);
  const isLocked = isMonthLocked(refMonth);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const ok = await syncWithCloud();
      if (ok) {
        setSyncStatus('Sincronizado');
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('Error al sincronizar');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-card/90 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors no-print">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Congregation title & logo */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-bold tracking-tight text-foreground truncate m-0 p-0 max-w-[150px] xs:max-w-[190px] sm:max-w-none">
                {congregation.name}
              </h1>
              {currentYearObj?.closed && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                  Cerrado
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block m-0">
              Gestión de Precursores Regulares
            </p>
          </div>
        </div>

        {/* Desktop Controls (Hidden on mobile) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {/* Quick Search Button (Ctrl+K) */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Buscar precursor (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Buscar...</span>
              <kbd className="hidden md:inline-block px-1 py-0.5 text-[9px] font-mono bg-background border border-border rounded">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Year selector */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
              currentYearObj?.closed
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-secondary/80 border-border text-foreground'
            }`}
          >
            {currentYearObj?.closed ? (
              <span title="Año cerrado (Solo lectura)" className="flex items-center">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              </span>
            ) : (
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <select
              value={currentYearId}
              onChange={(e) => setCurrentYearId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {serviceYears.map((y) => (
                <option key={y.id} value={y.id} className="bg-card text-foreground">
                  {y.label} {y.closed ? '🔒' : ''}
                </option>
              ))}
            </select>
            {currentYearObj?.closed && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                Cerrado
              </span>
            )}
          </div>

          {/* Reference month selector */}
          <div className="flex items-center gap-1.5 bg-secondary/80 px-2.5 py-1 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">Mes Ref:</span>
            <select
              value={refMonth}
              onChange={(e) => setRefMonth(Number(e.target.value) as ServiceMonthNumber)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => (
                <option key={m} value={m} className="bg-card text-foreground">
                  {MONTH_NAMES[m].short} ({MONTH_NAMES[m].name})
                </option>
              ))}
            </select>
            {isLocked && !currentYearObj?.closed && (
              <span title="Mes enviado y bloqueado por el secretario">
                <Lock className="w-3 h-3 text-rose-500" />
              </span>
            )}
          </div>

          {/* Role switcher toggle */}
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              currentUser.role === 'secretary'
                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
            title="Alternar entre Secretario y Lector"
          >
            {currentUser.role === 'secretary' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Secretario</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Lector</span>
              </>
            )}
          </button>

          {/* Cloud Auth / Account status button */}
          {firebaseUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5" />
              <span className="max-w-[110px] truncate" title={firebaseUser.email || ''}>
                {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sincronizar con la nube"
                className="hover:text-emerald-900 dark:hover:text-emerald-200 p-0.5"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 ml-0.5"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Iniciar sesión con Google o correo"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acceder</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Add Pioneer button */}
          {currentUser.role === 'secretary' && !currentYearObj?.closed && (
            <Button size="sm" variant="default" onClick={onOpenNewPioneer} className="text-xs h-8">
              + Alta Precursor
            </Button>
          )}
        </div>

        {/* Mobile Compact Controls */}
        <div className="flex sm:hidden items-center gap-1.5">
          {/* Mobile Quick Settings Pill */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
              currentYearObj?.closed
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-secondary text-foreground border-border'
            }`}
          >
            {currentYearObj?.closed && (
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{currentYearId.replace(/^20(\d{2})-20(\d{2})$/, '$1-$2')}</span>
            <span>·</span>
            <span>{MONTH_NAMES[refMonth].short}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
          </button>

          {/* Mobile Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-1.5 rounded-lg border border-border bg-secondary/60 text-primary"
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Cloud / Login status */}
          <button
            onClick={firebaseUser ? () => setIsMobileMenuOpen(true) : openAuthModal}
            className={`p-1.5 rounded-lg border ${
              firebaseUser
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-secondary/60 text-muted-foreground border-border'
            }`}
            title={firebaseUser ? 'Cuenta conectada' : 'Iniciar sesión'}
          >
            {firebaseUser ? <Cloud className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-border bg-secondary/60 text-foreground"
            title="Tema"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* Mobile Add Pioneer Icon Button */}
          {currentUser.role === 'secretary' && !currentYearObj?.closed && (
            <button
              onClick={onOpenNewPioneer}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-xs"
              title="Alta Precursor"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer/Modal for Settings & Filters rendered via Portal to escape header containing block */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-card border-t border-border rounded-t-3xl p-5 space-y-4 z-10 max-h-[85vh] overflow-y-auto overscroll-contain shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Opciones de Visualización
              </h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Year selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Año de Servicio
              </label>
              <select
                value={currentYearId}
                onChange={(e) => setCurrentYearId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
              >
                {serviceYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Mes de Referencia
              </label>
              <select
                value={refMonth}
                onChange={(e) => setRefMonth(Number(e.target.value) as ServiceMonthNumber)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
              >
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as ServiceMonthNumber[]).map((m) => (
                  <option key={m} value={m}>
                    Mes {m}: {MONTH_NAMES[m].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role switch */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Rol Activo
              </label>
              <button
                onClick={() => {
                  toggleRole();
                }}
                className="w-full h-10 flex items-center justify-between px-3 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  {currentUser.role === 'secretary' ? (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                  )}
                  {currentUser.role === 'secretary' ? 'Secretario (Edición completa)' : 'Lector (Solo lectura)'}
                </span>
                <span className="text-[11px] text-primary font-bold underline">Cambiar</span>
              </button>
            </div>

            {/* Account & Cloud in Mobile */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Cuenta y Nube
              </label>
              {firebaseUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                        {firebaseUser.email}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Salir
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : syncStatus || 'Sincronizar con la nube ahora'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal();
                  }}
                >
                  <LogIn className="w-3.5 h-3.5 text-primary" />
                  <span>Iniciar Sesión (Google o Correo)</span>
                </Button>
              )}
            </div>

            {/* Action button */}
            <div className="pt-2">
              <Button
                variant="default"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Aplicar y Cerrar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
