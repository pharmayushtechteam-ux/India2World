import React, { useState } from 'react';
import { ListOrdered, CheckCircle2, ShieldAlert, FileText, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface OrderWorkflowSettingsCardProps {
  settings: AdminSettingsData['orderWorkflow'];
  onSave: (data: AdminSettingsData['orderWorkflow']) => Promise<void>;
  isSaving: boolean;
}

export const OrderWorkflowSettingsCard: React.FC<OrderWorkflowSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['orderWorkflow']>({ ...settings });

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
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Order & Purchase Workflow Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Order confirmation, procurement sign-offs, automated invoices, and cancellation policies
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 6 of 12
          </span>
        </div>

        {/* Form Fields */}
        <form id="workflow-settings-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purchase Approval Threshold (₹)
              </label>
              <input
                type="number"
                min={1000}
                step={5000}
                value={formData.procurementApprovalThresholdINR}
                onChange={(e) => setFormData({ ...formData, procurementApprovalThresholdINR: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Orders exceeding this require Super Admin sign-off</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Failed Email Dispatch Retries
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.failedEmailRetryCount}
                onChange={(e) => setFormData({ ...formData, failedEmailRetryCount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Auto-retry count for failed SMTP invoice dispatches</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer Cancellation Policy
              </label>
              <select
                value={formData.allowCustomerCancellation}
                onChange={(e) => setFormData({ ...formData, allowCustomerCancellation: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="until_procurement">Allowed until buyer initiates checkout (Default)</option>
                <option value="until_payment">Allowed until payment capture</option>
                <option value="never">Disallow customer self-cancellation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Order Lifecycle Transitions
              </label>
              <select
                value={formData.statusTransitionMode}
                onChange={(e) => setFormData({ ...formData, statusTransitionMode: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="strict">Strict Sequential Workflow (Quote → Paid → Procuring → Warehoused → Dispatched)</option>
                <option value="flexible">Flexible Operational Override</option>
              </select>
            </div>
          </div>

          {/* Workflow Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Confirm Orders on Payment</div>
                <div className="text-[11px] text-slate-400">Immediately transition paid quote to active buyer procurement queue</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoConfirmOnPayment}
                  onChange={(e) => setFormData({ ...formData, autoConfirmOnPayment: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Automated PDF Invoice Generation</span>
                </div>
                <div className="text-[11px] text-slate-400">Generates itemized GST tax invoice PDF on confirmation and sends via SMTP</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoGenerateInvoice}
                  onChange={(e) => setFormData({ ...formData, autoGenerateInvoice: e.target.checked })}
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
        <span className="text-[11px] text-slate-400">Order transitions verified in real-time</span>
        <button
          type="submit"
          form="workflow-settings-form"
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
