import React, { useState } from 'react';
import { Page, DashboardTab } from '../../types';
import { Sparkles, Home, ShoppingCart, LayoutDashboard, UserCheck, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface DemoSwitcherProps {
  currentPage: Page;
  currentDashboardTab?: DashboardTab;
  onNavigate: (page: Page, dashTab?: DashboardTab) => void;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({
  currentPage,
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  const mainPages = [
    { id: 'home' as Page, label: '2. Homepage', icon: Home },
    { id: 'auth' as Page, label: '1. Sign Up / Login', icon: UserCheck },
    { id: 'buy-for-me' as Page, label: '3. Buy For Me', icon: ShoppingCart },
    { id: 'dashboard' as Page, label: '4. Dashboard', icon: LayoutDashboard },
    { id: 'admin' as Page, label: '5. Admin Panel', icon: Shield },
  ];

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-2 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2 text-xs font-bold transition-all hover:scale-105"
        title="Open Page Switcher"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Pages</span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Reference design quick switcher"
      className="fixed bottom-4 right-4 z-50 transition-all duration-300 max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-1.5 sm:px-3 sm:py-2 rounded-2xl sm:rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-1.5 text-xs font-medium max-w-full overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 px-2 py-1 text-amber-300 font-bold sm:border-r border-slate-700 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Pages:</span>
        </div>

        {mainPages.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${
                isActive
                  ? 'bg-[#0066FF] text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors ml-1"
          title="Minimize Switcher"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
