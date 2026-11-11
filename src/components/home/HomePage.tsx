import React, { useState } from 'react';
import { Link2, ArrowRight, Check, ShoppingBag, ExternalLink, Calculator } from 'lucide-react';
import { Logo } from '../common/Logo';
import { CustomerExternalPlatformRequestPortal } from '../buy-for-me/CustomerExternalPlatformRequestPortal';
import { Page } from '../../types';
import { countriesList } from '../../data/mockData';
import { formatINR, formatUSD, getCurrencyInfo } from '../../utils/currency';

interface HomePageProps {
  onNavigate: (page: Page, dashTab?: any) => void;
  onStartBuyForMe: (initialUrl?: string) => void;
  onOpenTrackModal?: () => void;
  onOpenCurrencyModal?: () => void;
  selectedCurrency?: string;
}

interface CatalogueItem {
  id: string;
  name: string;
  category: string;
  storeName: string;
  storeColor: string;
  priceINR: number;
  weightKg: number;
  imageUrl: string;
  productUrl: string;
}

const CATALOGUE_ITEMS: CatalogueItem[] = [
  {
    id: 'cat-item-1',
    name: "Nike Men's Air Zoom Running Shoes",
    category: 'Fashion',
    storeName: 'Amazon.in',
    storeColor: '#FF9900',
    priceINR: 3999,
    weightKg: 0.95,
    imageUrl: '/assets/product-shoes.jpg',
    productUrl: 'https://www.amazon.in/dp/B0C12345',
  },
  {
    id: 'cat-item-2',
    name: "Anouk Women's Embroidered Kurta & Dupatta Set",
    category: 'Fashion',
    storeName: 'Myntra',
    storeColor: '#FF3F6C',
    priceINR: 1299,
    weightKg: 0.45,
    imageUrl: '/assets/product-kurta.jpg',
    productUrl: 'https://www.myntra.com/kurta-sets/anouk/women-printed-kurta/18923412',
  },
  {
    id: 'cat-item-3',
    name: 'Banarasi Pure Silk Festive Zari Saree',
    category: 'Fashion',
    storeName: 'Fabindia',
    storeColor: '#8B1E24',
    priceINR: 4599,
    weightKg: 0.65,
    imageUrl: '/assets/stitch-cat-fashion.jpg',
    productUrl: 'https://www.fabindia.com/clothing/women-sarees',
  },
  {
    id: 'cat-item-4',
    name: 'boAt Rockerz 450 Pro Wireless Bluetooth Headphones',
    category: 'Electronics',
    storeName: 'Croma',
    storeColor: '#0D9488',
    priceINR: 1499,
    weightKg: 0.38,
    imageUrl: '/assets/stitch-cat-electronics.jpg',
    productUrl: 'https://www.amazon.in/dp/B07PR1CL3S',
  },
  {
    id: 'cat-item-5',
    name: 'Handcrafted Jaipur Brass & Wood Living Room Decor Set',
    category: 'Home & Living',
    storeName: 'Pepperfry',
    storeColor: '#EA580C',
    priceINR: 2850,
    weightKg: 1.4,
    imageUrl: '/assets/stitch-cat-home.jpg',
    productUrl: 'https://www.pepperfry.com/category/home-decor.html',
  },
  {
    id: 'cat-item-6',
    name: 'Forest Essentials Soundarya Radiance 24K Gold Facial Kit',
    category: 'Beauty & Personal Care',
    storeName: 'Nykaa',
    storeColor: '#FC2779',
    priceINR: 2450,
    weightKg: 0.4,
    imageUrl: '/assets/stitch-cat-beauty.jpg',
    productUrl: 'https://www.nykaa.com/khadi-natural/p/1234',
  },
  {
    id: 'cat-item-7',
    name: 'Atomic Habits & Ikigai Bestseller Hardcover Combo',
    category: 'Books',
    storeName: 'Amazon.in',
    storeColor: '#FF9900',
    priceINR: 499,
    weightKg: 0.55,
    imageUrl: '/assets/product-book.jpg',
    productUrl: 'https://www.amazon.in/Atomic-Habits-James-Clear/dp/1847941834',
  },
  {
    id: 'cat-item-8',
    name: 'Organic India Tulsi Wellness & Ayurvedic Immunity Box',
    category: 'Health & Wellness',
    storeName: 'Tata CLiQ',
    storeColor: '#DA1C5C',
    priceINR: 980,
    weightKg: 0.5,
    imageUrl: '/assets/stitch-cat-wellness.jpg',
    productUrl: 'https://www.tatacliq.com/wellness',
  },
];

