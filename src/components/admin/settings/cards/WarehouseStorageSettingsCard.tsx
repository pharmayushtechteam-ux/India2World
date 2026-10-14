import React, { useState } from 'react';
import { Warehouse, Building, Clock, Camera, CheckSquare, Check, Shield } from 'lucide-react';
import { AdminSettingsData, LEGACY_STORAGE_KEYS } from '../../../../services/adminSettingsService';

interface WarehouseStorageSettingsCardProps {
  settings: AdminSettingsData['warehouse'];
  onSave: (data: AdminSettingsData['warehouse']) => Promise<void>;
  isSaving: boolean;
}

export const WarehouseStorageSettingsCard: React.FC<WarehouseStorageSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['warehouse']>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist to legacy localStorage keys
    try {
      localStorage.setItem(LEGACY_STORAGE_KEYS.WAREHOUSE_ADDRESS, formData.warehouseAddress);
      localStorage.setItem(LEGACY_STORAGE_KEYS.FREE_STORAGE_DAYS, String(formData.freeStorageDays));
      localStorage.setItem(LEGACY_STORAGE_KEYS.DAILY_OVERAGE_FEE, String(formData.dailyOverageFee));
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
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Warehouse & Storage Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Locker retention duration, overage billing, and fulfillment processing hub addresses
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 8 of 12
          </span>
        </div>

        {/* Form Fields */}
        <form id="warehouse-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Standard Free Locker Storage (Days)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={formData.freeStorageDays}
                onChange={(e) => setFormData({ ...formData, freeStorageDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 30 days complimentary storage</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Daily Storage Overage Fee (₹ / Box / Day)
              </label>
              <input
                type="number"
                min={0}
                value={formData.dailyOverageFee}
                onChange={(e) => setFormData({ ...formData, dailyOverageFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Applied automatically beyond free period</span>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Total Locker Bay Facility Capacity
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={formData.bayCapacity}
                onChange={(e) => setFormData({ ...formData, bayCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Maximum physical shelf allocation capacity in Mumbai Hub</span>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                India Receiving Warehouse Address (Shown on Invoices & Locker Portals)
              </label>
              <textarea
                rows={2}
                value={formData.warehouseAddress}
                onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official fulfillment address printed on PDF invoices and provided to customers for online merchant checkout
              </span>
            </div>
          </div>

          {/* Warehouse Operations Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Allocate Locker on Signup</div>
                <div className="text-[11px] text-slate-400">Instantly provisions unique locker ID (e.g. I2W-LKR-XXXX) for new accounts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoAllocateLocker}
                  onChange={(e) => setFormData({ ...formData, autoAllocateLocker: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Mandatory Unboxing Inspection & Weighing</div>
                <div className="text-[11px] text-slate-400">Staff must verify package weight & condition before logging into bay shelf</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mandatoryIntakeInspection}
                  onChange={(e) => setFormData({ ...formData, mandatoryIntakeInspection: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Mandatory Intake Verification Photos</span>
                </div>
                <div className="text-[11px] text-slate-400">Requires uploading at least 2 condition photos per received parcel before notifying customer</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mandatoryIntakePhotos}
                  onChange={(e) => setFormData({ ...formData, mandatoryIntakePhotos: e.target.checked })}
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
        <span className="text-[11px] text-slate-400">Syncs to warehouse intake workflows</span>
        <button
          type="submit"
          form="warehouse-settings-form"
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
