import React, { useState } from 'react';
import { ShoppingBag, Sparkles, CheckSquare, Layers, Image as ImageIcon, Check } from 'lucide-react';
import { AdminSettingsData } from '../../../../services/adminSettingsService';

interface BuyForMeSettingsCardProps {
  settings: AdminSettingsData['buyForMe'];
  onSave: (data: AdminSettingsData['buyForMe']) => Promise<void>;
  isSaving: boolean;
}

export const BuyForMeSettingsCard: React.FC<BuyForMeSettingsCardProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData['buyForMe']>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handlePlatformToggle = (platform: keyof AdminSettingsData['buyForMe']['supportedPlatforms']) => {
    setFormData((prev: AdminSettingsData['buyForMe']) => ({
      ...prev,
      supportedPlatforms: {
        ...prev.supportedPlatforms,
        [platform]: !prev.supportedPlatforms[platform],
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
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1933] uppercase tracking-wider">
                Buy For Me & Product Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Supported shopping platforms, metadata scrapers, URL validation, and upload limits
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-100 shrink-0">
            Card 4 of 12
          </span>
        </div>

        {/* Form Fields */}
        <form id="buyforme-settings-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Supported Shopping Platforms */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Supported Indian Shopping Platforms
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'amazon', label: 'Amazon India', domain: 'amazon.in' },
                { id: 'flipkart', label: 'Flipkart', domain: 'flipkart.com' },
                { id: 'myntra', label: 'Myntra Fashion', domain: 'myntra.com' },
                { id: 'tatacliq', label: 'Tata CLiQ', domain: 'tatacliq.com' },
                { id: 'ajio', label: 'AJIO Luxe', domain: 'ajio.com' },
                { id: 'nykaa', label: 'Nykaa Beauty', domain: 'nykaa.com' },
              ].map((platform) => {
                const isChecked = formData.supportedPlatforms[platform.id as keyof typeof formData.supportedPlatforms];
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.id as any)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] leading-tight">{platform.label}</div>
                      <div className="text-[9.5px] opacity-70 leading-tight">{platform.domain}</div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                      isChecked ? 'bg-[#0066FF] text-white' : 'border border-slate-300'
                    }`}>
                      {isChecked && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Product URL Validation Mode
              </label>
              <select
                value={formData.urlValidationStrictness}
                onChange={(e) => setFormData({ ...formData, urlValidationStrictness: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="strict">Strict (Supported Indian Domains Only)</option>
                <option value="permissive">Permissive (Any valid HTTP/HTTPS URL)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Duplicate Product URL Detection
              </label>
              <select
                value={formData.duplicateProductDetection}
                onChange={(e) => setFormData({ ...formData, duplicateProductDetection: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white cursor-pointer"
              >
                <option value="warn">Warn & Recommend Qty Increase</option>
                <option value="prevent">Strictly Prevent Duplicates</option>
                <option value="allow">Allow Multiple Duplicate Entries</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Products Per Request
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.maxProductsPerRequest}
                onChange={(e) => setFormData({ ...formData, maxProductsPerRequest: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Upper item ceiling per consolidated cart</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Image Upload Size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={formData.maxImageUploadSizeMB}
                onChange={(e) => setFormData({ ...formData, maxImageUploadSizeMB: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Direct customer upload file limit</span>
            </div>
          </div>

          {/* Scraper Toggles */}
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Automatic Product Metadata & Image Extraction</span>
                </div>
                <div className="text-[11px] text-slate-400">Scrapes title, live INR pricing and HD product image via /api/fetch-product-meta</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoExtractMetadata}
                  onChange={(e) => setFormData({ ...formData, autoExtractMetadata: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-800">Fallback Resilient HTML Parser</div>
                <div className="text-[11px] text-slate-400">Attempts secondary DOM inspection when OpenGraph and microdata tags are missing</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fallbackScraping}
                  onChange={(e) => setFormData({ ...formData, fallbackScraping: e.target.checked })}
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
        <span className="text-[11px] text-slate-400">Live metadata parsing active</span>
        <button
          type="submit"
          form="buyforme-settings-form"
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
