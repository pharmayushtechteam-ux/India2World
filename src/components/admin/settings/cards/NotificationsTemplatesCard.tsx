import React, { useState } from 'react';
import { Bell, Mail, FileText, Check, Eye, ChevronDown, Sparkles } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface NotificationsTemplatesCardProps {
  settings: AdminSettingsData['notifications'];
  onSave: (data: AdminSettingsData['notifications']) => Promise<void>;
  isSaving: boolean;
}

export const NotificationsTemplatesCard: React.FC<NotificationsTemplatesCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['notifications']>({ ...settings });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleToggleTemplate = (id: string) => {
    setFormData((prev: AdminSettingsData['notifications']) => ({
      ...prev,
      templates: prev.templates.map((tpl: AdminSettingsData['notifications']['templates'][number]) =>
        tpl.id === id ? { ...tpl, enabled: !tpl.enabled } : tpl
      ),
    }));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-slate-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Notifications & Email Templates
              </h2>
              <p className="text-[11px] text-slate-400">
                Automated order confirmation, quotation alert, tax invoice dispatch, and AWB tracking
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 11 of 12
          </span>
        </div>

        {/* Templates List */}
        <form id="notifications-settings-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {formData.templates.map((tpl) => {
              const isExpanded = expandedId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    tpl.enabled ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-50/30 border-slate-200/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tpl.enabled}
                          onChange={() => handleToggleTemplate(tpl.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                      </label>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{tpl.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{tpl.description}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 shrink-0 cursor-pointer"
                      title="View Subject Template"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 space-y-1.5 text-xs animate-in fade-in duration-150">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Subject Template:</label>
                        <input
                          type="text"
                          value={tpl.subject}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev: AdminSettingsData['notifications']) => ({
                              ...prev,
                              templates: prev.templates.map((t: AdminSettingsData['notifications']['templates'][number]) =>
                                t.id === tpl.id ? { ...t, subject: val } : t
                              ),
                            }));
                          }}
                          className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0066FF]"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#0066FF]" />
                        <span>Dynamic tags: <code>{'{{orderId}}'}</code>, <code>{'{{customerName}}'}</code>, <code>{'{{trackingNumber}}'}</code></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Global Footer Signature */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Global Email Footer Signature
            </label>
            <textarea
              rows={2}
              value={formData.emailSignature}
              onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
            />
          </div>
        </form>
      </div>

      {/* Card Footer with Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">SMTP triggers armed</span>
        <button
          type="submit"
          form="notifications-settings-form"
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