const CATALOGUE_CATEGORIES = [
  'All',
  'Fashion',
  'Electronics',
  'Home & Living',
  'Beauty & Personal Care',
  'Books',
  'Health & Wellness',
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onStartBuyForMe,
  onOpenTrackModal,
  onOpenCurrencyModal,
  selectedCurrency = 'INR (₹)',
}) => {
  const [productUrl, setProductUrl] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCatalogueCategory, setActiveCatalogueCategory] = useState<string>('All');

  // Interactive Homepage Shipping Calculator State
  const [calcCountry, setCalcCountry] = useState(countriesList[0].name);
  const [calcWeightKg, setCalcWeightKg] = useState<number>(2.0);
  const [calcLengthCm, setCalcLengthCm] = useState<number>(30);
  const [calcWidthCm, setCalcWidthCm] = useState<number>(22);
  const [calcHeightCm, setCalcHeightCm] = useState<number>(14);
  const [calcBoxesCount, setCalcBoxesCount] = useState<number>(2);
  const [calcServiceTier, setCalcServiceTier] = useState<'express' | 'economy'>('express');

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    onStartBuyForMe(productUrl.trim() || 'https://www.amazon.in/dp/B0C12345');
  };

  const handleSelectCategoryCard = (categoryName: string) => {
    setActiveCatalogueCategory(categoryName);
    const el = document.getElementById('product-catalogue');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredCatalogue =
    activeCatalogueCategory === 'All'
      ? CATALOGUE_ITEMS
      : CATALOGUE_ITEMS.filter((item) => item.category === activeCatalogueCategory);

  // Shipping Calculator computation
  const selectedCountryObj = countriesList.find((c) => c.name === calcCountry) || countriesList[0];
  const volumetricWeightKg = Number(((calcLengthCm * calcWidthCm * calcHeightCm) / 5000).toFixed(2));
  const chargeableWeightKg = Math.max(0.5, Number(Math.max(calcWeightKg, volumetricWeightKg).toFixed(2)));
  const baseRateUSD = selectedCountryObj.startingRateUSD;
  const perKgRateUSD = calcServiceTier === 'express' ? 8.5 : 6.5;
  const tierMultiplier = calcServiceTier === 'express' ? 1 : 0.82;
  const shippingTotalUSD = Math.max(
    5,
    Math.round((baseRateUSD + Math.max(0, chargeableWeightKg - 0.5) * perKgRateUSD) * tierMultiplier)
  );
  const shippingTotalINR = Math.round(shippingTotalUSD * 86.5);
  const consolidationSavingsUSD = Math.max(0, (calcBoxesCount - 1) * Math.round(baseRateUSD * 0.75));

  const navLinks = [
    { label: 'Request from Another Platform', page: 'request-external-purchase' as Page },
                { label: 'Home', page: 'home' as Page },
    { label: 'How It Works', page: 'how-it-works' as Page },
    { label: 'Pricing', page: 'pricing' as Page },
    { label: 'Countries', page: 'countries' as Page },
    { label: 'Help', page: 'help' as Page },
    { label: 'Track', page: 'track' as Page, action: onOpenTrackModal },
  ];

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 antialiased flex flex-col m-0 p-0 max-w-none overflow-x-hidden">
      {/* BEGIN: Header */}
      <header className="sticky top-0 z-40 w-full bg-white/98 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-18 lg:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Side: Brand Logo */}
          <div className="shrink-0 flex items-center">
            <Logo
              size="md"
              className="max-w-[130px] sm:max-w-[160px] lg:max-w-[185px] xl:max-w-[210px]"
              onClick={() => onNavigate('home')}
            />
          </div>

          {/* Centre Navigation: Home → How It Works → Pricing → Countries → Help → Track */}
          <nav className="hidden lg:flex items-center justify-center lg:gap-4 xl:gap-7 text-[13.5px] xl:text-[14.5px] font-bold whitespace-nowrap px-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-[#0066FF] font-extrabold hover:text-[#0052cc] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => onNavigate('countries')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              Countries
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              Help
            </button>
            <button
              type="button"
              onClick={() => (onOpenTrackModal ? onOpenTrackModal() : onNavigate('track'))}
              className="text-[#0B1940] font-bold hover:text-[#0066FF] transition-colors cursor-pointer py-1.5 px-1 select-none"
            >
              Track
            </button>
          </nav>

          {/* Right Actions: Request CTA, Login, Sign Up, Currency, Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 xl:gap-3 shrink-0">
            {/* Quick Request Button on larger screens */}
            <button
              type="button"
              onClick={() => onNavigate('request-external-purchase')}
              className="hidden min-[1200px]:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200/90 font-bold text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <span className="hidden 2xl:inline">Request a Product from Another Platform</span>
              <span className="inline 2xl:hidden">Request Product</span>
            </button>

            {/* Login */}
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-xs sm:text-sm font-bold text-[#0B1940] hover:text-[#0066FF] transition-colors cursor-pointer px-2 py-1.5 select-none whitespace-nowrap"
            >
              Login
            </button>

            {/* Sign Up Button */}
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98] text-center inline-flex items-center justify-center cursor-pointer select-none whitespace-nowrap"
            >
              Sign Up
            </button>

            {/* Globe / Currency Selector showing active currency */}
            <button
              onClick={onOpenCurrencyModal}
              aria-label={`Select Currency (${selectedCurrency})`}
              className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full flex items-center justify-center gap-1 sm:gap-1.5 bg-white hover:bg-slate-50 text-[#0B1940] transition-colors border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
              type="button"
              title={`Display Currency: ${selectedCurrency}`}
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066FF] shrink-0"
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
              <span>{currencyInfo.code}</span>
              <span className="hidden sm:inline text-slate-500 font-semibold">
                ({currencyInfo.symbol.trim()})
              </span>
            </button>

            {/* Responsive Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white hover:bg-slate-50 text-[#0B1940] hover:text-[#0066FF] rounded-full transition-colors cursor-pointer shrink-0 border border-slate-200/90 hover:border-slate-300 shadow-2xs active:scale-95"
              aria-label="Toggle navigation"
              title="Menu"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B1940]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                { label: 'Indian Stores (100+)', page: 'stores' as Page },
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
                    <span className="text-xs font-semibold">Currency ({selectedCurrency})</span>
                  </div>
                  <span className="text-xs font-bold text-[#0066FF]">Change &rarr;</span>
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
        {/* Background Hero Illustration Overlay on mobile/tablet, right-side placement on desktop */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-[90%] md:w-[80%] lg:w-[60%] xl:w-[58%] flex items-center justify-end pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/assets/hero-redesigned-hd.jpg?v=6"
            alt="Shop in India, Deliver Worldwide - India Gate, Taj Mahal, Airplane and India2World Parcels"
            className="w-full h-full object-cover object-right lg:object-contain lg:object-right opacity-100 filter brightness-110 contrast-105"
          />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 md:px-7 lg:px-10 xl:px-12 py-6 sm:py-7 md:py-8 lg:py-8 xl:py-6 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Left Side: HTML Text & HTML Search Bar */}
          <div className="relative z-10 w-full md:w-[56%] min-[820px]:w-[54%] lg:w-[53%] xl:w-[52%] min-w-0 shrink-0 bg-white/90 sm:bg-white/85 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 sm:p-6 md:p-0 rounded-2xl md:rounded-none border border-white/80 md:border-none shadow-xl shadow-blue-950/5 md:shadow-none">
            {/* Badge: From India to Your Doorstep */}
            <div className="inline-flex items-center gap-2 md:gap-2.5 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full bg-[#EAF2FF] border border-[#BFDBFE] mb-2.5 md:mb-3 shadow-2xs max-w-full">
              <svg
                className="w-4 h-2.5 sm:w-4.5 sm:h-3 md:w-5 md:h-3.5 rounded-[2px] shrink-0 shadow-2xs"
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
              <span className="text-xs sm:text-[12.5px] md:text-[13px] lg:text-[13.5px] font-bold text-[#0F3894] tracking-tight truncate">
                From India to Your Doorstep
              </span>
            </div>

            {/* Main Heading with enhanced darkness and contrast */}
            <h1 className="font-black tracking-tight text-[#020617] leading-[1.12] md:leading-[1.08] text-[clamp(1.65rem,6.6vw,2.2rem)] sm:text-[32px] md:text-[31px] min-[820px]:text-[35px] lg:text-[42px] xl:text-[50px] mb-2.5 md:mb-3">
              <span className="inline md:block md:whitespace-nowrap">Shop Anywhere </span>
              <span className="inline md:block md:whitespace-nowrap">in India.</span>
              <span className="block text-[#0052FF] font-black mt-0.5 md:whitespace-nowrap">We Deliver Worldwide.</span>
            </h1>

            {/* Subtitle / Description with bright backdrop for high legibility */}
            <p className="text-[#0F172A] text-[13px] min-[375px]:text-[13.5px] sm:text-[14px] md:text-[13.5px] min-[820px]:text-[14px] lg:text-[15px] xl:text-[15.5px] leading-[1.55] md:leading-[1.5] font-semibold max-w-full sm:max-w-[540px] md:max-w-[420px] min-[820px]:max-w-[450px] lg:max-w-[480px] xl:max-w-[500px] mb-3.5 md:mb-4 bg-white/70 md:bg-transparent p-2.5 sm:p-3 md:p-0 rounded-xl md:rounded-none border border-white/60 md:border-none shadow-xs md:shadow-none">
              Found something you love on an Indian website? Send us the product link. We&apos;ll purchase it in India, receive it at our warehouse, combine your orders, and ship them to your doorstep worldwide.
            </p>

            {/* HTML Search Bar Form */}
            <form
              onSubmit={handleGetStarted}
              className={`w-full max-w-full md:max-w-[430px] min-[820px]:max-w-[455px] lg:max-w-[550px] xl:max-w-[680px] bg-white rounded-xl sm:rounded-2xl p-1.5 md:p-2 flex flex-row items-center gap-1.5 sm:gap-2 border-2 transition-all mb-3 md:mb-3.5 ${
                isSearchFocused
                  ? 'border-[#0D59F2] shadow-[0_0_22px_rgba(13,89,242,0.32)]'
                  : 'border-[#2563EB] shadow-[0_0_16px_rgba(37,99,235,0.22)]'
              }`}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3.5 pr-1 sm:pr-2 py-1 sm:py-1.5">
                <Link2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-slate-400 shrink-0 -rotate-45" />
                <input
                  type="url"
                  value={productUrl}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="Paste an Indian product link (e.g. Amazon, Myntra, Flipkart...)"
                  className="w-full min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-[12px] min-[375px]:text-[12.5px] sm:text-[13.5px] md:text-[13px] min-[820px]:text-[13.5px] lg:text-[14.5px] xl:text-[15px] font-semibold focus:outline-hidden text-ellipsis"
                />
              </div>

              <button
                type="submit"
                className="shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 bg-[#0057FF] hover:bg-[#0047D4] active:bg-[#003BB3] text-white font-semibold text-[12px] min-[375px]:text-[12.5px] sm:text-[14px] md:text-[13.5px] min-[820px]:text-[14px] lg:text-[15px] xl:text-[15.5px] px-3 min-[375px]:px-3.5 sm:px-5 md:px-4 min-[820px]:px-5 lg:px-6 xl:px-7 py-2.5 md:py-3 rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 xl:w-5 xl:h-5 stroke-[2.2]" />
              </button>
            </form>

            {/* 3 Feature Checkmarks with bright, readable pill badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 md:gap-x-3.5 min-[820px]:gap-x-4.5 lg:gap-x-6 xl:gap-x-7 gap-y-2 pt-0.5">
              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/90 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-white/80 md:border-none shadow-xs md:shadow-none">
                <span className="w-4 h-4 md:w-4.5 md:h-4.5 xl:w-5 xl:h-5 rounded-full bg-[#16A34A] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 xl:w-3.5 xl:h-3.5 stroke-[3]" />
                </span>
                <span className="text-[12px] sm:text-[12.5px] md:text-[12px] min-[820px]:text-[13px] lg:text-[13.5px] xl:text-[14px] font-bold text-[#0F172A] whitespace-nowrap">
                  Purchase on your behalf
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/90 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-white/80 md:border-none shadow-xs md:shadow-none">
                <span className="w-4 h-4 md:w-4.5 md:h-4.5 xl:w-5 xl:h-5 rounded-full bg-[#16A34A] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 xl:w-3.5 xl:h-3.5 stroke-[3]" />
                </span>
                <span className="text-[12px] sm:text-[12.5px] md:text-[12px] min-[820px]:text-[13px] lg:text-[13.5px] xl:text-[14px] font-bold text-[#0F172A] whitespace-nowrap">
                  Combine multiple orders
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/90 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-white/80 md:border-none shadow-xs md:shadow-none">
                <span className="w-4 h-4 md:w-4.5 md:h-4.5 xl:w-5 xl:h-5 rounded-full bg-[#16A34A] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 xl:w-3.5 xl:h-3.5 stroke-[3]" />
                </span>
                <span className="text-[12px] sm:text-[12.5px] md:text-[12px] min-[820px]:text-[13px] lg:text-[13.5px] xl:text-[14px] font-bold text-[#0F172A] whitespace-nowrap">
                  Ship worldwide
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: HTML Hero Banner Section */}

      {/* Request a Product from Another Platform (External Purchase Request Section) */}
      <section className="w-full px-3 sm:px-6 md:px-7 lg:px-12 pt-6 bg-white">
        <CustomerExternalPlatformRequestPortal />
      </section>

      {/* BEGIN: Top Online Stores Section matching stitch clone */}
      <section className="w-full px-3 sm:px-6 md:px-7 lg:px-12 py-5 sm:py-6 md:py-7 lg:py-8 bg-white border-b border-slate-100">
        <div className="relative bg-gradient-to-br from-[#EEF5FF] via-white to-[#F0F7FF] rounded-2xl sm:rounded-3xl border-2 border-[#CFE0FF] px-3.5 py-5 sm:px-6 md:px-7 lg:px-8 sm:py-6 md:py-7 shadow-[0_12px_36px_-10px_rgba(13,89,242,0.15)] overflow-hidden">
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-400/10 blur-3xl" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0D59F2]/10 border border-[#0D59F2]/20 text-[#0D59F2] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-2 max-w-full">
                <span className="w-2 h-2 rounded-full bg-[#0D59F2] animate-pulse shrink-0" />
                <span className="truncate">Direct Official Store Links • 100+ Brands</span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-[25px] lg:text-[26px] font-extrabold text-[#0B1940] tracking-tight md:whitespace-nowrap">
                Shop from India&apos;s Top Online Stores
              </h2>
              <p className="text-xs sm:text-sm md:text-[14px] text-slate-600 mt-1">
                Click any store logo below to open its official website, browse products, and copy the product link for global delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('stores')}
              className="hidden sm:inline-flex self-center shrink-0 items-center justify-center gap-2 bg-[#0D59F2] hover:bg-[#0047D4] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-[0_4px_14px_rgba(13,89,242,0.3)] hover:shadow-[0_6px_20px_rgba(13,89,242,0.4)] transition-all cursor-pointer group whitespace-nowrap"
            >
              <span>And many more...</span>
              <span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">100+</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Animated Infinite Carousel of Store Logos */}
          <div className="relative z-10 w-full overflow-hidden py-2">
            {/* Soft Left & Right Edge Gradient Fade Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 md:w-12 lg:w-16 bg-gradient-to-r from-[#EEF5FF] to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 md:w-12 lg:w-16 bg-gradient-to-l from-[#F0F7FF] to-transparent z-20" />

            <div className="animate-stores-carousel gap-4 sm:gap-5">
              {[0, 1].map((loopIdx) => (
                <div key={loopIdx} className="flex items-center gap-4 sm:gap-5 shrink-0">
                  {/* 1. Amazon.in */}
                  <a
                    href="https://www.amazon.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FF9900] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(255,153,0,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Amazon.in official website"
                  >
                    <img
                      src="/assets/store-amazon-mark.png"
                      alt="Amazon.in"
                      className="h-7 sm:h-9 w-auto max-w-[130px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FF9900] mt-1 transition-colors">
                      amazon.in ↗
                    </span>
                  </a>

                  {/* 2. Myntra */}
                  <a
                    href="https://www.myntra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FF3F6C] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(255,63,108,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Myntra official website"
                  >
                    <img
                      src="/assets/store-myntra-mark.png"
                      alt="Myntra"
                      className="h-7 sm:h-9 w-auto max-w-[130px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FF3F6C] mt-1 transition-colors">
                      myntra.com ↗
                    </span>
                  </a>

                  {/* 3. Flipkart */}
                  <a
                    href="https://www.flipkart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#2874F0] flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(40,116,240,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Flipkart official website"
                  >
                    <img
                      src="/assets/store-flipkart-mark.png"
                      alt="Flipkart"
                      className="h-7 sm:h-9 w-auto max-w-[130px] object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2874F0] mt-1 transition-colors">
                      flipkart.com ↗
                    </span>
                  </a>

                  {/* 4. TATA CLiQ */}
                  <a
                    href="https://www.tatacliq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#DA1C5C] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(218,28,92,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
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
                      tatacliq.com ↗
                    </span>
                  </a>

                  {/* 5. AJIO */}
                  <a
                    href="https://www.ajio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#2C4152] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(44,65,82,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit AJIO official website"
                  >
                    <span className="text-2xl font-black tracking-[0.16em] text-[#0c2340] group-hover:scale-105 transition-transform leading-none">
                      AJIO
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2C4152] mt-2 transition-colors">
                      ajio.com ↗
                    </span>
                  </a>

                  {/* 6. NYKAA */}
                  <a
                    href="https://www.nykaa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#FC2779] flex flex-col items-center justify-center px-4 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(252,39,121,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit NYKAA official website"
                  >
                    <span className="text-2xl font-black italic tracking-tighter text-[#fc2779] -skew-x-6 drop-shadow-2xs group-hover:scale-105 transition-transform leading-none">
                      NYKAA
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FC2779] mt-2 transition-colors">
                      nykaa.com ↗
                    </span>
                  </a>

                  {/* 7. bigbasket */}
                  <a
                    href="https://www.bigbasket.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#84C225] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(132,194,37,0.28)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit bigbasket official website"
                  >
                    <div className="flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                      <div className="w-6 h-6 rounded-md bg-[#84c225] flex items-center justify-center text-[#e52d38] font-black text-xs leading-none shadow-xs">
                        bb
                      </div>
                      <span className="text-base font-extrabold text-[#222222] tracking-tight">bigbasket</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#65A30D] mt-1.5 transition-colors">
                      bigbasket.com ↗
                    </span>
                  </a>

                  {/* 8. Fabindia */}
                  <a
                    href="https://www.fabindia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#8B1E24] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(139,30,36,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Fabindia official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-11.png" alt="Fabindia" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#8B1E24] tracking-tight font-serif">Fabindia</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#8B1E24] mt-1.5 transition-colors">
                      fabindia.com ↗
                    </span>
                  </a>

                  {/* 9. Manyavar */}
                  <a
                    href="https://www.manyavar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#991B1B] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(153,27,27,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Manyavar official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-12.png" alt="Manyavar" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#991B1B] tracking-tight">Manyavar</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#991B1B] mt-1.5 transition-colors">
                      manyavar.com ↗
                    </span>
                  </a>

                  {/* 10. Tanishq */}
                  <a
                    href="https://www.tanishq.co.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#881337] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(136,19,55,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Tanishq official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-51.png" alt="Tanishq" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#881337] tracking-widest uppercase">TANISHQ</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#881337] mt-1.5 transition-colors">
                      tanishq.co.in ↗
                    </span>
                  </a>

                  {/* 11. FirstCry */}
                  <a
                    href="https://www.firstcry.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#F97316] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(249,115,22,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit FirstCry official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-93.png" alt="FirstCry" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#EA580C] tracking-tight">firstcry</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#F97316] mt-1.5 transition-colors">
                      firstcry.com ↗
                    </span>
                  </a>

                  {/* 12. Croma */}
                  <a
                    href="https://www.croma.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#0D9488] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(13,148,136,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Croma official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-61.png" alt="Croma" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-black text-[#111827] tracking-wide">croma</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0D9488] mt-1.5 transition-colors">
                      croma.com ↗
                    </span>
                  </a>

                  {/* 13. Meesho */}
                  <a
                    href="https://www.meesho.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#F43397] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(244,51,151,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Meesho official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-5.png" alt="Meesho" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#F43397] tracking-tight">meesho</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#F43397] mt-1.5 transition-colors">
                      meesho.com ↗
                    </span>
                  </a>

                  {/* 14. Haldiram's */}
                  <a
                    href="https://www.haldirams.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[138px] min-[375px]:w-[148px] sm:w-[195px] h-[68px] sm:h-[84px] bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#DC2626] flex flex-col items-center justify-center px-3 py-2 shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
                    title="Visit Haldiram's official website"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <img src="/assets/brands/brand-91.png" alt="Haldiram's" className="w-6 h-6 object-contain rounded-sm" />
                      <span className="text-base font-extrabold text-[#DC2626] tracking-tight">Haldiram&apos;s</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#DC2626] mt-1.5 transition-colors">
                      haldirams.com ↗
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Bottom Button to explore all stores */}
          <div className="mt-4 sm:hidden flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate('stores')}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0D59F2] hover:bg-[#0047D4] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <span>Explore 100+ More Indian Stores</span>
              <span className="text-[10.5px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">100+</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
      {/* END: Top Online Stores Section */}

      {/* BEGIN: How It Works Section */}
      <section id="how-it-works" className="w-full px-3 sm:px-6 md:px-10 lg:px-12 py-6 md:py-8 bg-white border-b border-slate-100">
        <div className="bg-[#f0f7ff] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-blue-100/80">
          {/* Header */}
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-[#0B1940] tracking-tight">
              How It Works
            </h2>
            <span className="text-xs sm:text-sm md:text-base text-slate-500 font-normal">
              Get your favorite products from India in 6 simple steps
            </span>
          </div>

          {/* Step Buttons Row: 2 cols on mobile, 3 cols on tablet, 6-step row on lg+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row items-stretch lg:items-start justify-between gap-3 sm:gap-6 lg:gap-1.5 xl:gap-2">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => {
                const canvas = document.getElementById('viewport-canvas');
                if (canvas) canvas.scrollTo({ top: 0, behavior: 'smooth' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                if (input) input.focus();
                else onStartBuyForMe();
              }}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#165dfc] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  1
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                Paste the Link
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                Share the product link<br className="hidden xl:inline" /> from any Indian website
              </p>
            </button>

            {/* Connecting Arrow */}
            <div className="hidden lg:flex items-center justify-center pt-5 xl:pt-7 text-slate-300 shrink-0">
              <svg className="w-4 h-4 xl:w-6 xl:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 7h8" />
                  <path d="M8 11h8" />
                  <path d="M8 15h5" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#16a34a] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  2
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                Get a Quote
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                We review and<br className="hidden xl:inline" /> share the total cost
              </p>
            </button>

            {/* Connecting Arrow */}
            <div className="hidden lg:flex items-center justify-center pt-5 xl:pt-7 text-slate-300 shrink-0">
              <svg className="w-4 h-4 xl:w-6 xl:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#16a34a] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  3
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                We Purchase It
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                Our team buys it<br className="hidden xl:inline" /> on your behalf
              </p>
            </button>

            {/* Connecting Arrow */}
            <div className="hidden lg:flex items-center justify-center pt-5 xl:pt-7 text-slate-300 shrink-0">
              <svg className="w-4 h-4 xl:w-6 xl:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 4 */}
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 12v10" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#165dfc] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  4
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                We Receive It
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                Items arrive at<br className="hidden xl:inline" /> our Indian warehouse
              </p>
            </button>

            {/* Connecting Arrow */}
            <div className="hidden lg:flex items-center justify-center pt-5 xl:pt-7 text-slate-300 shrink-0">
              <svg className="w-4 h-4 xl:w-6 xl:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 5 */}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#dbeafe] text-[#165dfc] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <circle cx="17" cy="15" r="1" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#165dfc] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  5
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                We Consolidate It
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[170px]">
                Combine multiple orders<br className="hidden xl:inline" /> to save on shipping
              </p>
            </button>

            {/* Connecting Arrow */}
            <div className="hidden lg:flex items-center justify-center pt-5 xl:pt-7 text-slate-300 shrink-0">
              <svg className="w-4 h-4 xl:w-6 xl:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 6 */}
            <button
              type="button"
              onClick={() => onNavigate('countries')}
              className="group flex flex-col items-center text-center flex-1 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 hover:shadow-xs transition-all cursor-pointer min-w-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center mb-2.5 sm:mb-3 xl:mb-4 transition-transform group-hover:scale-108 group-active:scale-95 shadow-xs">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16.5 9.4 7.55 4.24" />
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
                <span className="absolute top-0 right-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#e11d48] text-white text-[11px] xl:text-xs font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  6
                </span>
              </div>
              <h3 className="text-[12px] sm:text-[13.5px] xl:text-[15px] font-bold text-[#0B1940] lg:whitespace-nowrap group-hover:text-[#0066FF] transition-colors mb-1 leading-tight">
                We Ship Worldwide
              </h3>
              <p className="text-[11px] xl:text-[12.5px] text-slate-500 leading-snug max-w-[160px]">
                Fast and reliable<br className="hidden xl:inline" /> delivery to your country
              </p>
            </button>
          </div>
        </div>
      </section>
      {/* END: How It Works Section */}

      {/* BEGIN: Popular Categories Section matching stitch clone */}
      <section className="w-full px-3 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-8 md:py-10 bg-white border-b border-slate-100">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Popular Categories</h2>
          <button
            type="button"
            onClick={() => onNavigate('stores')}
            className="text-xs sm:text-sm font-bold text-[#0066FF] hover:text-[#0052cc] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <span>View All Categories</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {/* Category 1: Fashion */}
          <div
            onClick={() => handleSelectCategoryCard('Fashion')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-rose-50/30 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Fashion Saree"
                className="w-full h-full object-cover rounded-xl object-center group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-fashion.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[12px] sm:text-[14px] lg:text-[12.5px] xl:text-[14px] font-bold text-[#0B1940] leading-tight group-hover:text-[#0066FF] transition-colors">
                Fashion
              </span>
            </div>
          </div>

          {/* Category 2: Electronics */}
          <div
            onClick={() => handleSelectCategoryCard('Electronics')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-slate-100/50 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Electronics Headphones"
                className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-electronics.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[12px] sm:text-[14px] lg:text-[12.5px] xl:text-[14px] font-bold text-[#0B1940] leading-tight group-hover:text-[#0066FF] transition-colors">
                Electronics
              </span>
            </div>
          </div>

          {/* Category 3: Home & Living */}
          <div
            onClick={() => handleSelectCategoryCard('Home & Living')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-amber-50/30 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Home and Living Sofa"
                className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-home.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[12px] sm:text-[14px] lg:text-[12.5px] xl:text-[14px] font-bold text-[#0B1940] leading-tight group-hover:text-[#0066FF] transition-colors">
                Home &amp; Living
              </span>
            </div>
          </div>

          {/* Category 4: Beauty & Personal Care */}
          <div
            onClick={() => handleSelectCategoryCard('Beauty & Personal Care')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-pink-50/30 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Beauty & Personal Care"
                className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-beauty.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[11px] sm:text-[12.5px] lg:text-[11px] xl:text-[13px] font-bold text-[#0B1940] leading-tight tracking-tight group-hover:text-[#0066FF] transition-colors">
                Beauty &amp; Personal Care
              </span>
            </div>
          </div>

          {/* Category 5: Books */}
          <div
            onClick={() => handleSelectCategoryCard('Books')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-orange-50/30 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Books Atomic Habits and Ikigai"
                className="w-full h-full object-cover rounded-xl object-bottom group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-books.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[12px] sm:text-[14px] lg:text-[12.5px] xl:text-[14px] font-bold text-[#0B1940] leading-tight group-hover:text-[#0066FF] transition-colors">
                Books
              </span>
            </div>
          </div>

          {/* Category 6: Health & Wellness */}
          <div
            onClick={() => handleSelectCategoryCard('Health & Wellness')}
            className="group flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="h-28 sm:h-36 w-full overflow-hidden bg-emerald-50/30 flex items-center justify-center p-1.5 sm:p-2">
              <img
                alt="Health & Wellness"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                src="/assets/stitch-cat-wellness.jpg"
              />
            </div>
            <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center bg-white border-t border-slate-100/80 flex items-center justify-center min-h-[42px]">
              <span className="text-[11.5px] sm:text-[13.5px] lg:text-[12px] xl:text-[14px] font-bold text-[#0B1940] leading-tight group-hover:text-[#0066FF] transition-colors">
                Health &amp; Wellness
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* END: Popular Categories Section */}

      {/* BEGIN: Featured Indian Product Catalogue Section */}
      <section
        id="product-catalogue"
        className="w-full px-3 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-10 bg-slate-50/60 border-b border-slate-100"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0066FF] text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <ShoppingBag className="w-3 h-3" />
              <span>Indian Product Catalogue • Live Currency ({currencyInfo.code})</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#0B1940] tracking-tight">
              Trending Products from Indian Stores
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Select any item below to start an Assisted Purchase order or copy its product link into the Buy For Me bar.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCurrencyModal}
            className="self-start sm:self-end text-xs font-bold text-[#0066FF] hover:underline cursor-pointer shrink-0"
          >
            Displaying prices in {selectedCurrency} (Change)
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          {CATALOGUE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCatalogueCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeCatalogueCategory === cat
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Catalogue Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredCatalogue.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-28 min-[375px]:h-34 sm:h-44 w-full bg-slate-50 p-2 sm:p-3 flex items-center justify-center overflow-hidden border-b border-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain rounded-md sm:rounded-lg hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span
                    className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8.5px] min-[375px]:text-[9.5px] sm:text-[10px] font-extrabold text-white shadow-2xs truncate max-w-[85px] sm:max-w-none"
                    style={{ backgroundColor: item.storeColor }}
                  >
                    {item.storeName}
                  </span>
                  <span className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] min-[375px]:text-[9.5px] sm:text-[10px] font-bold bg-white/95 text-slate-600 border border-slate-200">
                    {item.weightKg} kg
                  </span>
                </div>

                <div className="p-2.5 sm:p-4">
                  <span className="text-[9px] min-[375px]:text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <h3 className="text-[11.5px] min-[375px]:text-xs sm:text-sm font-bold text-[#0B1940] mt-0.5 line-clamp-2 min-h-[30px] sm:min-h-[40px] leading-tight">
                    {item.name}
                  </h3>

                  <div className="mt-1.5 sm:mt-2.5 flex items-baseline justify-between gap-1 flex-wrap">
                    <div>
                      <span className="text-sm min-[375px]:text-base sm:text-lg font-extrabold text-[#0066FF]">
                        {formatINR(item.priceINR, selectedCurrency)}
                      </span>
                      {currencyInfo.code !== 'INR' && (
                        <span className="text-[9.5px] sm:text-[11px] text-slate-400 block sm:inline sm:ml-1.5">
                          (₹{item.priceINR.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-2 pb-2.5 sm:px-4 sm:pb-4 pt-1.5 border-t border-slate-100 flex flex-col min-[420px]:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onStartBuyForMe(item.productUrl)}
                  className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-colors cursor-pointer text-center whitespace-nowrap"
                >
                  Buy For Me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductUrl(item.productUrl);
                    const canvas = document.getElementById('viewport-canvas');
                    if (canvas) canvas.scrollTo({ top: 0, behavior: 'smooth' });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="Paste this product URL into the search bar"
                  className="py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10.5px] sm:text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  <span>Use Link</span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* END: Featured Indian Product Catalogue Section */}

      {/* BEGIN: Interactive International Shipping Calculator Section */}
      <section
        id="shipping-calculator"
        className="w-full px-3 sm:px-6 md:px-10 lg:px-12 py-8 sm:py-10 bg-white"
      >
        <div className="bg-gradient-to-br from-[#F8FAFF] via-white to-[#EEF5FF] rounded-2xl sm:rounded-3xl border border-blue-200/80 p-4 sm:p-7 md:p-9 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0066FF] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Real-Time International Shipping Calculator</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-[#0B1940] tracking-tight">
                Estimate Your Worldwide Delivery Cost
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Enter your destination country, weight, and box dimensions to calculate instant DHL / FedEx / Aramex rates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="self-start sm:self-center text-xs sm:text-sm font-bold text-[#0066FF] hover:text-[#0052cc] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Full Rate Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Controls */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Destination Country
                  </label>
                  <select
                    aria-label="Calculator Destination Country"
                    value={calcCountry}
                    onChange={(e) => setCalcCountry(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                  >
                    {countriesList.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name} ({c.transitDays})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Shipping Speed
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCalcServiceTier('express')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        calcServiceTier === 'express'
                          ? 'bg-white text-[#0066FF] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Express (2-5d)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcServiceTier('economy')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        calcServiceTier === 'economy'
                          ? 'bg-white text-[#0066FF] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Economy (5-8d)
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight Slider + Number Input */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Package Weight (kg):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      aria-label="Calculator package weight in kg"
                      min="0.5"
                      max="50"
                      step="0.5"
                      value={calcWeightKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0.5) setCalcWeightKg(Math.min(50, val));
                      }}
                      className="w-20 px-2.5 py-1 border border-slate-200 rounded-lg text-right font-extrabold text-[#0066FF] text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                    <span className="text-xs font-bold text-slate-600">kg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  value={Math.min(25, calcWeightKg)}
                  onChange={(e) => setCalcWeightKg(parseFloat(e.target.value))}
                  className="w-full accent-[#0066FF] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0.5 kg</span>
                  <span>10 kg</span>
                  <span>25 kg</span>
                </div>
              </div>

              {/* Dimensions & Consolidation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={calcLengthCm}
                    onChange={(e) => setCalcLengthCm(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={calcWidthCm}
                    onChange={(e) => setCalcWidthCm(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={calcHeightCm}
                    onChange={(e) => setCalcHeightCm(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">
                    Orders Combined
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={calcBoxesCount}
                    onChange={(e) => setCalcBoxesCount(Math.max(1, Math.min(15, Number(e.target.value) || 1)))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Right Estimate Summary */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0066FF] to-[#0B1940] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-lg">
              <div>
                <div className="flex items-center justify-between text-xs text-blue-200 font-bold uppercase tracking-wider">
                  <span>Estimated Shipping Rate</span>
                  <span>{selectedCountryObj.flag} {selectedCountryObj.code}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold">
                    {formatUSD(shippingTotalUSD, selectedCurrency)}
                  </span>
                  <span className="text-xs font-semibold text-blue-200">{currencyInfo.code}</span>
                </div>

                <div className="text-xs text-blue-200 mt-1 space-x-2">
                  <span>${shippingTotalUSD} USD</span>
                  <span>•</span>
                  <span>₹{shippingTotalINR.toLocaleString('en-IN')} INR</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-blue-100 border-t border-white/15 pt-3.5">
                <div className="flex justify-between">
                  <span>Chargeable Weight:</span>
                  <strong className="text-white">{chargeableWeightKg} kg</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Transit Time:</span>
                  <strong className="text-white">
                    {calcServiceTier === 'express' ? selectedCountryObj.transitDays : '5 - 8 days'}
                  </strong>
                </div>
                {consolidationSavingsUSD > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Consolidation Savings ({calcBoxesCount} boxes):</span>
                    <strong>Save {formatUSD(consolidationSavingsUSD, selectedCurrency)}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onStartBuyForMe()}
                className="w-full py-3 bg-white hover:bg-blue-50 text-[#0066FF] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors text-center cursor-pointer"
              >
                Start Order to {selectedCountryObj.name}
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* END: Interactive International Shipping Calculator Section */}
    </div>
  );
};
