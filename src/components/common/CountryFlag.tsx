import React, { useState } from 'react';

interface CountryFlagProps {
  code: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CountryFlagProps['size']>, string> = {
  xs: 'w-5 h-3.5 rounded-[2px]',
  sm: 'w-6 h-4 rounded-[3px]',
  md: 'w-8 h-6 rounded-[4px]',
  lg: 'w-10 h-7 rounded-[5px]',
};

/**
 * Renders crisp, real country flags on all OSes (including Windows where
 * Unicode flag emojis fall back to plain two-letter text like "AE", "US").
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  alt,
  size = 'md',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const iso = (code || '').trim().toLowerCase();

  if (!iso || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[10px] tracking-tight shrink-0 select-none ${SIZE_CLASSES[size]} ${className}`}
        aria-label={alt || code}
      >
        {(code || '--').toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${iso}.svg`}
      alt={alt || `${code.toUpperCase()} flag`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover border border-slate-200/90 shadow-2xs shrink-0 select-none bg-slate-50 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
};
