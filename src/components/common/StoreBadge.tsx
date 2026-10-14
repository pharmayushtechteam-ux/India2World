import React from 'react';

interface StoreBadgeProps {
  store: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StoreBadge: React.FC<StoreBadgeProps> = ({ store, className = '', size = 'md' }) => {
  const normalized = store.toLowerCase().replace(/[^a-z0-9]/g, '');

  const sizeClasses = {
    sm: 'h-6 text-xs px-2.5 py-0.5',
    md: 'h-8 text-sm px-3.5 py-1',
    lg: 'h-11 text-base px-5 py-2',
  };

  // Render authentic styled badges matching reference designs
  if (normalized.includes('amazon')) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="text-slate-900 tracking-tight">amazon</span>
        <span className="text-amber-500 font-semibold text-[0.85em]">.in</span>
        {/* Amazon smile curve */}
        <svg className="w-3.5 h-2 text-amber-500 -ml-1 mt-1" viewBox="0 0 24 10" fill="none">
          <path d="M2 3 Q 12 11 22 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('myntra')) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        {/* Myntra M gradient */}
        <span className="text-[#FF3F6C] font-extrabold text-base tracking-tighter">M</span>
        <span className="text-slate-900 tracking-tight font-semibold">Myntra</span>
      </div>
    );
  }

  if (normalized.includes('flipkart')) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="text-[#2874F0] italic font-black">Flipkart</span>
        <span className="bg-[#FFE500] text-blue-900 rounded-full w-3.5 h-3.5 text-[9px] flex items-center justify-center font-bold">
          ★
        </span>
      </div>
    );
  }

  if (normalized.includes('tatacliq')) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="text-slate-900 tracking-wider text-[0.75em] font-extrabold">TATA</span>
        <span className="text-slate-900 tracking-tight font-black">CLiQ</span>
      </div>
    );
  }

  if (normalized.includes('ajio')) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-black rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="text-slate-900 tracking-widest font-black">AJIO</span>
      </div>
    );
  }

  if (normalized.includes('nykaa')) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-black rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="text-[#FC2779] tracking-wider font-extrabold">NYKAA</span>
      </div>
    );
  }

  if (normalized.includes('bigbasket')) {
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold rounded-lg border border-slate-200 bg-white shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        <span className="bg-[#E72B36] text-white rounded text-[10px] font-black px-1">bb</span>
        <span className="text-[#84C225] font-extrabold tracking-tight">bigbasket</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs ${sizeClasses[size]} ${className}`}
    >
      {store}
    </div>
  );
};
