import React, { useState } from 'react';
import { Logo } from './Logo';
import { Globe, Menu, X } from 'lucide-react';
import { Page } from '../../types';
import { getCurrencyInfo } from '../../utils/currency';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenTrackModal?: () => void;
  onOpenCurrencyModal?: () => void;
  currentCurrency?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenTrackModal,
  onOpenCurrencyModal,
  currentCurrency = 'INR (₹)',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currencyInfo = getCurrencyInfo(currentCurrency);

  const navLinks = [
    { label: 'Home', page: 'home' as Page },
    { label: 'How It Works', page: 'how-it-works' as Page },
    { label: 'Pricing', page: 'pricing' as Page },
    { label: 'Countries', page: 'countries' as Page },
    { label: 'Help', page: 'help' as Page },
    { label: 'Track', page: 'track' as Page, action: onOpenTrackModal },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/98 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="w-full px-2.5 sm:px-6 lg:px-8 xl:px-12 h-15 sm:h-18 lg:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left Side: Brand Logo */}
        <div className="shrink-0 flex items-center min-w-0">
          <div className="xl:hidden">
            <Logo
              size="sm"
              className="max-w-[104px] sm:max-w-[148px]"
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
            />
          </div>
          <div className="hidden xl:block">
            <Logo
              size="md"
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>

        {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
        <nav className="hidden md:flex flex-1 items-center justify-center md:gap-2.5 lg:gap-4 xl:gap-8 text-[13px] lg:text-[14px] xl:text-[15px] font-bold whitespace-nowrap px-1.5 lg:px-2 xl:px-4">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => {
                if (link.action) {
                  link.action();
                } else {
                  onNavigate(link.page);
                }
              }}
              className={`transition-colors hover:text-[#0066FF] cursor-pointer py-1.5 px-0.5 select-none font-bold ${
                currentPage === link.page
                  ? 'text-[#0066FF] font-extrabold'
                  : 'text-[#0B1940]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Login, Sign Up, Currency */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5 xl:gap-3.5 shrink-0">
          {/* Login */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className={`transition-colors hover:text-[#0066FF] font-bold text-[13px] lg:text-[14px] xl:text-[15px] cursor-pointer px-1.5 lg:px-2 py-1.5 select-none whitespace-nowrap ${
              currentPage === 'auth' ? 'text-[#0066FF]' : 'text-[#0B1940]'
            }`}
          >
            Login
          </button>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-3.5 py-2 lg:px-4 lg:py-2 xl:px-6 xl:py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-[13px] lg:text-[14px] xl:text-[15px] shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer select-none whitespace-nowrap"
          >
            Sign Up
          </button>

          {/* Language / Currency Selector */}
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            title={`Select Currency (${currentCurrency})`}
            aria-label={`Select Currency (${currentCurrency})`}
            className="h-9 xl:h-10 px-2.5 xl:px-3 rounded-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95 text-xs font-bold"
          >
            <Globe className="w-4 h-4 text-[#0066FF]" />
            <span>{currencyInfo.code}</span>
            <span className="text-slate-500">({currencyInfo.symbol.trim()})</span>
          </button>
        </div>

        {/* Mobile Controls (< md) */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-sm font-bold text-[#0B1940] hover:text-[#0066FF] cursor-pointer whitespace-nowrap"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-2.5 sm:px-3.5 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            className="h-7.5 sm:h-9 px-2 sm:px-2.5 rounded-full flex items-center justify-center gap-1 bg-white hover:bg-slate-50 text-[#0B1940] border border-slate-200/90 shadow-2xs cursor-pointer transition-colors shrink-0 text-[10.5px] sm:text-xs font-bold"
            title={`Select Currency (${currentCurrency})`}
            aria-label={`Select Currency (${currentCurrency})`}
          >
            <Globe className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
            <span>{currencyInfo.code}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] hover:text-[#0066FF] border border-slate-200/90 shadow-2xs cursor-pointer transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#0B1940]" /> : <Menu className="w-4 h-4 text-[#0B1940]" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navbar: Touch-friendly navigation pills below md */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar px-2.5 sm:px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-700">
        {navLinks.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => {
              if (link.action) {
                link.action();
              } else {
                onNavigate(link.page);
              }
            }}
            className={`px-3 py-1.5 rounded-full shrink-0 transition-colors cursor-pointer ${
              currentPage === link.page
                ? 'bg-[#0066FF] text-white font-bold shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  if (link.action) {
                    link.action();
                  } else {
                    onNavigate(link.page);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg text-base font-semibold cursor-pointer ${
                  currentPage === link.page
                    ? 'bg-blue-50 text-[#0066FF]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenCurrencyModal) onOpenCurrencyModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-700 font-semibold border border-slate-200 rounded-xl bg-slate-50 cursor-pointer text-sm"
            >
              <span>Currency: {currentCurrency}</span>
              <span className="text-[#0066FF] font-bold">Change</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 bg-[#0066FF] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
