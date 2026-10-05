import React from 'react';
import { PaceCalculationResult } from '../../domain/types';
import { Badge, getPaceBadgeInfo } from './Badge';
import { cn } from '../../lib/utils';

interface PaceMeterProps {
  pace: PaceCalculationResult;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.sin(rad)).toFixed(2)),
    y: Number((cy - r * Math.cos(rad)).toFixed(2)),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export const PaceMeter: React.FC<PaceMeterProps> = ({
  pace,
  size = 'md',
  showDetails = true,
  className,
}) => {
  if (pace.status === 'salud_delicada') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center', className)}>
        <Badge variant="salud_delicada" className="mb-2">Salud delicada</Badge>
        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
          {pace.suggestion}
        </p>
      </div>
    );
  }

  if (pace.status === 'no_iniciado') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border text-center', className)}>
        <Badge variant="no_iniciado" className="mb-2">Aún no inicia</Badge>
        <p className="text-xs text-muted-foreground">{pace.suggestion}</p>
      </div>
    );
  }

  if (pace.status === 'sin_informe') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center', className)}>
        <Badge variant="sin_informe" className="mb-1.5">Sin informe del mes</Badge>
        <p className="text-xs text-muted-foreground mt-1">Pendiente de recibir informe de horas</p>
      </div>
    );
  }

  // Angular mapping:
  // 100% is EXACT vertical top (0 deg from vertical)
  // Left side: 0% to 100% maps to -90 deg to 0 deg
  // Right side: 100% to 160% maps to 0 deg to +90 deg
  let needleAngle = 0;
  if (pace.pace_pct <= 1.0) {
    const clamped = Math.max(0, pace.pace_pct);
    needleAngle = -90 + clamped * 90;
  } else {
    const over = Math.min(0.6, pace.pace_pct - 1.0);
    needleAngle = (over / 0.6) * 90;
  }

  const cx = 110;
  const cy = 100;
  const radius = 72;
  const strokeWidth = 14;

  // Exact zone angles
  // Red zone: -90 deg (0%) to -18 deg (80%)
  const redPath = describeArc(cx, cy, radius, -90, -18);
  // Amber zone: -18 deg (80%) to 0 deg (100%)
  const amberPath = describeArc(cx, cy, radius, -18, 0);
  // Green zone: 0 deg (100%) to +90 deg (160%+)
  const greenPath = describeArc(cx, cy, radius, 0, 90);

  const pctFormatted = `${Math.round(pace.pace_pct * 100)}%`;
  const diffSign = pace.difference_hours >= 0 ? '+' : '';
  const diffFormatted = `${diffSign}${Math.round(pace.difference_hours)} h`;
  const badgeInfo = getPaceBadgeInfo(pace.status);

  // Friendly clean phrase without duplicate emojis
  let friendlyPhrase = pace.suggestion.replace(/^[🟢🟡🔴⚪]\s*/, '');
  if (pace.difference_hours > 0) {
    friendlyPhrase = `Lleva ${Math.round(pace.difference_hours)} h de adelanto; mantiene un ritmo óptimo para alcanzar la meta anual.`;
  } else if (pace.difference_hours < 0) {
    const roundedNeeded = pace.needed_pace !== null ? Math.round(pace.needed_pace) : 0;
    const diffAbs = Math.abs(Math.round(pace.difference_hours));
    friendlyPhrase = `Lleva ${diffAbs} h de atraso; necesita ${roundedNeeded} h/mes en los ${pace.months_left} meses que quedan.`;
  }

  if (size === 'sm') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant={badgeInfo.variant}>
          {badgeInfo.label} ({pctFormatted})
        </Badge>
        <span className={cn('text-xs font-semibold', pace.difference_hours >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
          {diffFormatted}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center bg-card border border-border/80 rounded-2xl p-5 shadow-xs', className)}>
      {/* Semicircular Gauge SVG */}
      <div className="relative w-56 h-32 flex items-center justify-center overflow-visible select-none">
        <svg viewBox="0 0 220 120" className="w-full h-full overflow-visible">
          {/* Subtle background track */}
          <path
            d={describeArc(cx, cy, radius, -90, 90)}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted/30"
          />

          {/* Red Zone (0% - 80%) */}
          <path
            d={redPath}
            fill="none"
            stroke="hsl(var(--status-riesgo))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Amber Zone (80% - 100%) */}
          <path
            d={amberPath}
            fill="none"
            stroke="hsl(var(--status-cerca))"
            strokeWidth={strokeWidth}
            opacity="0.9"
          />

          {/* Green Zone (100% - 160%+) */}
          <path
            d={greenPath}
            fill="none"
            stroke="hsl(var(--status-cumplido))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* 100% Expected Vertical Marker Tick */}
          <line
            x1={cx}
            y1={cy - radius - 12}
            x2={cx}
            y2={cy - radius + 10}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="2,2"
            className="text-foreground/80"
          />

          {/* Top Expected Marker Label */}
          <text
            x={cx}
            y={cy - radius - 15}
            textAnchor="middle"
            className="text-[9px] font-bold uppercase tracking-wider fill-muted-foreground"
          >
            100% Esperado
          </text>

          {/* Dial ticks: 0% at left, 160% at right */}
          <text
            x={cx - radius - 5}
            y={cy + 14}
            textAnchor="middle"
            className="text-[9px] font-semibold fill-muted-foreground"
          >
            0%
          </text>
          <text
            x={cx + radius + 8}
            y={cy + 14}
            textAnchor="middle"
            className="text-[9px] font-semibold fill-muted-foreground"
          >
            160%
          </text>

          {/* Needle Indicator with smooth transition */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}
            style={{ transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <polygon points="-3,0 3,0 0,-68" className="fill-foreground drop-shadow-sm" />
            <circle cx="0" cy="0" r="8" className="fill-foreground" />
            <circle cx="0" cy="0" r="3" className="fill-background" />
          </g>
        </svg>
      </div>

      {/* Main Stat and difference badge */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">{pctFormatted}</span>
        <span className={cn('text-sm font-bold', pace.difference_hours >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
          ({diffFormatted})
        </span>
      </div>

      <div className="mt-2">
        <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
      </div>

      {showDetails && (
        <div className="w-full mt-4 pt-3 border-t border-border/60 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            {friendlyPhrase}
          </p>
          {pace.needed_pace !== null && pace.months_left > 0 && pace.status !== 'va_bien' && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/80 text-[11px] font-semibold text-secondary-foreground">
              <span>Ritmo necesario:</span>
              <span className="text-primary font-bold">{Math.round(pace.needed_pace)} h/mes</span>
              <span className="text-muted-foreground">({pace.months_left} meses restantes)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
