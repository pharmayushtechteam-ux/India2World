import React from 'react';
import {
  Link2,
  Receipt,
  ShoppingCart,
  Package,
  Layers,
  Send,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Page } from '../../types';

interface HowItWorksPageProps {
  onNavigate: (page: Page) => void;
  onStartBuyForMe: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate, onStartBuyForMe }) => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
          Two Easy Ways to Shop
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How India2World Works
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Whether you want us to buy on your behalf or prefer using your personal Indian locker address, we ensure safe worldwide delivery.
        </p>
      </div>

      {/* Comparison Cards: Option A vs Option B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Method 1: Buy For Me */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border-2 border-blue-200 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0066FF] flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-[#0066FF] uppercase tracking-wider">
                Method 1
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                Buy For Me (Assisted)
              </h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Best when Indian merchants reject foreign credit cards, OTP verification, or international billing addresses.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>You paste product URLs from any Indian website.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>We purchase the items using domestic Indian payment methods.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>We inspect quality, take photos, and consolidate multiple orders.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onStartBuyForMe}
            className="w-full py-3.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm rounded-xl shadow-md transition-colors"
          >
            Create Buy For Me Request
          </button>
        </div>

        {/* Method 2: Indian Locker Address */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                Method 2
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                Personal Indian Locker
              </h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Best if you already have an Indian payment method or merchant accounts and want to shop directly.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Get a dedicated Mumbai warehouse address with your locker ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Use it as your delivery address on Amazon, Myntra, Flipkart.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Enjoy 30 days of free warehouse storage while items arrive.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-colors"
          >
            View My Locker Address
          </button>
        </div>
      </div>
    </div>
  );
};
