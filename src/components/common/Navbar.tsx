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
      <div className="w-full px-2.5 min-[360px]:px-3.5 sm:px-6 md:px-5 min-[820px]:px-6 lg:px-8 xl:px-12 h-15 sm:h-18 lg:h-20 flex items-center justify-between gap-1.5 min-[360px]:gap-2 sm:gap-3">
        {/* Left Side: Brand Logo */}
        <div className="shrink-0 flex items-center min-w-0">
          <Logo
            size="md"
            className="max-w-[94px] min-[360px]:max-w-[112px] min-[390px]:max-w-[126px] sm:max-w-[155px] md:max-w-[128px] min-[820px]:max-w-[144px] lg:max-w-[178px] xl:max-w-[220px]"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
        <nav className="hidden md:flex flex-1 min-w-0 items-center justify-center md:gap-2 min-[820px]:gap-3.5 lg:gap-5 xl:gap-8 text-[12px] min-[820px]:text-[13px] lg:text-[14px] xl:text-[15px] font-bold whitespace-nowrap px-1 lg:px-2 xl:px-4">
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

        {/* Right Actions: Login, Sign Up, Currency, Menu */}
        <div className="flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 md:gap-1.5 min-[820px]:gap-2 lg:gap-2.5 xl:gap-3.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('request-external-purchase')}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 font-extrabold text-xs cursor-pointer transition-colors whitespace-nowrap"
          >
            Request a Product from Another Platform
          </button>
          {/* Login */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className={`transition-colors hover:text-[#0066FF] font-bold text-[11.5px] min-[360px]:text-xs sm:text-sm md:text-[12.5px] min-[820px]:text-[13px] lg:text-[14px] xl:text-[15px] cursor-pointer px-1.5 min-[360px]:px-2 py-1.5 select-none whitespace-nowrap ${
              currentPage === 'auth' ? 'text-[#0066FF]' : 'text-[#0B1940]'
            }`}
          >
            Login
          </button>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-2.5 min-[360px]:px-3 py-1.5 sm:px-4 sm:py-2 md:px-3.5 md:py-1.5 min-[820px]:px-4 min-[820px]:py-2 lg:px-4 lg:py-2 xl:px-6 xl:py-2.5 rounded-lg sm:rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-[11.5px] min-[360px]:text-xs sm:text-sm md:text-[12.5px] min-[820px]:text-[13px] lg:text-[14px] xl:text-[15px] shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer select-none whitespace-nowrap"
          >
            Sign Up
          </button>

          {/* Language / Currency Selector */}
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            title={`Select Currency (${currentCurrency})`}
            aria-label={`Select Currency (${currentCurrency})`}
            className="h-8 sm:h-9 xl:h-10 px-2 min-[360px]:px-2.5 xl:px-3 rounded-full flex items-center justify-center gap-1 sm:gap-1.5 bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95 text-[11px] min-[360px]:text-xs font-bold"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF] shrink-0" />
            <span>{currencyInfo.code}</span>
            <span className="hidden sm:inline md:hidden lg:inline text-slate-500">
              ({currencyInfo.symbol.trim()})
            </span>
          </button>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] hover:text-[#0066FF] border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer transition-colors shrink-0 active:scale-95"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B1940]" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B1940]" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
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
                onNavigate('request-external-purchase');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 px-3 bg-blue-50 text-[#0066FF] border border-blue-200 font-extrabold rounded-xl cursor-pointer text-sm"
            >
              Request a Product from Another Platform
            </button>
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
