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
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/98 backdrop-blur-md border-b border-slate-200/80 shadow-2xs overflow-x-clip">
      <div className="w-full max-w-full px-3 sm:px-6 lg:px-6 xl:px-10 2xl:px-12 h-15 sm:h-18 lg:h-20 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        {/* Left Side: Brand Logo */}
        <div className="min-w-0 shrink flex items-center">
          <Logo
            size="md"
            className="max-w-[112px] min-[360px]:max-w-[126px] min-[400px]:max-w-[142px] sm:max-w-[165px] lg:max-w-[180px] xl:max-w-[205px]"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
        <nav className="hidden lg:flex items-center justify-center lg:gap-3.5 xl:gap-6 2xl:gap-7 text-[13px] xl:text-[14px] 2xl:text-[14.5px] font-bold whitespace-nowrap px-1 min-w-0">
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
              className={`transition-colors hover:text-[#0066FF] cursor-pointer py-1.5 px-1 select-none font-bold ${
                currentPage === link.page
                  ? 'text-[#0066FF] font-extrabold'
                  : 'text-[#0B1940]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Request CTA, Login, Sign Up, Currency, Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 xl:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('request-external-purchase')}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200/90 font-bold text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            <span className="hidden 2xl:inline">Request a Product from Another Platform</span>
            <span className="inline 2xl:hidden">Request Product</span>
          </button>
          {/* Login (visible on tablet/desktop; inside mobile drawer on small screens) */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className={`hidden sm:inline-flex items-center justify-center transition-colors hover:text-[#0066FF] font-bold text-sm cursor-pointer px-2 py-1.5 select-none whitespace-nowrap ${
              currentPage === 'auth' ? 'text-[#0066FF]' : 'text-[#0B1940]'
            }`}
          >
            Login
          </button>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="h-8 sm:h-9 px-2.5 min-[375px]:px-3 sm:px-4 rounded-lg sm:rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-[11px] min-[375px]:text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98] inline-flex items-center justify-center cursor-pointer select-none whitespace-nowrap shrink-0"
          >
            Sign Up
          </button>

          {/* Language / Currency Selector */}
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            title={`Select Currency (${currentCurrency})`}
            aria-label={`Select Currency (${currentCurrency})`}
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95 text-[11px] min-[375px]:text-xs font-bold whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF] shrink-0" />
            <span className="hidden min-[360px]:inline">{currencyInfo.code}</span>
            <span className="hidden md:inline text-slate-500 font-semibold">
              ({currencyInfo.symbol.trim()})
            </span>
          </button>

          {/* Hamburger Menu Button (Three Lines) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center bg-slate-50/90 hover:bg-blue-50 text-[#0B1940] hover:text-[#0066FF] rounded-full transition-all cursor-pointer shrink-0 border border-slate-200/90 hover:border-blue-200 shadow-2xs active:scale-95"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            title="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-current" strokeWidth={2.2} />
            ) : (
              <Menu className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-current" strokeWidth={2.2} />
            )}
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
