import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastNotice, dismissToast } = useApp();

  if (!toastNotice) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/95 text-foreground border border-border shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-foreground truncate">
            {toastNotice.message}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {toastNotice.undoAction && (
            <button
              onClick={() => {
                toastNotice.undoAction?.();
                dismissToast();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Deshacer</span>
            </button>
          )}
          <button
            onClick={dismissToast}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
