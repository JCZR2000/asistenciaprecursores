import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  getFriendlyAuthErrorMessage,
} from '../../services/auth';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  AlertCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { enableDemoMode, showToast } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [congregationName, setCongregationName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`¡Bienvenido, ${user.displayName || user.email}!`);
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (tab === 'register' && password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (tab === 'login') {
        const user = await loginWithEmail(email.trim(), password);
        if (user) {
          showToast(`¡Bienvenido, ${user.displayName || user.email}!`);
        }
      } else {
        const user = await registerWithEmail(email.trim(), password);
        if (user) {
          showToast(`¡Cuenta creada con éxito! Bienvenido hermano.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ingresa tu correo electrónico arriba para enviarte el enlace de restablecimiento.');
      return;
    }
    setErrorMsg(null);
    setIsResetting(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg(`Se ha enviado un enlace para restablecer tu contraseña a ${email.trim()}.`);
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err.code || ''));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-background via-secondary/20 to-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-foreground">
              Precursores Regulares
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Seguimiento y Registro Teocrático
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card/80 border border-border/80 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Acceso Seguro y Privado</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-card border border-border/80 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-md">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header info */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">
              {tab === 'login' ? 'Iniciar Sesión' : 'Registro de Congregación'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {tab === 'login'
                ? 'Ingresa a tu cuenta de secretario o superintendente para gestionar los informes.'
                : 'Registra tu cuenta para crear y administrar la gestión de precursores de tu congregación.'}
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-2xl border border-border/80 bg-background hover:bg-secondary text-foreground font-semibold text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 shadow-xs mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider relative">
              o con correo
            </span>
          </div>

          {/* Tabs: Iniciar Sesión / Registro */}
          <div className="flex bg-secondary/80 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'register'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Nombre del Secretario / Responsable
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Ej. Carlos Morales"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                    Nombre de tu Congregación
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Ej. Congregación La Esperanza"
                      value={congregationName}
                      onChange={(e) => setCongregationName(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="secretario@ejemplo.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase">
                  Contraseña
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="w-full h-11 text-xs font-bold gap-2 mt-3 shadow-md"
            >
              {isLoading ? (
                <span>Conectando...</span>
              ) : tab === 'login' ? (
                <>
                  <span>Iniciar Sesión</span> <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Registrar Cuenta</span> <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Offline / Demo option */}
          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={enableDemoMode}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline transition-colors"
            >
              Continuar en modo de demostración local (sin cuenta)
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <footer className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-muted-foreground font-medium">
        <p>Precursores Regulares · Registro y Control Teocrático de Servicio del Año</p>
      </footer>
    </div>
  );
};
