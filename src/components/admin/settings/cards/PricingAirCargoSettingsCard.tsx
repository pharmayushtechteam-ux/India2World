import React, { useState } from 'react';
import { DollarSign, Percent, Calculator, Info, Check } from 'lucide-react';
import { AdminSettingsData, LEGACY_STORAGE_KEYS } from '../../../../services/adminSettingsService';

interface PricingAirCargoSettingsCardProps {
  settings: AdminSettingsData['pricing'];
  onSave: (data: AdminSettingsData['pricing']) => Promise<void>;
  isSaving: boolean;
}

export const PricingAirCargoSettingsCard: React.FC<PricingAirCargoSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['pricing']>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist legacy localStorage keys
    try {
      localStorage.setItem(LEGACY_STORAGE_KEYS.BUY_FOR_ME_FEE, String(formData.buyForMeHandlingFee));
      localStorage.setItem(LEGACY_STORAGE_KEYS.VOLUMETRIC_DIVISOR, String(formData.volumetricDivisor));
    } catch (err) {
      console.error(err);
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Pricing & Air Cargo Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Assisted purchase commission, volumetric weight divisor, freight tariffs, and taxes
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 5 of 12
          </span>
        </div>

        {/* Formula Info Callout */}
        <div className="mb-4 p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-start gap-2">
          <Calculator className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>IATA Standard Volumetric Rule:</strong> Chargeable Weight is calculated as{' '}
            <code className="px-1 py-0.5 bg-white/80 rounded font-mono font-bold text-[#0066FF]">
              Max(Actual Weight, (L × W × H in cm) / {formData.volumetricDivisor})
            </code>
          </div>
        </div>

        {/* Form Fields */}
        <form id="pricing-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Assisted Purchase Flat Handling Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.buyForMeHandlingFee}
                onChange={(e) => setFormData({ ...formData, buyForMeHandlingFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default fee per merchant order checkout</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Volumetric Weight Divisor (IATA)
              </label>
              <input
                type="number"
                min={1000}
                max={10000}
                value={formData.volumetricDivisor}
                onChange={(e) => setFormData({ ...formData, volumetricDivisor: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard international air cargo divisor: 5000</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Air Freight Base Rate (₹ / kg)
              </label>
              <input
                type="number"
                min={0}
                value={formData.baseShippingRatePerKg}
                onChange={(e) => setFormData({ ...formData, baseShippingRatePerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard economy international air freight rate</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Express Priority Surcharge (₹ / kg)
              </label>
              <input
                type="number"
                min={0}
                value={formData.expressPrioritySurcharge}
                onChange={(e) => setFormData({ ...formData, expressPrioritySurcharge: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Additional rate for priority express air couriers</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Fuel Surcharge (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step="0.5"
                value={formData.fuelSurchargePercent}
                onChange={(e) => setFormData({ ...formData, fuelSurchargePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Dynamic airline aviation fuel index fee</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quotation Validity Window (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.quotationValidityDays}
                onChange={(e) => setFormData({ ...formData, quotationValidityDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Days customer has to accept and pay issued quote</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Currency Conversion Buffer (%)
              </label>
              <input
                type="number"
                min={0}
                max={15}
                step="0.1"
                value={formData.currencyBufferPercent}
                onChange={(e) => setFormData({ ...formData, currencyBufferPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Protects against real-time Forex exchange fluctuations</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                India GST Tax Rate on Service (%)
              </label>
              <input
                type="number"
                min={0}
                max={28}
                value={formData.gstTaxPercent}
                onChange={(e) => setFormData({ ...formData, gstTaxPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard service tax rate (18% GST)</span>
            </div>
          </div>
        </form>
      </div>

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Formula synchronized across quote modules</span>
        <button
          type="submit"
          form="pricing-settings-form"
          disabled={isSaving}
          className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
