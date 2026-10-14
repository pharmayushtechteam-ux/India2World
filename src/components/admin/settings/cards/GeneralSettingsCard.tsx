import React, { useState } from 'react';
import { Globe, Building2, Mail, Phone, MapPin, DollarSign, Clock, Calendar, Check, AlertTriangle } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface GeneralSettingsCardProps {
  settings: AdminSettingsData['general'];
  onSave: (data: AdminSettingsData['general']) => Promise<void>;
  isSaving: boolean;
}

export const GeneralSettingsCard: React.FC<GeneralSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['general']>({ ...settings });
  const [showConfirmMaintenance, setShowConfirmMaintenance] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleMaintenanceToggle = () => {
    if (!formData.maintenanceMode) {
      setShowConfirmMaintenance(true);
    } else {
      setFormData((prev) => ({ ...prev, maintenanceMode: false }));
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                General Application Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Platform identity, company contact, timezone, localization, and maintenance controls
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 1 of 12
          </span>
        </div>

        {/* Form Fields */}
        <form id="general-settings-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Platform Motto / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Company Legal Registered Name
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Operations Phone Number
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Default Currency
              </label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="INR">INR (₹) - Indian Rupee (Base)</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="SGD">SGD ($) - Singapore Dollar</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Operational Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date Display Format
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 14/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/14/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Base Fulfillment Country
              </label>
              <input
                type="text"
                value={formData.primaryCountry}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Registered HQ Office Address
              </label>
              <input
                type="text"
                value={formData.officeAddress}
                onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
              />
            </div>
          </div>

          {/* Registration & Maintenance Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Public Customer Sign-Up</div>
                <div className="text-[11px] text-slate-400">Allow international shoppers to register free locker accounts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerRegistration}
                  onChange={(e) => setFormData({ ...formData, customerRegistration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${
              formData.maintenanceMode ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {formData.maintenanceMode && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    <span>Global Maintenance Mode</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Temporarily pauses customer requests and displays scheduled maintenance notice</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={handleMaintenanceToggle}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {formData.maintenanceMode && (
                <div className="mt-2.5 pt-2.5 border-t border-amber-200/70">
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    Customer Maintenance Banner Text:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.maintenanceNotice}
                    onChange={(e) => setFormData({ ...formData, maintenanceNotice: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Maintenance Mode */}
      {showConfirmMaintenance && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enable Maintenance Mode?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enabling maintenance mode will notify all customers that the platform is temporarily offline for operations updates.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmMaintenance(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, maintenanceMode: true }));
                  setShowConfirmMaintenance(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Confirm Maintenance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Settings auto-applied to all customer views</span>
        <button
          type="submit"
          form="general-settings-form"
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
