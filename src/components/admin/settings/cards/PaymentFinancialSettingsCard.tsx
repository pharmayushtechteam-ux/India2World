import React, { useState } from 'react';
import { CreditCard, Landmark, ShieldCheck, FileCheck, Check, AlertCircle } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface PaymentFinancialSettingsCardProps {
  settings: AdminSettingsData['payment'];
  onSave: (data: AdminSettingsData['payment']) => Promise<void>;
  isSaving: boolean;
}

export const PaymentFinancialSettingsCard: React.FC<PaymentFinancialSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['payment']>({ ...settings });

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
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Payment & Financial Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Payment gateway status, bank wire details, refund approvals, and fiscal tax compliance
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 7 of 12
          </span>
        </div>

        {/* Real Gateway Integration Status Grid */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Payment Gateways & Real Integration Status
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Razorpay / UPI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready (Key Active)
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                {formData.gateways.razorpay.keyId}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Stripe Global</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                  Ready (Cards)
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                {formData.gateways.stripe.publishableKey}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Bank Wire / NEFT</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active (Manual Proof)
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {formData.gateways.bankWire.bankName}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">PayPal Express</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  Not Configured
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Requires Client Secret & Webhook</div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form id="payment-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. I2W-INV-2026-0042</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Company GSTIN
              </label>
              <input
                type="text"
                value={formData.companyGstin}
                onChange={(e) => setFormData({ ...formData, companyGstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Official Maharashtra GSTIN</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                value={formData.hsnSacCode}
                onChange={(e) => setFormData({ ...formData, hsnSacCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Courier & Cargo Forwarding (996813)</span>
            </div>
          </div>

          {/* Financial Controls Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Mandatory Bank Wire Transaction Reference</div>
                <div className="text-[11px] text-slate-400">Requires customers to enter UTR or wire reference number when paying manually</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireTransactionRef}
                  onChange={(e) => setFormData({ ...formData, requireTransactionRef: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Dual Admin Approval for Refunds</span>
                </div>
                <div className="text-[11px] text-slate-400">Requires Finance Staff or Super Admin verification before refund gateway execution</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dualApprovalForRefunds}
                  onChange={(e) => setFormData({ ...formData, dualApprovalForRefunds: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Reconcile Payment Webhooks</div>
                <div className="text-[11px] text-slate-400">Automatically marks invoices as paid upon receiving verified Razorpay/Stripe webhooks</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoReconcileWebhooks}
                  onChange={(e) => setFormData({ ...formData, autoReconcileWebhooks: e.target.checked })}
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
        <span className="text-[11px] text-slate-400">Fiscal invoicing compliance active</span>
        <button
          type="submit"
          form="payment-settings-form"
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
