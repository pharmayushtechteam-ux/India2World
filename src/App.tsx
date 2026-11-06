import React, { useState, useEffect } from 'react';
import { Page, DashboardTab } from './types';
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

const VALID_PAGES: Page[] = [
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

const resolvePageFromUrl = (): Page => {
  if (typeof window === 'undefined') return 'home';

  // 1. Check pathname: e.g. /pricing, /how-it-works, /stores, /countries, /home
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  if (path && VALID_PAGES.includes(path as Page)) {
    return path as Page;
  }

  // 2. Check query parameter: ?page=pricing
  const params = new URLSearchParams(window.location.search);
  const queryPage = params.get('page')?.toLowerCase() as Page;
  if (queryPage && VALID_PAGES.includes(queryPage)) {
    return queryPage;
  }

  // 3. Fallback: check legacy hash if user arrived via an old bookmarked link e.g. #/pricing or #/home
  const rawHash = window.location.hash.split('?')[0].replace('#/', '').replace('#', '').trim().toLowerCase();
  if (rawHash && VALID_PAGES.includes(rawHash as Page)) {
    return rawHash as Page;
  }

  return 'home';
};

const resolveDashboardTabFromUrl = (): DashboardTab => {
  if (typeof window === 'undefined') return 'overview';
  const params = new URLSearchParams(window.location.search);
  const hashParams = window.location.hash.includes('?')
    ? new URLSearchParams(window.location.hash.split('?')[1])
    : null;
  const tab = (params.get('tab') || hashParams?.get('tab')) as DashboardTab;
  return tab || 'overview';
};

const buildCleanPathForPage = (page: Page, tab?: DashboardTab): string => {
  const basePath = page === 'home' ? '/' : `/${page}`;
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  params.delete('page');

  if ((page === 'dashboard' || page === 'buy-for-me') && tab && tab !== 'overview') {
    params.set('tab', tab);
  } else {
    params.delete('tab');
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  return `${basePath}${query}`;
};

function AppContent() {
  const { isAuthenticated } = useAdminAuth();

  const [authRedirectIntent, setAuthRedirectIntent] = useState<Page | null>(null);

  const getInitialPage = (): Page => {
    const resolved = resolvePageFromUrl();
    if ((resolved === 'buy-for-me' || resolved === 'dashboard') && !isUserAuthenticated()) {
      return 'auth';
    }
    return resolved;
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [initialBuyForMeUrl, setInitialBuyForMeUrl] = useState('');
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem('i2w_selected_currency') || 'INR (?)';
    } catch {
      return 'INR (?)';
    }
  });

  const handleSelectCurrency = (curr: string) => {
    setSelectedCurrency(curr);
    try {
      localStorage.setItem('i2w_selected_currency', curr);
    } catch {}
  };

  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(resolveDashboardTabFromUrl);

  // Sync URL (clean HTML5 History without '#') and scroll to top on page navigation
  useEffect(() => {
    const targetUrl = buildCleanPathForPage(currentPage, dashboardTab);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

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
  }, [currentPage, dashboardTab]);

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
      const page = resolvePageFromUrl();
      if ((page === 'buy-for-me' || page === 'dashboard') && !isUserAuthenticated()) {
        setAuthRedirectIntent(page);
        setCurrentPage('auth');
      } else {
        setCurrentPage(page);
      }
      setDashboardTab(resolveDashboardTabFromUrl());
    };

    const handleHashChange = () => {
      const page = resolvePageFromUrl();
      if ((page === 'buy-for-me' || page === 'dashboard') && !isUserAuthenticated()) {
        setAuthRedirectIntent(page);
        setCurrentPage('auth');
      } else {
        setCurrentPage(page);
      }
      setDashboardTab(resolveDashboardTabFromUrl());
      const cleanUrl = buildCleanPathForPage(page, resolveDashboardTabFromUrl());
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

  const handleNavigate = (page: Page, dashTab?: DashboardTab) => {
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
              <AdminPanel onNavigateHome={() => handleNavigate('home')} />
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
