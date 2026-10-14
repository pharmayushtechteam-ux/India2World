import React, { useState } from 'react';
import { Truck, Boxes, MapPin, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface ShippingTrackingSettingsCardProps {
  settings: AdminSettingsData['shippingTracking'];
  onSave: (data: AdminSettingsData['shippingTracking']) => Promise<void>;
  isSaving: boolean;
}

export const ShippingTrackingSettingsCard: React.FC<ShippingTrackingSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['shippingTracking']>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCarrierToggle = (key: keyof AdminSettingsData['shippingTracking']['carriers']) => {
    setFormData((prev: AdminSettingsData['shippingTracking']) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [key]: {
          ...prev.carriers[key],
          enabled: !prev.carriers[key].enabled,
        },
      },
    }));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Shipping & Tracking Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                International carriers, volumetric repack rules, parcel dimensions, and tracking telemetry
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 9 of 12
          </span>
        </div>

        {/* Integrated International Carriers Grid */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            International Air Freight Carriers & Transit SLAs
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'dhl', label: 'DHL Express Worldwide', sla: '2 - 4 Days' },
              { id: 'fedex', label: 'FedEx Priority Int.', sla: '3 - 5 Days' },
              { id: 'aramex', label: 'Aramex Global Priority', sla: '4 - 7 Days' },
              { id: 'ups', label: 'UPS Worldwide Expedited', sla: '3 - 6 Days' },
            ].map((carrier) => {
              const carrierData = formData.carriers[carrier.id as keyof typeof formData.carriers];
              const isEnabled = carrierData.enabled;
              return (
                <button
                  key={carrier.id}
                  type="button"
                  onClick={() => handleCarrierToggle(carrier.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isEnabled
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold leading-tight">{carrier.label}</div>
                    <div className="text-[10px] opacity-70 leading-tight">SLA: {carrier.sla}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <form id="shipping-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Consolidation Repack Strategy
              </label>
              <select
                value={formData.repackStrategy}
                onChange={(e) => setFormData({ ...formData, repackStrategy: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="discard_outer_box">Optimal (Discard merchant outer boxes to reduce volume)</option>
                <option value="original_box">Keep Original Packaging</option>
                <option value="box_in_box">Heavy-Duty Double Box (Fragile items)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Damaged Package Protocol
              </label>
              <select
                value={formData.damagedPackageProtocol}
                onChange={(e) => setFormData({ ...formData, damagedPackageProtocol: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="quarantine">Quarantine & send high-res photo report to customer</option>
                <option value="notify_only">Notify customer without quarantine hold</option>
                <option value="return_to_seller">Auto-initiate return to merchant</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Package Girth + Length (cm)
              </label>
              <input
                type="number"
                min={100}
                max={500}
                value={formData.maxPackageDimensionCm}
                onChange={(e) => setFormData({ ...formData, maxPackageDimensionCm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard courier dimensional limit (L + 2W + 2H)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Single Parcel Weight (kg)
              </label>
              <input
                type="number"
                min={1}
                max={70}
                value={formData.maxParcelWeightKg}
                onChange={(e) => setFormData({ ...formData, maxParcelWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Maximum single consignment weight before multi-box split</span>
            </div>
          </div>

          {/* Shipping Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Automated Live Tracking Milestones</div>
                <div className="text-[11px] text-slate-400">Pushes real-time status updates at Departure, Customs, and Out for Delivery</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoMilestoneEmails}
                  onChange={(e) => setFormData({ ...formData, autoMilestoneEmails: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Carrier rate calculators synchronized</span>
        <button
          type="submit"
          form="shipping-settings-form"
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
