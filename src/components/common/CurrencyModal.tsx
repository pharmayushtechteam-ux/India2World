import React from 'react';
import { X, Check, Globe } from 'lucide-react';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelectCurrency: (curr: string) => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  selectedCurrency,
  onSelectCurrency,
}) => {
  if (!isOpen) return null;

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee (Default)', flag: '🇮🇳' },
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0066FF]" />
            <h3 className="font-bold text-slate-900 text-lg">Display Currency</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-1.5 max-h-96 overflow-y-auto">
          {currencies.map((c) => {
            const isSelected = selectedCurrency.startsWith(c.code);
            return (
              <button
                key={c.code}
                onClick={() => {
                  onSelectCurrency(`${c.code} (${c.symbol})`);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border border-blue-200 text-[#0066FF] font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <div className="text-sm">
                      {c.name} <span className="font-bold">({c.symbol})</span>
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#0066FF]" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Exchange rates are updated daily for accurate quotation estimates.
        </div>
      </div>
    </div>
  );
};
