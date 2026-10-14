import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  onClick?: () => void;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  onClick,
  iconOnly = false,
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16',
  };

  const iconHeightClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14',
  };

  if (iconOnly) {
    return (
      <img
        src="/logo-icon.png"
        alt="India2World Emblem"
        onClick={onClick}
        className={`object-contain shrink-0 select-none ${iconHeightClasses[size]} ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
      />
    );
  }

  const logoSrc = showSubtitle ? '/logo.png' : '/logo-no-subtitle.png';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
    >
      <img
        src={logoSrc}
        alt="India2World - Shop in India. Deliver Worldwide."
        className={`w-auto object-contain ${heightClasses[size]}`}
      />
    </div>
  );
};
