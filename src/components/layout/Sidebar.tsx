import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  History,
  Settings,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabId = 'dashboard' | 'pioneers' | 'monthly' | 'reviews' | 'years' | 'settings';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, refMonth } = useApp();

  const navItems = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pioneers' as TabId, label: 'Precursores', icon: Users },
    { id: 'monthly' as TabId, label: 'Captura Mensual', icon: CalendarCheck },
    { id: 'reviews' as TabId, label: 'Revisiones', icon: ClipboardList, badge: refMonth >= 6 ? 'Marzo' : undefined },
    { id: 'years' as TabId, label: 'Años de Servicio', icon: History },
    { id: 'settings' as TabId, label: 'Ajustes y Bitácora', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border/80 bg-card p-4 space-y-6 no-print flex-shrink-0">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
          Navegación
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role and Permissions footer card */}
      <div className="mt-auto pt-4 border-t border-border/60">
        <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{currentUser.displayName}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {currentUser.role === 'secretary' ? 'Acceso completo (Secretario)' : 'Modo Lectura (Comité de servicio)'}
          </p>
        </div>
      </div>
    </aside>
  );
};
