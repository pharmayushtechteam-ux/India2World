import React, { useState } from 'react';
import { Users, UserCheck, Shield, Lock, Eye, AlertCircle, Check, KeyRound } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface CustomerAccountSettingsCardProps {
  settings: AdminSettingsData['customerAccount'];
  onSave: (data: AdminSettingsData['customerAccount']) => Promise<void>;
  isSaving: boolean;
}

export const CustomerAccountSettingsCard: React.FC<CustomerAccountSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['customerAccount']>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Customer & Account Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                User registration, email verification, account lifecycle, and data privacy isolation
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 3 of 12
          </span>
        </div>

        {/* Form Fields */}
        <form id="customer-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer Registration Mode
              </label>
              <select
                value={formData.registrationMode}
                onChange={(e) => setFormData({ ...formData, registrationMode: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="open">Open Public Registration (Default)</option>
                <option value="invite">Invite-Only Access</option>
                <option value="approval">Admin Approval Required</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">Controls how new international shoppers sign up</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password Reset Validity (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={formData.passwordResetValidityHours}
                onChange={(e) => setFormData({ ...formData, passwordResetValidityHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Time window for one-time recovery tokens</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dormant Account Alert (Days)
              </label>
              <input
                type="number"
                min={30}
                max={365}
                value={formData.dormancyAlertDays}
                onChange={(e) => setFormData({ ...formData, dormancyAlertDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Inactivity period before flagging customer account</span>
            </div>

            <div className="flex flex-col justify-end">
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Strict Customer Isolation Policy active</span>
              </div>
            </div>
          </div>

          {/* Account Lifecycle Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Email Verification Required</div>
                <div className="text-[11px] text-slate-400">Users must verify their email before submitting assisted purchase requests</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailVerificationRequired}
                  onChange={(e) => setFormData({ ...formData, emailVerificationRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Activate on Signup</div>
                <div className="text-[11px] text-slate-400">Instantly generate customer locker space upon completed signup form</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoActivateOnSignup}
                  onChange={(e) => setFormData({ ...formData, autoActivateOnSignup: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Block Suspended Customer Accounts</div>
                <div className="text-[11px] text-slate-400">Strictly block portal login and API access if an account is flagged or suspended</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.blockSuspendedAccounts}
                  onChange={(e) => setFormData({ ...formData, blockSuspendedAccounts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Customer Data Privacy & GDPR Export</div>
                <div className="text-[11px] text-slate-400">Allows customers to download complete purchase history & personal data archive</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerDataPrivacyEnabled}
                  onChange={(e) => setFormData({ ...formData, customerDataPrivacyEnabled: e.target.checked })}
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
        <span className="text-[11px] text-slate-400">Enforced by backend session auth</span>
        <button
          type="submit"
          form="customer-settings-form"
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
