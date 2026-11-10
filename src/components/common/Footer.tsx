import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Truck, Globe2, ExternalLink } from 'lucide-react';
import { Page, DashboardTab } from '../../types';
import { openWhatsApp, WHATSAPP_DISPLAY_PHONE } from '../../utils/whatsapp';
import { WhatsAppIcon } from './WhatsAppChatWidget';

interface FooterProps {
  onNavigate: (page: Page, dashTab?: DashboardTab) => void;
  onOpenTrackModal?: () => void;
  onOpenCurrencyModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTrackModal }) => {
  return (
    <footer className="w-full bg-[#0B1933] text-slate-300 text-sm mt-10 sm:mt-16 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Top Accent Gradient Bar (Royal Blue + Saffron + Green logo theme) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0066FF] via-[#FF9933] to-[#22C55E]" />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-12 pb-16 sm:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-7 sm:gap-8 lg:gap-10 pb-8 sm:pb-10 border-b border-white/10">
          {/* Brand Info & Mission */}
          <div className="sm:col-span-2 md:col-span-5 space-y-3.5">
            <div className="bg-white px-3.5 py-1.5 rounded-xl inline-flex items-center shadow-xs">
              <Logo size="md" onClick={() => onNavigate('home')} />
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
              Your trusted cross-border shopping partner. Purchase from any Indian online store, consolidate packages, and ship worldwide with express courier delivery.
            </p>

            {/* Direct WhatsApp Callout */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    'Hello BoxMyIndia team! I would like to inquire about international shipping and shopping from India.',
                    '919747023382'
                  )
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 transition-all font-bold text-xs cursor-pointer shadow-xs active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>WhatsApp: {WHATSAPP_DISPLAY_PHONE}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>220+ Countries</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>DHL • FedEx • Aramex</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% Inspected</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2">
            <h5 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
              <span>Explore</span>
            </h5>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('request-external-purchase')}
                  className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer text-left"
                >
                  Request a Product from Another Platform
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Pricing & Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('countries')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Countries Served
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('stores')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Indian Stores
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1 md:col-span-2">
            <h5 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
              <span>Services</span>
            </h5>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('request-external-purchase')}
                  className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer text-left"
                >
                  Request a Product from Another Platform
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('buy-for-me')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Buy For Me
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'my-warehouse')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Personal Locker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', 'consolidation')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Package Consolidation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTrackModal || (() => onNavigate('track'))}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>Track Shipment</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Account */}
          <div className="sm:col-span-2 md:col-span-3">
            <h5 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span>Support & Account</span>
            </h5>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('request-external-purchase')}
                  className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer text-left"
                >
                  Request a Product from Another Platform
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Help Centre & FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Customer Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="hover:text-white transition-colors cursor-pointer text-left text-blue-400 font-semibold"
                >
                  Sign In / Create Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      'Hello BoxMyIndia support team! I need assistance with shipping/shopping from India.',
                      '919747023382'
                    )
                  }
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>WhatsApp Chat Support</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and legal */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} BoxMyIndia. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-slate-400">
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Shipping Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
