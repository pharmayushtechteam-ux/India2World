import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getDynamicSidebarBadges,
  markAllNotificationsAsRead,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  ListOrdered,
  Package,
  PackageCheck,
  Warehouse,
  Boxes,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  Headphones,
  Bell,
  BarChart3,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ExternalLink,
  Shield,
  User,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  children,
  searchQuery = '',
  onSearchChange,
}) => {
  const { adminUser, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number | undefined>>(getDynamicSidebarBadges);

  // Set of tabs where the user has opened/viewed the section, so their badge is cleared
  const [clearedTabs, setClearedTabs] = useState<Set<string>>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('i2w_cleared_sidebar_badges');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return new Set<string>();
  });

  // Map sub-tabs (like purchase-request-details, receive-package, create-consolidation) to their parent tab
  const getActiveMenuId = (tab: AdminTab): AdminTab => {
    if (tab === 'purchase-request-details') return 'purchase-requests';
    if (tab === 'receive-package') return 'incoming-packages';
    if (tab === 'create-consolidation') return 'consolidation';
    return tab;
  };

  const activeMenuId = getActiveMenuId(currentTab);

  const markTabBadgeAsCleared = (tabId: string) => {
    setClearedTabs((prev) => {
      const updated = new Set(prev);
      updated.add(tabId);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('i2w_cleared_sidebar_badges', JSON.stringify([...updated]));
        }
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (tabId === 'notifications') {
      markAllNotificationsAsRead();
    }
  };

  // Automatically remove the badge when a tab is currently opened / active
  useEffect(() => {
    if (activeMenuId) {
      markTabBadgeAsCleared(activeMenuId);
    }
  }, [activeMenuId]);

  useEffect(() => {
    const handleUpdate = () => {
      setBadges(getDynamicSidebarBadges());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const getBadgeForTab = (tabId: string): number | undefined => {
    // Once clicked or currently open, the number is automatically removed
    if (activeMenuId === tabId || clearedTabs.has(tabId)) {
      return undefined;
    }
    const count = badges[tabId];
    return count && count > 0 ? count : undefined;
  };

  const menuItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'purchase-requests', label: 'Purchase Requests', icon: FileText, badge: getBadgeForTab('purchase-requests') },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet, badge: getBadgeForTab('quotations') },
    { id: 'purchase-queue', label: 'Purchase Queue', icon: ListOrdered, badge: getBadgeForTab('purchase-queue') },
    { id: 'orders', label: 'Orders', icon: Package, badge: getBadgeForTab('orders') },
    { id: 'incoming-packages', label: 'Incoming Packages', icon: PackageCheck, badge: getBadgeForTab('incoming-packages') },
    { id: 'warehouse', label: 'Warehouse', icon: Warehouse, badge: getBadgeForTab('warehouse') },
    { id: 'consolidation', label: 'Consolidation', icon: Boxes, badge: getBadgeForTab('consolidation') },
    { id: 'shipping', label: 'Shipping', icon: Truck, badge: getBadgeForTab('shipping') },
    { id: 'tracking', label: 'Tracking', icon: MapPin },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: getBadgeForTab('payments') },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw, badge: getBadgeForTab('refunds') },
    { id: 'support', label: 'Support', icon: Headphones, badge: getBadgeForTab('support') },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: getBadgeForTab('notifications') },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    onSelectTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 z-40 md:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* Floating Re-open Sidebar Button when closed */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 px-3.5 py-2.5 bg-[#0B1933] hover:bg-[#0066FF] text-white rounded-full shadow-2xl border border-white/20 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer animate-in fade-in"
          title="Open Left Navigation Menu"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1933] text-white flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header: Logo & Title */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div
            onClick={() => {
              markTabBadgeAsCleared('consolidation');
              onSelectTab('consolidation');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img src="/logo-icon.png" alt="India2World" className="w-8 h-8 object-contain shrink-0" />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-tight">
                India2World
              </div>
              <div className="text-[10px] text-slate-400 font-normal leading-tight">
                Shop in India. Deliver Worldwide.
              </div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            title="Collapse sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenuId === item.id;
            const showBadge = item.badge != null && item.badge > 0 && !isActive && !clearedTabs.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  markTabBadgeAsCleared(item.id);
                  onSelectTab(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0066FF] text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {showBadge && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors bg-white/15 text-slate-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
            {/* Hamburger toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
              aria-label="Toggle navigation"
              title={sidebarOpen ? "Hide left sidebar" : "Show left sidebar"}
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {/* Global Search Bar matching screenshot */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Search by Customer, Request ID, Shipment ID..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F1F5F9] border border-slate-200/60 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Right Header: Admin Profile matching screenshot (No bell) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-left touch-manipulation"
              >
                <img
                  src="/images/packages/admin-avatar.png"
                  alt="Admin"
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-[#0B1933] leading-tight">
                    Admin
                  </div>
                  <div className="text-xs text-slate-400 font-normal leading-tight">
                    Super Admin
                  </div>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-800">{adminUser?.name || 'Admin'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{adminUser?.email || 'admin@india2world.com'}</p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-lg cursor-pointer text-left"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateHome();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-lg cursor-pointer text-left"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Customer Site</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
