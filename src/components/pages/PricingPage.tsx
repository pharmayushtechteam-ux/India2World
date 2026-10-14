import React, { useState } from 'react';
import { Calculator, ArrowRight, ShieldCheck, Check, Sparkles, Truck } from 'lucide-react';
import { countriesList } from '../../data/mockData';
import { Page } from '../../types';

interface PricingPageProps {
  onNavigate: (page: Page) => void;
  onStartBuyForMe: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, onStartBuyForMe }) => {
  const [selectedCountry, setSelectedCountry] = useState(countriesList[0].name);
  const [weightKg, setWeightKg] = useState<number>(2.0);

  const country = countriesList.find((c) => c.name === selectedCountry) || countriesList[0];

  // Base calculation
  const baseRateUSD = country.startingRateUSD;
  const perKgRateUSD = 8.5;
  const shippingTotalUSD = Math.round(baseRateUSD + (weightKg - 0.5) * perKgRateUSD);
  const shippingTotalINR = Math.round(shippingTotalUSD * 86.5);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
          Transparent International Shipping Rates
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Shipping Rate Calculator
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Get real-time estimates for courier delivery from Mumbai directly to your international doorstep.
        </p>
      </div>

      {/* Interactive Calculator Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-100 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Destination Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-800"
              >
                {countriesList.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Estimated Package Weight:
                </label>
                <span className="font-extrabold text-[#0066FF] text-sm">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full accent-[#0066FF] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.5 kg (Small parcel)</span>
                <span>10 kg</span>
                <span>25 kg (Bulk order)</span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Carrier Speed:</span>
                <strong className="text-slate-900">{country.transitDays}</strong>
              </div>
              <div className="flex justify-between">
                <span>Free Storage Included:</span>
                <strong className="text-emerald-700 font-bold">30 Days</strong>
              </div>
              <div className="flex justify-between">
                <span>Consolidation Discount:</span>
                <strong className="text-emerald-700 font-bold">Up to 80% Saved</strong>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-200">
                Estimated Express Air Rate
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold">${shippingTotalUSD}</span>
                <span className="text-blue-200 text-sm font-semibold">USD</span>
              </div>
              <span className="text-xs text-blue-200 block mt-1">
                Approx. ₹{shippingTotalINR.toLocaleString('en-IN')} INR
              </span>
            </div>

            <div className="space-y-2 text-xs text-blue-100 border-t border-blue-400/30 pt-4">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Doorstep delivery via DHL / FedEx / Aramex</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full online tracking & delivery confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Export customs manifest documentation included</span>
              </div>
            </div>

            <button
              onClick={onStartBuyForMe}
              className="w-full py-3 bg-white hover:bg-blue-50 text-[#0066FF] font-extrabold text-sm rounded-xl shadow-md transition-colors text-center"
            >
              Start Order for {country.name}
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Service Fees Table */}
      <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 max-w-4xl mx-auto space-y-6">
        <h3 className="font-extrabold text-slate-900 text-2xl text-center">
          Transparent Service Fees
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-base">Buy For Me (Assisted)</h4>
            <div className="text-2xl font-extrabold text-[#0066FF]">6%</div>
            <p className="text-xs text-slate-500">
              Minimum ₹250. We handle payment to Indian merchants, verify authentic products, and resolve stock issues.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-base">Indian Locker Address</h4>
            <div className="text-2xl font-extrabold text-emerald-600">FREE</div>
            <p className="text-xs text-slate-500">
              No setup fee or monthly membership. Use your personal Mumbai address at checkout across any Indian store.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-base">Repackaging & Photos</h4>
            <div className="text-2xl font-extrabold text-emerald-600">FREE</div>
            <p className="text-xs text-slate-500">
              We remove unnecessary merchant packaging and take high-resolution verification photos at no extra cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
