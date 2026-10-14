import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Truck, Globe2, Sparkles, Package, MapPin, Calculator, HelpCircle, ArrowRight } from 'lucide-react';
import { Page, DashboardTab } from '../../types';

interface FooterProps {
  onNavigate: (page: Page, dashTab?: DashboardTab) => void;
  onOpenTrackModal?: () => void;
  onOpenCurrencyModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTrackModal, onOpenCurrencyModal }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-16 pt-16 pb-12 text-slate-600 text-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 mb-12 border-b border-slate-100">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Worldwide Express Delivery</h4>
              <p className="text-slate-500 text-xs mt-1">
                Fast & reliable shipping to over 220+ countries via DHL, FedEx, and Aramex in 3-7 business days.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">100% Secure & Inspected</h4>
              <p className="text-slate-500 text-xs mt-1">
                Free 30-day warehouse storage, HD package photos, and damage inspection included.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Save up to 80% on Shipping</h4>
              <p className="text-slate-500 text-xs mt-1">
                Smart order consolidation combines multiple packages from different Indian stores into one box.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns covering ALL Webapp Pages */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2">
            <Logo size="md" onClick={() => onNavigate('home')} />
            <p className="mt-4 text-slate-500 text-sm max-w-sm leading-relaxed">
              Your gateway to shopping across Indian stores from anywhere in the world. We purchase, receive, inspect, consolidate, and ship straight to your doorstep.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                Shipping worldwide from Mumbai Hub, India
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Certified Export Partner • 220+ Countries Served
              </span>
            </div>
          </div>

          {/* Column 1: Core Services */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">
              Services
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('buy-for-me')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Buy For Me (Assisted)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'my-warehouse')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Personal Indian Locker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'consolidation')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Order Consolidation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Repackaging & Photos
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Explore Pages */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">
              Explore Pages
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Shipping Rates & Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('countries')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Countries Served (220+)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Dashboard & Account */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">
              Dashboard & Locker
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'overview')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Customer Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'my-warehouse')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  My Warehouse Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'my-requests')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  My Purchase Requests
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'shipments')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  My International Shipments
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer font-semibold text-[#0066FF]"
                >
                  Sign In / Create Account
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Tracking */}
          <div>
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">
              Support & Tools
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={onOpenTrackModal || (() => onNavigate('track'))}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>Track Shipment</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              </li>
              {onOpenCurrencyModal && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCurrencyModal}
                    className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                  >
                    Currency Converter
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Help Centre & FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Prohibited Items
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="hover:text-[#0066FF] transition-colors text-left cursor-pointer"
                >
                  Customs & Duties Guide
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and disclaimer */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} India2World. All rights reserved. Built for seamless cross-border shopping from India.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-600 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-600 cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-600 cursor-pointer"
            >
              Shipping Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
