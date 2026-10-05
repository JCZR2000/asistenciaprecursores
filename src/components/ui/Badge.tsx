import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, HeartHandshake, ShieldCheck } from 'lucide-react';
import { PaceMeterStatus, StatusCategory } from '../../domain/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | StatusCategory
    | PaceMeterStatus
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'danger';
  showIcon?: boolean;
}

export function getStatusBadgeInfo(status: StatusCategory, isYearClosedOrAug = false): {
  label: string;
  variant: StatusCategory;
} {
  switch (status) {
    case 'cumplido':
      return { label: 'Cumplió la meta', variant: 'cumplido' };
    case 'minimo':
      return { label: isYearClosedOrAug ? 'Alcanzó el mínimo' : 'Mínimo alcanzado', variant: 'minimo' };
    case 'en_camino':
      return { label: 'En camino a cumplir', variant: 'en_camino' };
    case 'cerca':
      return { label: isYearClosedOrAug ? 'Cerca del mínimo' : 'Cerca de la meta', variant: 'cerca' };
    case 'atrasado':
      return { label: 'Un poco atrasado', variant: 'atrasado' };
    case 'riesgo':
      return { label: isYearClosedOrAug ? 'No alcanzó el mínimo' : 'En riesgo', variant: 'riesgo' };
    case 'salud_delicada':
      return { label: 'Salud delicada', variant: 'salud_delicada' };
  }
}

export function getPaceBadgeInfo(paceStatus: PaceMeterStatus): {
  label: string;
  variant: PaceMeterStatus;
} {
  switch (paceStatus) {
    case 'va_bien':
      return { label: 'Va bien', variant: 'va_bien' };
    case 'atrasado':
      return { label: 'Un poco atrasado', variant: 'atrasado' };
    case 'ayuda':
      return { label: 'Necesita ayuda', variant: 'ayuda' };
    case 'sin_informe':
      return { label: 'Sin informe', variant: 'sin_informe' };
    case 'no_iniciado':
      return { label: 'Aún no inicia', variant: 'no_iniciado' };
    case 'salud_delicada':
      return { label: 'Salud delicada', variant: 'salud_delicada' };
  }
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  showIcon = true,
  children,
  ...props
}) => {
  const getIcon = () => {
    if (!showIcon) return null;
    switch (variant) {
      case 'cumplido':
      case 'en_camino':
      case 'va_bien':
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />;
      case 'minimo':
        return <ShieldCheck className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />;
      case 'cerca':
      case 'atrasado':
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />;
      case 'riesgo':
      case 'ayuda':
      case 'danger':
        return <AlertCircle className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />;
      case 'salud_delicada':
        return <HeartHandshake className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />;
      case 'sin_informe':
      case 'no_iniciado':
        return <Clock className="w-3.5 h-3.5 mr-1 stroke-[2]" />;
      default:
        return null;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'cumplido':
      case 'en_camino':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'minimo':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20';
      case 'cerca':
      case 'atrasado':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'riesgo':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      case 'salud_delicada':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';

      // Pace meter statuses
      case 'va_bien':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'ayuda':
        return 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
      case 'sin_informe':
      case 'no_iniciado':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';

      case 'secondary':
        return 'bg-secondary text-secondary-foreground border-transparent';
      case 'outline':
        return 'border border-border text-foreground bg-transparent';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors select-none whitespace-nowrap',
        getVariantClasses(),
        className
      )}
      {...props}
    >
      {getIcon()}
      {children}
    </span>
  );
};
