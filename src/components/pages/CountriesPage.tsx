import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { countriesList } from '../../data/mockData';
import { Page } from '../../types';
import { formatUSD, getCurrencyInfo } from '../../utils/currency';

interface CountriesPageProps {
  onNavigate: (page: Page) => void;
  onStartBuyForMe: () => void;
  selectedCurrency?: string;
}

export const CountriesPage: React.FC<CountriesPageProps> = ({
  onStartBuyForMe,
  selectedCurrency = 'INR (₹)',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currencyInfo = getCurrencyInfo(selectedCurrency);

  const filtered = countriesList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-3.5 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
          Worldwide Coverage
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Delivering to 220+ Countries
        </h1>
        <p className="text-slate-600 text-xs sm:text-base">
          Find your country below to check estimated transit times and starting international shipping rates in{' '}
          <strong className="text-[#0066FF]">{currencyInfo.code}</strong>.
        </p>

        {/* Search input */}
        <div className="pt-3 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by country name or code..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#0066FF] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {filtered.map((c) => (
          <div
            key={c.code}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl sm:text-3xl shrink-0">{c.flag}</span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{c.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Code: {c.code} ({c.dial})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Air Transit:</span>
                  <strong className="text-slate-900">{c.transitDays}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Starting Rate:</span>
                  <strong className="text-[#0066FF] font-extrabold">
                    {formatUSD(c.startingRateUSD, selectedCurrency)} ({currencyInfo.code})
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartBuyForMe}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-[#0066FF] font-bold text-xs rounded-xl border border-slate-200 hover:border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Ship to {c.code}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
