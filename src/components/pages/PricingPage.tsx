import React, { useState } from 'react';
import { Calculator, ArrowRight, Check, Package, Scale } from 'lucide-react';
import { countriesList } from '../../data/mockData';
import { Page } from '../../types';
import { formatUSD, formatINR, getCurrencyInfo } from '../../utils/currency';

interface PricingPageProps {
  onNavigate: (page: Page) => void;
  onStartBuyForMe: () => void;
  selectedCurrency?: string;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onNavigate,
  onStartBuyForMe,
  selectedCurrency = 'INR (₹)',
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countriesList[0].name);
  const [weightKg, setWeightKg] = useState<number>(2.0);
  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(22);
  const [heightCm, setHeightCm] = useState<number>(14);
  const [packagesToConsolidate, setPackagesToConsolidate] = useState<number>(2);
  const [serviceTier, setServiceTier] = useState<'express' | 'economy'>('express');

  const country = countriesList.find((c) => c.name === selectedCountry) || countriesList[0];
  const currencyInfo = getCurrencyInfo(selectedCurrency);

  // Volumetric weight calculation (standard international air courier divisor: 5000)
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));
  const chargeableWeightKg = Math.max(0.5, Number(Math.max(weightKg, volumetricWeightKg).toFixed(2)));

  // Base calculation based on entered values
  const baseRateUSD = country.startingRateUSD;
  const perKgRateUSD = serviceTier === 'express' ? 8.5 : 6.5;
  const tierMultiplier = serviceTier === 'express' ? 1 : 0.82;
  const rawShippingUSD = (baseRateUSD + Math.max(0, chargeableWeightKg - 0.5) * perKgRateUSD) * tierMultiplier;
  const shippingTotalUSD = Math.max(5, Math.round(rawShippingUSD));
  const shippingTotalINR = Math.round(shippingTotalUSD * 86.5);
  const consolidationSavingsUSD = Math.max(0, (packagesToConsolidate - 1) * Math.round(baseRateUSD * 0.75));

  return (
    <div className="w-full px-3.5 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-10 space-y-10 sm:space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
          Transparent International Shipping Rates
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Shipping Rate Calculator
        </h1>
        <p className="text-slate-600 text-xs sm:text-base">
          Get real-time estimates for courier delivery from Mumbai directly to your international doorstep in{' '}
          <strong className="text-[#0066FF]">{currencyInfo.code} ({currencyInfo.symbol.trim()})</strong>.
        </p>
      </div>

      {/* Interactive Calculator Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-lg border border-slate-100 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-5">
            {/* Country & Service Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Destination Country
                </label>
                <select
                  aria-label="Destination Country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2.5 sm:p-3 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                >
                  {countriesList.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Courier Service Speed
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setServiceTier('express')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      serviceTier === 'express'
                        ? 'bg-white text-[#0066FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Express Air
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTier('economy')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      serviceTier === 'economy'
                        ? 'bg-white text-[#0066FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Economy Saver
                  </button>
                </div>
              </div>
            </div>

            {/* Weight Slider + Direct Number Input */}
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Actual Package Weight (kg):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    aria-label="Package weight in kg"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0.5) setWeightKg(Math.min(50, v));
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
                value={Math.min(25, weightKg)}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full accent-[#0066FF] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0.5 kg (Small parcel)</span>
                <span>10 kg</span>
                <span>25 kg (Bulk order)</span>
              </div>
            </div>

            {/* Box Dimensions (L x W x H) & Packages Count */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min={5}
                  max={150}
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min={5}
                  max={150}
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min={5}
                  max={150}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Boxes Combined
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={packagesToConsolidate}
                  onChange={(e) => setPackagesToConsolidate(Math.max(1, Math.min(15, Number(e.target.value) || 1)))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Chargeable Weight (Max of Actual {weightKg}kg vs Volumetric {volumetricWeightKg}kg):</span>
                <strong className="text-[#0066FF]">{chargeableWeightKg} kg</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Transit Speed:</span>
                <strong className="text-slate-900">
                  {serviceTier === 'express' ? country.transitDays : '5 - 8 days'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Free Storage Included:</span>
                <strong className="text-emerald-700 font-bold">30 Days Free</strong>
              </div>
              {consolidationSavingsUSD > 0 && (
                <div className="flex justify-between">
                  <span>Multi-Store Consolidation Savings ({packagesToConsolidate} parcels):</span>
                  <strong className="text-emerald-700 font-bold">
                    Save ~{formatUSD(consolidationSavingsUSD, selectedCurrency)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Results Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-200">
                Estimated {serviceTier === 'express' ? 'Express Air' : 'Economy Saver'} Rate
              </span>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-5xl font-extrabold">
                  {formatUSD(shippingTotalUSD, selectedCurrency)}
                </span>
                <span className="text-blue-200 text-xs sm:text-sm font-semibold">
                  {currencyInfo.code}
                </span>
              </div>
              <div className="text-xs text-blue-200 mt-1.5 space-x-2">
                <span>≈ ${shippingTotalUSD} USD</span>
                <span>•</span>
                <span>≈ ₹{shippingTotalINR.toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-blue-100 border-t border-blue-400/30 pt-4">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Doorstep delivery via DHL / FedEx / Aramex</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full online tracking &amp; delivery confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Export customs manifest documentation included</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartBuyForMe}
              className="w-full py-3 bg-white hover:bg-blue-50 text-[#0066FF] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors text-center cursor-pointer"
            >
              Start Order for {country.name}
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Service Fees Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs border border-slate-100 max-w-4xl mx-auto space-y-6">
        <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl text-center">
          Transparent Service Fees
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-base">Buy For Me (Assisted)</h4>
            <div className="text-2xl font-extrabold text-[#0066FF]">6%</div>
            <p className="text-xs text-slate-500">
              Minimum {formatINR(250, selectedCurrency)}. We handle payment to Indian merchants, verify authentic products, and resolve stock issues.
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
            <h4 className="font-extrabold text-slate-900 text-base">Repackaging &amp; Photos</h4>
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
