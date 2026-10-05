import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  getFriendlyAuthErrorMessage,
} from '../../services/auth';
import { isFirebaseConfigured } from '../../services/firebase';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, displayName?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onSuccess(user.email || '', user.displayName || undefined);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    try {
      let user;
      if (tab === 'login') {
        user = await loginWithEmail(email.trim(), password);
      } else {
        user = await registerWithEmail(email.trim(), password);
      }
      if (user) {
        onSuccess(user.email || '', user.displayName || undefined);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>Acceso al Dashboard Teocrático</span>
        </div>
      }
      description="Inicia sesión con tu cuenta autorizada para acceder a la gestión de precursores"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-11 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 shadow-xs"
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
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider relative">
            o con correo
          </span>
        </div>

        {/* Tab switcher: Iniciar sesión / Registrarse */}
        <div className="flex bg-secondary/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'register'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
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
                placeholder="ejemplo@jwpub.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="default"
            className="w-full h-10 text-xs font-bold gap-2 mt-2"
          >
            {isLoading ? (
              <span>Conectando...</span>
            ) : tab === 'login' ? (
              <>
                <span>Iniciar Sesión</span> <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Crear Cuenta</span> <Sparkles className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* Guest / Offline Demo Mode Option */}
        <div className="pt-2 border-t border-border/60 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground underline font-medium"
          >
            Continuar en modo de demostración local
          </button>
        </div>
      </div>
    </Modal>
  );
};
