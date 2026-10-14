import React, { useState } from 'react';
import { Logo } from './Logo';
import { Globe, Menu, X, Package, Shield, HelpCircle, DollarSign, MapPin } from 'lucide-react';
import { Page } from '../../types';

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
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-18 sm:h-20 flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <div className="shrink-0 flex items-center">
          <Logo
            size="md"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 text-[15px] font-bold whitespace-nowrap px-4">
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
        <div className="hidden md:flex items-center gap-2 sm:gap-3 lg:gap-3.5 shrink-0">
          {/* Login */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className={`transition-colors hover:text-[#0066FF] font-bold text-sm lg:text-[15px] cursor-pointer px-2 py-1.5 select-none ${
              currentPage === 'auth' ? 'text-[#0066FF]' : 'text-[#0B1940]'
            }`}
          >
            Login
          </button>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm lg:text-[15px] shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer select-none"
          >
            Sign Up
          </button>

          {/* Language / Currency Globe */}
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            title={`Select Currency (${currentCurrency})`}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B1940]" />
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[#0B1940] hover:text-[#0066FF] cursor-pointer"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-3.5 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] border border-slate-200/90 shadow-2xs cursor-pointer transition-colors"
            title={`Select Currency (${currentCurrency})`}
          >
            <Globe className="w-4 h-4 text-[#0B1940]" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] hover:text-[#0066FF] border border-slate-200/90 shadow-2xs cursor-pointer transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#0B1940]" /> : <Menu className="w-4 h-4 text-[#0B1940]" />}
          </button>
        </div>
      </div>

      {/* Mobile / Minimized Sub-Navbar: Guarantees Home and all navigation details are always visible when screen is small or minimized */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-700">
        {navLinks.map((link) => (
          <button
            key={link.label}
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.action) {
                    link.action();
                  } else {
                    onNavigate(link.page);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
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
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 text-slate-700 font-semibold border border-slate-200 rounded-xl"
            >
              Login
            </button>
            <button
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 bg-[#0066FF] text-white font-bold rounded-xl shadow-xs"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
