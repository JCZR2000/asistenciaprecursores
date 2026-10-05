import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, User, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPioneer: (pioneerId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPioneer,
}) => {
  const { pioneers, activePioneersForYear, pioneerCalculations } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredPioneers = query.trim() === ''
    ? activePioneersForYear.slice(0, 6)
    : activePioneersForYear.filter(({ pioneer }) => {
        const full = `${pioneer.first_name} ${pioneer.last_name}`.toLowerCase();
        const q = query.toLowerCase();
        return (
          full.includes(q) ||
          `grupo ${pioneer.group_number}`.includes(q) ||
          `g${pioneer.group_number}`.includes(q)
        );
      });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredPioneers.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredPioneers.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPioneers[selectedIndex]) {
        onSelectPioneer(filteredPioneers[selectedIndex].pioneer.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por nombre, apellido o grupo (ej. 'Pérez' o 'Grupo 3')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredPioneers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No se encontraron precursores que coincidan con "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {query.trim() === '' ? 'Precursores sugeridos' : `${filteredPioneers.length} resultados`}
              </div>
              {filteredPioneers.map(({ pioneer, yearRecord, calc }, idx) => {
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={pioneer.id}
                    onClick={() => {
                      onSelectPioneer(pioneer.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-secondary text-primary'
                        }`}
                      >
                        G{pioneer.group_number}
                      </div>
                      <div>
                        <div className="text-sm">
                          {pioneer.first_name} {pioneer.last_name}
                        </div>
                        <div
                          className={`text-[11px] ${
                            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          {yearRecord.pioneer_type === 'salud_delicada'
                            ? 'Salud delicada'
                            : `Regular · Total: ${calc.total_hours} h · Meta: ${calc.goal || 600} h`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {calc.total_hours} h
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 ${
                          isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-secondary/50 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Navega con <kbd className="font-mono bg-background px-1 py-0.5 rounded border border-border">↑</kbd>{' '}
            <kbd className="font-mono bg-background px-1 py-0.5 rounded border border-border">↓</kbd> y presiona{' '}
            <kbd className="font-mono bg-background px-1 py-0.5 rounded border border-border">Enter</kbd>
          </span>
          <span>Atajo global: Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
