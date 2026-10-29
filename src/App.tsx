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
import { DemoSwitcher } from './components/common/DemoSwitcher';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { isUserAuthenticated, USER_CHANGED_EVENT } from './utils/userAuth';

function AppContent() {
  const { isAuthenticated } = useAdminAuth();

  const [authRedirectIntent, setAuthRedirectIntent] = useState<Page | null>(null);

  const getInitialPage = (): Page => {
    const rawHash = window.location.hash.split('?')[0].replace('#/', '').replace('#', '');
    const params = new URLSearchParams(window.location.search);
    const p = (params.get('page') || rawHash) as Page;
    const validPages: Page[] = ['home', 'auth', 'buy-for-me', 'dashboard', 'pricing', 'countries', 'stores', 'how-it-works', 'help', 'admin-login', 'admin'];
    const resolved = validPages.includes(p) ? p : 'home';
    if ((resolved === 'buy-for-me' || resolved === 'dashboard') && !isUserAuthenticated()) {
      return 'auth';
    }
    return resolved;
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [initialBuyForMeUrl, setInitialBuyForMeUrl] = useState('');
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('INR (₹)');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = window.location.hash.includes('?') 
      ? new URLSearchParams(window.location.hash.split('?')[1]) 
      : null;
    const tab = (hashParams?.get('tab') || params.get('tab')) as DashboardTab;
    return tab || 'overview';
  });

  // Sync hash and scroll to top on page navigation
  useEffect(() => {
    window.location.hash = `#/${currentPage}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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

  useEffect(() => {
    const handleHashChange = () => {
      const cleanHash = window.location.hash.split('?')[0].replace('#/', '').replace('#', '') as Page;
      const validPages: Page[] = ['home', 'auth', 'buy-for-me', 'dashboard', 'pricing', 'countries', 'stores', 'how-it-works', 'help', 'admin-login', 'admin'];
      if (validPages.includes(cleanHash)) {
        if ((cleanHash === 'buy-for-me' || cleanHash === 'dashboard') && !isUserAuthenticated()) {
          setAuthRedirectIntent(cleanHash);
          setCurrentPage('auth');
        } else {
          setCurrentPage(cleanHash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  const isPublicPageWithNavbar = !['dashboard', 'auth', 'home', 'buy-for-me', 'admin', 'admin-login'].includes(currentPage);
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
        onSelectCurrency={setSelectedCurrency}
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
          />
        )}

        {currentPage === 'countries' && (
          <CountriesPage
            onNavigate={handleNavigate}
            onStartBuyForMe={() => handleStartBuyForMe()}
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

        {currentPage === 'admin' && (
          isAuthenticated ? (
            <AdminPanel onNavigateHome={() => handleNavigate('home')} />
          ) : (
            <AdminLoginPage
              onSuccess={() => setCurrentPage('admin')}
              onNavigateHome={() => handleNavigate('home')}
            />
          )
        )}
      </div>

      {/* Global Full-Width Footer across customer pages */}
      {showFooter && (
        <Footer
          onNavigate={handleNavigate}
          onOpenTrackModal={() => setTrackingModalOpen(true)}
          onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
        />
      )}

      {/* Floating Demo Switcher for fast verification of reference designs */}
      {currentPage !== 'admin-login' && (
        <DemoSwitcher
          currentPage={currentPage}
          currentDashboardTab={dashboardTab}
          onNavigate={handleNavigate}
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
