import React, { useState } from 'react';
import { Link2, ArrowRight, Check } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Page } from '../../types';

interface HomePageProps {
  onNavigate: (page: Page, dashTab?: any) => void;
  onStartBuyForMe: (initialUrl?: string) => void;
  onOpenTrackModal?: () => void;
  onOpenCurrencyModal?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onStartBuyForMe,
  onOpenTrackModal,
  onOpenCurrencyModal,
}) => {
  const [productUrl, setProductUrl] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    onStartBuyForMe(productUrl.trim() || 'https://www.amazon.in/dp/B0C12345');
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 antialiased flex flex-col m-0 p-0 max-w-none">
      {/* BEGIN: Header */}
      <header className="sticky top-0 z-40 w-full bg-white/98 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-18 sm:h-20 flex items-center justify-between">
          {/* Left Side: Brand Logo */}
          <div className="shrink-0 flex items-center">
            <div className="sm:hidden">
              <Logo
                size="sm"
                onClick={() => onNavigate('home')}
              />
            </div>
            <div className="hidden sm:block">
              <Logo
                size="md"
                onClick={() => onNavigate('home')}
              />
            </div>
          </div>

          {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 text-[15px] font-bold whitespace-nowrap px-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-[#0066FF] font-extrabold hover:text-[#0052cc] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => onNavigate('countries')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              Countries
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              Help
            </button>
            <button
              type="button"
              onClick={() => (onOpenTrackModal ? onOpenTrackModal() : onNavigate('track'))}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-0.5 select-none"
            >
              Track
            </button>
          </nav>

          {/* Right Actions: Login, Sign Up, Currency, Menu */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-sm lg:text-[15px] font-bold text-[#0B1940] hover:text-[#0066FF] transition-colors cursor-pointer px-2 py-1.5 select-none"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm lg:text-[15px] shadow-xs hover:shadow-md transition-all active:scale-[0.98] text-center inline-flex items-center justify-center cursor-pointer select-none"
            >
              Sign Up
            </button>
            {/* Globe / Currency Selector */}
            <button
              onClick={onOpenCurrencyModal}
              aria-label="Select Language or Currency"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95"
              type="button"
              title="Select Currency"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B1940]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>

            {/* Responsive Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] hover:text-[#0066FF] rounded-full transition-colors cursor-pointer shrink-0 border border-slate-200/90 hover:border-slate-300 shadow-2xs active:scale-95"
              aria-label="Toggle navigation"
              title="Menu"
            >
              <svg className="w-5 h-5 text-[#0B1940]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

        {/* Responsive Navigation Drawer (Works for Mobile, Tablet, and Desktop System) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                <Logo
                  size="sm"
                  onClick={() => {
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/60"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 sm:p-5 space-y-1 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
                  Quick Navigation
                </div>
                {[
                  { label: 'Home', page: 'home' as Page },
                  { label: 'How It Works', page: 'how-it-works' as Page },
                  { label: 'Pricing', page: 'pricing' as Page },
                  { label: 'Countries', page: 'countries' as Page },
                  { label: 'Help', page: 'help' as Page },
                  { label: 'Track Order', page: 'track' as Page, action: onOpenTrackModal },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.action) item.action();
                      else onNavigate(item.page);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14.5px] font-semibold text-slate-800 hover:text-[#0066FF] hover:bg-blue-50/60 transition-colors text-left cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}

                {/* Currency selector inside drawer */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCurrencyModal) onOpenCurrencyModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors text-left cursor-pointer border border-slate-200/60"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span className="text-xs font-semibold">Change Currency</span>
                    </div>
                    <span className="text-xs font-bold text-[#0066FF]">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer: Login & Sign Up */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl bg-white transition-colors cursor-pointer"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
        {/* END: Header */}

      {/* BEGIN: HTML Hero Banner Section */}
      <section className="relative w-full bg-white border-b border-slate-100 overflow-hidden">
        <div className="relative w-full px-4 sm:px-6 md:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0">
          {/* Left Side: HTML Text & HTML Search Bar */}
          <div className="relative z-10 w-full lg:w-[54%] xl:w-[52%] shrink-0">
            {/* Badge: From India to Your Doorstep */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#EAF2FF] border border-[#D4E4FF] mb-2.5 sm:mb-3 shadow-2xs">
              <svg
                className="w-5 h-3.5 rounded-[2px] shrink-0 shadow-2xs"
                viewBox="0 0 24 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="24" height="5.33" fill="#FF9933" />
                <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
                <rect y="10.67" width="24" height="5.33" fill="#138808" />
                <circle cx="12" cy="8" r="2.1" stroke="#000080" strokeWidth="0.9" />
                <circle cx="12" cy="8" r="0.6" fill="#000080" />
              </svg>
              <span className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#1849A9] tracking-tight">
                From India to Your Doorstep
              </span>
            </div>

            {/* Main Heading (HTML Text) */}
            <h1 className="font-extrabold tracking-tight leading-[1.08] text-[#050F2C] text-[28px] sm:text-[38px] md:text-[44px] lg:text-[46px] xl:text-[50px] mb-2.5 sm:mb-3">
              <span className="block">Shop Anywhere</span>
              <span className="block">in India.</span>
              <span className="block text-[#0D59F2] mt-0.5">We Deliver Worldwide.</span>
            </h1>

            {/* Subtitle / Description (HTML Text) */}
            <p className="text-[#334155] text-[13.5px] sm:text-[15px] md:text-[15.5px] leading-[1.48] font-normal max-w-[500px] mb-3.5 sm:mb-4">
              Found something you love on an Indian website?
              <br className="hidden sm:inline" /> Send us the product link. We&apos;ll purchase it in India,
              <br className="hidden sm:inline" /> receive it at our warehouse, combine your orders,
              <br className="hidden sm:inline" /> and ship them to your doorstep worldwide.
            </p>

            {/* HTML Search Bar Form */}
            <form
              onSubmit={handleGetStarted}
              className={`w-full max-w-[680px] bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-2 transition-all mb-3 sm:mb-3.5 ${
                isSearchFocused
                  ? 'border-[#0D59F2] shadow-[0_0_22px_rgba(13,89,242,0.32)]'
                  : 'border-[#2563EB] shadow-[0_0_16px_rgba(37,99,235,0.22)]'
              }`}
            >
              <div className="flex-1 flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-2 py-2 sm:py-1.5">
                <Link2 className="w-5 h-5 text-slate-400 shrink-0 -rotate-45" />
                <input
                  type="url"
                  value={productUrl}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="Paste an Indian product link (e.g. Amazon, Myntra, Flipkart...)"
                  className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-[13.5px] sm:text-[15px] font-medium focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#0057FF] hover:bg-[#0047D4] active:bg-[#003BB3] text-white font-semibold text-[14.5px] sm:text-[15.5px] px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
            </form>

            {/* 3 Feature Checkmarks (HTML Text) */}
            <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-2 pt-0.5">
              <div className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="text-[13px] sm:text-[14px] font-medium text-[#334155]">
                  Purchase on your behalf
                </span>
              </div>

              <div className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="text-[13px] sm:text-[14px] font-medium text-[#334155]">
                  Combine multiple orders
                </span>
              </div>

              <div className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="text-[13px] sm:text-[14px] font-medium text-[#334155]">
                  Ship worldwide
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Redesigned HD Illustration — fits 100% uncropped on all screens */}
          <div className="w-full lg:w-[58%] xl:w-[60%] lg:absolute lg:inset-y-0 lg:right-0 flex items-center justify-center lg:justify-end pointer-events-none select-none z-0">
            <img
              src="/assets/hero-redesigned-hd.jpg?v=6"
              alt="Shop in India, Deliver Worldwide - India Gate, Taj Mahal, Airplane and India2World Parcels"
              className="w-full max-w-[540px] sm:max-w-[620px] lg:max-w-none lg:w-auto lg:h-full object-contain object-center lg:object-right"
            />
          </div>
        </div>
      </section>
      {/* END: HTML Hero Banner Section */}

      {/* BEGIN: Top Online Stores Section matching stitch clone */}
      <section className="w-full px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-8 bg-white border-b border-slate-100">
        <div className="relative bg-gradient-to-br from-[#EEF5FF] via-white to-[#F0F7FF] rounded-3xl border-2 border-[#CFE0FF] px-5 py-6 sm:px-8 sm:py-7 shadow-[0_12px_36px_-10px_rgba(13,89,242,0.15)] overflow-hidden">
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-400/10 blur-3xl" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D59F2]/10 border border-[#0D59F2]/20 text-[#0D59F2] text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#0D59F2] animate-pulse" />
                <span>Direct Official Store Links ? 100+ Brands</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-[#0B1940] tracking-tight">
                Shop from India&apos;s Top Online Stores
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Click any store logo below to open its official website, browse products, and copy the product link for global delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('stores')}
              className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 bg-[#0D59F2] hover:bg-[#0047D4] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-[0_4px_14px_rgba(13,89,242,0.3)] hover:shadow-[0_6px_20px_rgba(13,89,242,0.4)] transition-all cursor-pointer group"
            >
              <span>And many more...</span>
              <span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">100+</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Animated Infinite Carousel of Store Logos */}
          <div className="relative z-10 w-full overflow-hidden py-2">
            {/* Soft Left & Right Edge Gradient Fade Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-[#EEF5FF] to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-[#F0F7FF] to-transparent z-20" />

            <div className="animate-stores-carousel gap-4 sm:gap-5">
              {[0, 1].map((loopIdx) => (
                <div key={loopIdx} className="flex items-center gap-4 sm:gap-5 shrink-0">
                  {/* 1. Amazon.in */}
                  <a
                    href="https://www.amazon.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FF9900] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(255,153,0,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Amazon.in official website"
                  >
                    <img
                      src="/assets/store-amazon-mark.png"
                      alt="Amazon.in"
                      className="h-8 sm:h-9 w-auto max-w-[135px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FF9900] mt-1 transition-colors">
                      amazon.in ?
                    </span>
                  </a>

                  {/* 2. Myntra */}
                  <a
                    href="https://www.myntra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FF3F6C] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(255,63,108,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Myntra official website"
                  >
                    <img
                      src="/assets/store-myntra-mark.png"
                      alt="Myntra"
                      className="h-8 sm:h-9 w-auto max-w-[135px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FF3F6C] mt-1 transition-colors">
                      myntra.com ?
                    </span>
                  </a>

                  {/* 3. Flipkart */}
                  <a
                    href="https://www.flipkart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#2874F0] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(40,116,240,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Flipkart official website"
                  >
                    <img
                      src="/assets/store-flipkart-mark.png"
                      alt="Flipkart"
                      className="h-8 sm:h-9 w-auto max-w-[135px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2874F0] mt-1 transition-colors">
                      flipkart.com ?
                    </span>
                  </a>

                  {/* 4. TATA CLiQ */}
                  <a
                    href="https://www.tatacliq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#DA1C5C] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(218,28,92,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit TATA CLiQ official website"
                  >
                    <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                      <div className="flex items-center gap-1 leading-none">
                        <span className="text-[10px] font-black tracking-widest text-[#111827]">TATA</span>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
                          <polygon points="5,1 9,9 1,9" fill="#e11d48" />
                        </svg>
                      </div>
                      <span className="text-lg font-extrabold text-[#111827] tracking-tight leading-none mt-0.5">CLiQ</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#DA1C5C] mt-1.5 transition-colors">
                      tatacliq.com ?
                    </span>
                  </a>

                  {/* 5. AJIO */}
                  <a
                    href="https://www.ajio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#2C4152] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(44,65,82,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit AJIO official website"
                  >
                    <span className="text-2xl font-black tracking-[0.16em] text-[#0c2340] group-hover:scale-105 transition-transform leading-none">
                      AJIO
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2C4152] mt-2 transition-colors">
                      ajio.com ?
                    </span>
                  </a>

                  {/* 6. NYKAA */}
                  <a
                    href="https://www.nykaa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FC2779] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(252,39,121,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit NYKAA official website"
                  >
                    <span className="text-2xl font-black italic tracking-tighter text-[#fc2779] -skew-x-6 drop-shadow-2xs group-hover:scale-105 transition-transform leading-none">
                      NYKAA
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FC2779] mt-2 transition-colors">
                      nykaa.com ?
                    </span>
                  </a>

                  {/* 7. bigbasket */}
                  <a
                    href="https://www.bigbasket.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#84C225] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(132,194,37,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit bigbasket official website"
                  >
                    <div className="flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                      <div className="w-6 h-6 rounded-md bg-[#84c225] flex items-center justify-center text-[#e52d38] font-black text-xs leading-none shadow-xs">
                        bb
                      </div>
                      <span className="text-base font-extrabold text-[#222222] tracking-tight">bigbasket</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#65A30D] mt-1.5 transition-colors">
                      bigbasket.com ?
                    </span>
                  </a>

                  {/* 8. Fabindia */}
                  <a
                    href="https://www.fabindia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#8B1E24] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(139,30,36,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Fabindia official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-11.png" alt="Fabindia" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#8B1E24] tracking-tight font-serif">Fabindia</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#8B1E24] mt-1.5 transition-colors">
                      fabindia.com ?
                    </span>
                  </a>

                  {/* 9. Manyavar */}
                  <a
                    href="https://www.manyavar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#991B1B] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(153,27,27,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Manyavar official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-12.png" alt="Manyavar" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#991B1B] tracking-tight">Manyavar</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#991B1B] mt-1.5 transition-colors">
                      manyavar.com ?
                    </span>
                  </a>

                  {/* 10. Tanishq */}
                  <a
                    href="https://www.tanishq.co.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#881337] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(136,19,55,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Tanishq official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-51.png" alt="Tanishq" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#881337] tracking-widest uppercase">TANISHQ</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#881337] mt-1.5 transition-colors">
                      tanishq.co.in ?
                    </span>
                  </a>

                  {/* 11. FirstCry */}
                  <a
                    href="https://www.firstcry.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#F97316] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(249,115,22,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit FirstCry official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-93.png" alt="FirstCry" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#EA580C] tracking-tight">firstcry</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#F97316] mt-1.5 transition-colors">
                      firstcry.com ?
                    </span>
                  </a>

                  {/* 12. Croma */}
                  <a
                    href="https://www.croma.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#0D9488] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(13,148,136,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Croma official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-61.png" alt="Croma" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-black text-[#111827] tracking-wide">croma</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0D9488] mt-1.5 transition-colors">
                      croma.com ?
                    </span>
                  </a>

                  {/* 13. Meesho */}
                  <a
                    href="https://www.meesho.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#F43397] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(244,51,151,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Meesho official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-5.png" alt="Meesho" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#F43397] tracking-tight">meesho</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#F43397] mt-1.5 transition-colors">
                      meesho.com ?
                    </span>
                  </a>

                  {/* 14. Haldiram's */}
                  <a
                    href="https://www.haldirams.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[175px] sm:w-[195px] h-[76px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#DC2626] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Haldiram's official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-91.png" alt="Haldiram's" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#DC2626] tracking-tight">Haldiram&apos;s</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#DC2626] mt-1.5 transition-colors">
                      haldirams.com ?
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* END: Top Online Stores Section */}

      {/* BEGIN: How It Works Section */}
      <section id="how-it-works" className="w-full px-4 sm:px-6 md:px-10 lg:px-12 py-6 md:py-8 bg-white border-b border-slate-100">
        <div className="bg-[#f0f7ff] rounded-3xl p-6 md:p-8 border border-blue-100/80">
          {/* Header */}
          <div className="flex flex-wrap items-baseline gap-3 mb-8">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-[#0B1940] tracking-tight">
              How It Works
            </h2>
            <span className="text-sm md:text-base text-slate-500 font-normal">
              Get your favorite products from India in 6 simple steps
            </span>
          </div>

            {/* Step Buttons Row */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-2">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                  if (input) input.focus();
                  else onStartBuyForMe();
                }}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#165dfc] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    1
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  Paste the Link
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                  Share the product link<br className="hidden lg:inline" /> from any Indian website
                </p>
              </button>

              {/* Connecting Arrow */}
              <div className="hidden lg:flex items-center justify-center pt-7 text-slate-300 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 7h8" />
                    <path d="M8 11h8" />
                    <path d="M8 15h5" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    2
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  Get a Quote
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                  We review and<br className="hidden lg:inline" /> share the total cost
                </p>
              </button>

              {/* Connecting Arrow */}
              <div className="hidden lg:flex items-center justify-center pt-7 text-slate-300 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    3
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  We Purchase It
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                  Our team buys it<br className="hidden lg:inline" /> on your behalf
                </p>
              </button>

              {/* Connecting Arrow */}
              <div className="hidden lg:flex items-center justify-center pt-7 text-slate-300 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 12v10" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#165dfc] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    4
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  We Receive It
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                  Items arrive at<br className="hidden lg:inline" /> our Indian warehouse
                </p>
              </button>

              {/* Connecting Arrow */}
              <div className="hidden lg:flex items-center justify-center pt-7 text-slate-300 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 5 */}
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                    <circle cx="17" cy="15" r="1" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#165dfc] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    5
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  We Consolidate It
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[170px]">
                  Combine multiple orders<br className="hidden lg:inline" /> to save on shipping
                </p>
              </button>

              {/* Connecting Arrow */}
              <div className="hidden lg:flex items-center justify-center pt-7 text-slate-300 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 6 */}
              <button
                type="button"
                onClick={() => onNavigate('countries')}
                className="group flex flex-col items-center text-center flex-1 p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-full bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16.5 9.4 7.55 4.24" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.29 7 12 12 20.71 7" />
                    <line x1="12" y1="22" x2="12" y2="12" />
                  </svg>
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#e11d48] text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    6
                  </span>
                </div>
                <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1">
                  We Ship Worldwide
                </h3>
                <p className="text-[12px] md:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                  Fast and reliable<br className="hidden lg:inline" /> delivery to your country
                </p>
              </button>
            </div>
          </div>
      </section>
      {/* END: How It Works Section */}

      {/* BEGIN: Popular Categories Section matching stitch clone */}
      <section className="w-full px-4 sm:px-6 md:px-10 lg:px-12 py-8 md:py-10 bg-white">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Popular Categories</h2>
          <button
            onClick={() => onNavigate('buy-for-me')}
            className="text-sm font-bold text-[#0066FF] hover:text-[#0052cc] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Categories</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Category 1: Fashion */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-rose-50/30 flex items-center justify-center p-2">
                <img
                  alt="Fashion Saree"
                  className="w-full h-full object-cover rounded-xl object-center group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-fashion.jpg"
                />
              </div>
              <div className="py-3 px-2 text-center bg-white border-t border-slate-100/80">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors">
                  Fashion
                </span>
              </div>
            </div>

            {/* Category 2: Electronics */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-slate-100/50 flex items-center justify-center p-2">
                <img
                  alt="Electronics Headphones"
                  className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-electronics.jpg"
                />
              </div>
              <div className="py-3 px-2 text-center bg-white border-t border-slate-100/80">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors">
                  Electronics
                </span>
              </div>
            </div>

            {/* Category 3: Home & Living */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-amber-50/30 flex items-center justify-center p-2">
                <img
                  alt="Home and Living Sofa"
                  className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-home.jpg"
                />
              </div>
              <div className="py-3 px-2 text-center bg-white border-t border-slate-100/80">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors">
                  Home &amp; Living
                </span>
              </div>
            </div>

            {/* Category 4: Beauty & Personal Care */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-pink-50/30 flex items-center justify-center p-2">
                <img
                  alt="Beauty &amp; Personal Care"
                  className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-beauty.jpg"
                />
              </div>
              <div className="py-3 px-1 text-center bg-white border-t border-slate-100/80">
                <span className="text-[12px] sm:text-[12.5px] lg:text-[13px] font-bold text-[#0B1940] whitespace-nowrap tracking-tight group-hover:text-[#0066FF] transition-colors">
                  Beauty &amp; Personal Care
                </span>
              </div>
            </div>

            {/* Category 5: Books */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-orange-50/30 flex items-center justify-center p-2">
                <img
                  alt="Books Atomic Habits and Ikigai"
                  className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-books.jpg"
                />
              </div>
              <div className="py-3 px-2 text-center bg-white border-t border-slate-100/80">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors">
                  Books
                </span>
              </div>
            </div>

            {/* Category 6: Health & Wellness */}
            <div
              onClick={() => onStartBuyForMe()}
              className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="h-36 w-full overflow-hidden bg-emerald-50/30 flex items-center justify-center p-2">
                <img
                  alt="Health &amp; Wellness"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  src="/assets/stitch-cat-wellness.jpg"
                />
              </div>
              <div className="py-3 px-2 text-center bg-white border-t border-slate-100/80">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0B1940] whitespace-nowrap group-hover:text-[#0066FF] transition-colors">
                  Health &amp; Wellness
                </span>
              </div>
            </div>
          </div>
      </section>
      {/* END: Popular Categories Section */}
    </div>
  );
};
