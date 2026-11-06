import React, { useState, useEffect } from 'react';
import { Page, DashboardTab } from './types';
import { AdminTab } from './types/admin';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { PricingPage } from './components/pages/PricingPage';
import { CountriesPage } from './components/pages/CountriesPage';
import { StoresDirectoryPage } from './components/pages/StoresDirectoryPage';
import { HowItWorksPage } from './components/pages/HowItWorksPage';
import { HelpCenterPage } from './components/pages/HelpCenterPage';
import { Footer } from './components/common/Footer';
import { TrackingModal } from './components/common/TrackingModal';
import { CurrencyModal } from './components/common/CurrencyModal';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { isUserAuthenticated, USER_CHANGED_EVENT } from './utils/userAuth';

export const VALID_PAGES: Page[] = [
  'home',
  'auth',
  'buy-for-me',
  'dashboard',
  'pricing',
  'countries',
  'stores',
  'how-it-works',
  'help',
  'admin-login',
  'admin',
];

export const VALID_ADMIN_TABS: AdminTab[] = [
  'dashboard',
  'customers',
  'purchase-requests',
  'purchase-request-details',
  'quotations',
  'purchase-queue',
  'orders',
  'incoming-packages',
  'receive-package',
  'warehouse',
  'consolidation',
  'create-consolidation',
  'shipping',
  'tracking',
  'payments',
  'refunds',
  'support',
  'notifications',
  'reports',
  'settings',
];

export const VALID_DASHBOARD_TABS: DashboardTab[] = [
  'overview',
  'buy-for-me',
  'my-requests',
  'my-purchases',
  'my-warehouse',
  'consolidation',
  'shipments',
  'payments',
  'addresses',
  'support',
  'notifications',
  'profile',
];

export interface ParsedRoute {
  page: Page;
  dashboardTab: DashboardTab;
  adminTab: AdminTab;
  openTrackModal?: boolean;
}

