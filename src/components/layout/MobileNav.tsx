import React from 'react';
import { TabId } from './Sidebar';
import { LayoutDashboard, Users, CalendarCheck, ClipboardList, Settings } from 'lucide-react';

interface MobileNavProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pioneers' as TabId, label: 'Precursores', icon: Users },
    { id: 'monthly' as TabId, label: 'Mes', icon: CalendarCheck },
    { id: 'reviews' as TabId, label: 'Revisiones', icon: ClipboardList },
    { id: 'settings' as TabId, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-all ${
              isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
