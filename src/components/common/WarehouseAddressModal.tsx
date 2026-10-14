import React, { useState } from 'react';
import { X, Copy, Check, MapPin, Building, Phone, AlertCircle, Sparkles } from 'lucide-react';
import { indianLockerAddress } from '../../data/mockData';
import { getCurrentUser } from '../../utils/userAuth';

interface WarehouseAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarehouseAddressModal: React.FC<WarehouseAddressModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const currentUser = getCurrentUser();
  const dynamicRecipientName = `${currentUser.name} / ${currentUser.customerId}`;
  const dynamicLockerId = currentUser.lockerId || indianLockerAddress.lockerId;

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyEntireAddress = () => {
    const fullText = `
Name: ${dynamicRecipientName}
Address Line 1: ${indianLockerAddress.addressLine1}
Address Line 2: ${indianLockerAddress.addressLine2}
Landmark: ${indianLockerAddress.landmark}
City: ${indianLockerAddress.city}
State: ${indianLockerAddress.state}
PIN Code: ${indianLockerAddress.pincode}
Country: ${indianLockerAddress.country}
Phone: ${indianLockerAddress.phone}
`.trim();
    copyToClipboard(fullText, 'entire');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner with visual */}
        <div className="relative h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white flex items-end">
          <img
            src="/assets/address-banner.jpg"
            alt="India Gate & Taj Mahal"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
          />
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white mb-1">
              Your Personal Mumbai Locker
            </span>
            <h3 className="font-extrabold text-xl">Indian Warehouse Address</h3>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Crucial:</strong> Always include your customer code{' '}
              <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{currentUser.customerId}</span> in the Name field or Address Line 2 so our warehouse team can instantly credit incoming parcels to your dashboard.
            </div>
          </div>

          {/* Address Fields */}
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: dynamicRecipientName, key: 'name' },
              { label: 'Address Line 1', value: indianLockerAddress.addressLine1, key: 'line1' },
              { label: 'Address Line 2', value: indianLockerAddress.addressLine2, key: 'line2' },
              { label: 'City & State', value: `${indianLockerAddress.city}, ${indianLockerAddress.state}`, key: 'city' },
              { label: 'PIN / Postal Code', value: indianLockerAddress.pincode, key: 'pin' },
              { label: 'Phone Number', value: indianLockerAddress.phone, key: 'phone' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-blue-200 transition-colors"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.label}
                  </span>
                  <span className="font-medium text-slate-800 text-sm">{item.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.value, item.key)}
                  className="p-1.5 text-slate-500 hover:text-[#0066FF] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Copy to clipboard"
                >
                  {copiedField === item.key ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="font-semibold">Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Copy Entire Address Button */}
          <button
            type="button"
            onClick={copyEntireAddress}
            className="w-full py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {copiedField === 'entire' ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Entire Address Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Entire Address</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