export const resolveRouteFromUrl = (): ParsedRoute => {
  if (typeof window === 'undefined') {
    return { page: 'home', dashboardTab: 'overview', adminTab: 'dashboard' };
  }

  let pathStr = window.location.pathname;

  // 1. Check legacy hash e.g. #/admin/notifications or #pricing
  if (window.location.hash) {
    const rawHash = window.location.hash.split('?')[0].replace(/^#\/?/, '').trim();
    if (rawHash) {
      pathStr = `/${rawHash}`;
    }
  }

  const segments = pathStr
    .split('/')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const primary = segments[0] || '';
  const secondary = segments[1] || '';
  const params = new URLSearchParams(window.location.search);

  // 1. Admin paths: /admin or /admin/:adminTab
  if (primary === 'admin') {
    let adminTab: AdminTab = 'dashboard';
    if (secondary && VALID_ADMIN_TABS.includes(secondary as AdminTab)) {
      adminTab = secondary as AdminTab;
    } else {
      const qTab = params.get('adminTab') as AdminTab;
      if (qTab && VALID_ADMIN_TABS.includes(qTab)) {
        adminTab = qTab;
      }
    }
    return { page: 'admin', dashboardTab: 'overview', adminTab };
  }

  // 2. Admin Login: /admin-login
  if (primary === 'admin-login') {
    return { page: 'admin-login', dashboardTab: 'overview', adminTab: 'dashboard' };
  }

  // 3. Customer Dashboard: /dashboard or /dashboard/:tab
  if (primary === 'dashboard') {
    let dashTab: DashboardTab = 'overview';
    if (secondary && VALID_DASHBOARD_TABS.includes(secondary as DashboardTab)) {
      dashTab = secondary as DashboardTab;
    } else {
      const qTab = params.get('tab') as DashboardTab;
      if (qTab && VALID_DASHBOARD_TABS.includes(qTab)) {
        dashTab = qTab;
      }
    }
    return { page: 'dashboard', dashboardTab: dashTab, adminTab: 'dashboard' };
  }

  // 4. Buy-For-Me: /buy-for-me
  if (primary === 'buy-for-me') {
    return { page: 'buy-for-me', dashboardTab: 'buy-for-me', adminTab: 'dashboard' };
  }

  // 5. Auth: /auth, /login, /signup
  if (primary === 'auth' || primary === 'login' || primary === 'signup') {
    return { page: 'auth', dashboardTab: 'overview', adminTab: 'dashboard' };
  }

  // 6. Track modal: /track
  if (primary === 'track') {
    return { page: 'home', dashboardTab: 'overview', adminTab: 'dashboard', openTrackModal: true };
  }

  // 7. Other public pages: /pricing, /how-it-works, /countries, /stores, /help, /home
  if (primary && VALID_PAGES.includes(primary as Page)) {
    return { page: primary as Page, dashboardTab: 'overview', adminTab: 'dashboard' };
  }

  // 8. Query parameter fallback: ?page=pricing etc.
  const queryPage = params.get('page')?.toLowerCase() as Page;
  if (queryPage && VALID_PAGES.includes(queryPage)) {
    const qAdminTab = (params.get('adminTab') as AdminTab) || 'dashboard';
    const qDashTab = (params.get('tab') as DashboardTab) || 'overview';
    return {
      page: queryPage,
      dashboardTab: VALID_DASHBOARD_TABS.includes(qDashTab) ? qDashTab : 'overview',
      adminTab: VALID_ADMIN_TABS.includes(qAdminTab) ? qAdminTab : 'dashboard',
    };
  }

  return { page: 'home', dashboardTab: 'overview', adminTab: 'dashboard' };
};

export const buildCleanPath = (
  page: Page,
  dashboardTab?: DashboardTab,
  adminTab?: AdminTab
): string => {
  if (page === 'home') {
    return '/';
  }
  if (page === 'admin') {
    return `/admin/${adminTab || 'dashboard'}`;
  }
  if (page === 'dashboard') {
    if (dashboardTab && dashboardTab !== 'overview') {
      return `/dashboard/${dashboardTab}`;
    }
    return '/dashboard';
  }
  if (page === 'buy-for-me') {
    return '/buy-for-me';
  }
  return `/${page}`;
};

function AppContent() {
  const { isAuthenticated } = useAdminAuth();
  const initialRoute = resolveRouteFromUrl();

  const [authRedirectIntent, setAuthRedirectIntent] = useState<Page | null>(null);

  const getInitialPage = (): Page => {
    if ((initialRoute.page === 'buy-for-me' || initialRoute.page === 'dashboard') && !isUserAuthenticated()) {
      return 'auth';
    }
    return initialRoute.page;
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(initialRoute.dashboardTab);
  const [adminTab, setAdminTab] = useState<AdminTab>(initialRoute.adminTab);
  const [initialBuyForMeUrl, setInitialBuyForMeUrl] = useState('');
  const [trackingModalOpen, setTrackingModalOpen] = useState(Boolean(initialRoute.openTrackModal));
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem('i2w_selected_currency') || 'INR (₹)';
    } catch {
      return 'INR (₹)';
    }
  });

  const handleSelectCurrency = (curr: string) => {
    setSelectedCurrency(curr);
    try {
      localStorage.setItem('i2w_selected_currency', curr);
    } catch {}
  };

  // Sync URL (clean HTML5 History without '#') and scroll to top on page/tab navigation
  useEffect(() => {
    const targetUrl = buildCleanPath(currentPage, dashboardTab, adminTab);
    const currentUrl = `${window.location.pathname}`;

    if (window.location.hash) {
      // Instantly remove any legacy # hash from the address bar
      window.history.replaceState(null, '', targetUrl);
    } else if (
      currentUrl !== targetUrl &&
      !(currentPage === 'home' && (window.location.pathname === '/' || window.location.pathname === '/home'))
    ) {
      window.history.pushState(null, '', targetUrl);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    const viewportCanvas = document.getElementById('viewport-canvas');
    if (viewportCanvas) {
      viewportCanvas.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, dashboardTab, adminTab]);

  // Auth gate listener: If logged out, redirect protected pages to auth
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isUserAuthenticated()) {
        if (currentPage === 'buy-for-me' || currentPage === 'dashboard') {
          setAuthRedirectIntent(currentPage);
          setCurrentPage('auth');
        }
      }
    };
    window.addEventListener(USER_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(USER_CHANGED_EVENT, handleAuthChange);
  }, [currentPage]);

  // Handle browser Back / Forward navigation (popstate) & strip any legacy hash changes
  useEffect(() => {
    const handlePopState = () => {
      const route = resolveRouteFromUrl();
      if ((route.page === 'buy-for-me' || route.page === 'dashboard') && !isUserAuthenticated()) {
        setAuthRedirectIntent(route.page);
        setCurrentPage('auth');
      } else {
        setCurrentPage(route.page);
      }
      setDashboardTab(route.dashboardTab);
      setAdminTab(route.adminTab);
      if (route.openTrackModal) {
        setTrackingModalOpen(true);
      }
    };

    const handleHashChange = () => {
      handlePopState();
      const route = resolveRouteFromUrl();
      const cleanUrl = buildCleanPath(route.page, route.dashboardTab, route.adminTab);
      window.history.replaceState(null, '', cleanUrl);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleStartBuyForMe = (url?: string) => {
    if (url) setInitialBuyForMeUrl(url);
    if (!isUserAuthenticated()) {
      setAuthRedirectIntent('buy-for-me');
      setCurrentPage('auth');
      return;
    }
    setDashboardTab('buy-for-me');
    setCurrentPage('buy-for-me');
  };

  const handleAuthSuccess = () => {
    if (authRedirectIntent === 'buy-for-me') {
      setAuthRedirectIntent(null);
      setDashboardTab('buy-for-me');
      setCurrentPage('buy-for-me');
    } else {
      setCurrentPage('dashboard');
      setDashboardTab('overview');
    }
  };

  const handleAdminTabChange = (tab: AdminTab) => {
    setAdminTab(tab);
    if (currentPage !== 'admin') {
      setCurrentPage('admin');
    }
  };

  const handleDashboardTabChange = (tab: DashboardTab) => {
    setDashboardTab(tab);
    if (tab === 'buy-for-me') {
      setCurrentPage('buy-for-me');
    } else if (currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page: Page, dashTab?: DashboardTab, admTab?: AdminTab) => {
    if (page === 'track') {
      setTrackingModalOpen(true);
      return;
    }
    if ((page === 'buy-for-me' || page === 'dashboard') && !isUserAuthenticated()) {
      setAuthRedirectIntent(page);
      if (dashTab) setDashboardTab(dashTab);
      setCurrentPage('auth');
      return;
    }
    if (dashTab) {
      setDashboardTab(dashTab);
    } else if (page === 'buy-for-me') {
      setDashboardTab('buy-for-me');
    }
    if (admTab) {
      setAdminTab(admTab);
    }
    setCurrentPage(page);
  };

  const isPublicPageWithNavbar = !['dashboard', 'auth', 'home', 'buy-for-me', 'admin', 'admin-login'].includes(
    currentPage
  );
  const showFooter = !['auth', 'admin', 'admin-login'].includes(currentPage);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full max-w-none m-0 p-0 overflow-x-hidden">
        {/* Modals */}
        <TrackingModal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          initialTrackingNumber="SHP-50012"
        />
        <CurrencyModal
          isOpen={currencyModalOpen}
          onClose={() => setCurrencyModalOpen(false)}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={handleSelectCurrency}
        />

        {/* Navbar: Display on public pages, hide on Dashboard, Auth, Home, Buy For Me and Admin Panel */}
        {isPublicPageWithNavbar && (
          <Navbar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onOpenTrackModal={() => setTrackingModalOpen(true)}
            onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
            currentCurrency={selectedCurrency}
          />
        )}

        {/* Main Content Pages */}
        <div className="flex-1 w-full flex flex-col">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onStartBuyForMe={handleStartBuyForMe}
              onOpenTrackModal={() => setTrackingModalOpen(true)}
              onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
              selectedCurrency={selectedCurrency}
            />
          )}

          {currentPage === 'auth' && (
            <AuthPage
              onSuccess={handleAuthSuccess}
              onNavigate={handleNavigate}
            />
          )}

          {(currentPage === 'dashboard' || currentPage === 'buy-for-me') && (
            <CustomerDashboard
              initialTab={currentPage === 'buy-for-me' ? 'buy-for-me' : dashboardTab}
              onNavigatePage={handleNavigate}
              onTabChange={handleDashboardTabChange}
              initialBuyForMeUrl={initialBuyForMeUrl}
            />
          )}

          {currentPage === 'pricing' && (
            <PricingPage
              onNavigate={handleNavigate}
              onStartBuyForMe={() => handleStartBuyForMe()}
              selectedCurrency={selectedCurrency}
            />
          )}

          {currentPage === 'countries' && (
            <CountriesPage
              onNavigate={handleNavigate}
              onStartBuyForMe={() => handleStartBuyForMe()}
              selectedCurrency={selectedCurrency}
            />
          )}

          {currentPage === 'stores' && (
            <StoresDirectoryPage
              onNavigate={handleNavigate}
              onStartBuyForMe={(url) => handleStartBuyForMe(url)}
            />
          )}

          {currentPage === 'how-it-works' && (
            <HowItWorksPage
              onNavigate={handleNavigate}
              onStartBuyForMe={() => handleStartBuyForMe()}
            />
          )}

          {currentPage === 'help' && (
            <HelpCenterPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'admin-login' && (
            <AdminLoginPage
              onSuccess={() => setCurrentPage('admin')}
              onNavigateHome={() => handleNavigate('home')}
            />
          )}

          {currentPage === 'admin' &&
            (isAuthenticated ? (
              <AdminPanel
                currentTab={adminTab}
                onSelectTab={handleAdminTabChange}
                onNavigateHome={() => handleNavigate('home')}
              />
            ) : (
              <AdminLoginPage
                onSuccess={() => setCurrentPage('admin')}
                onNavigateHome={() => handleNavigate('home')}
              />
            ))}
        </div>

        {/* Global Full-Width Footer across customer pages */}
        {showFooter && (
          <Footer
            onNavigate={handleNavigate}
            onOpenTrackModal={() => setTrackingModalOpen(true)}
            onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
          />
        )}
    </div>
  );
}

export function App() {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  );
}

export default App;
