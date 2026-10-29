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
  onClick,
  iconOnly = false,
}) => {
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-8 md:h-9',
    lg: 'h-9 sm:h-11',
    xl: 'h-12',
  };

  const iconHeightClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto',
  };

  if (iconOnly) {
    return (
      <img
        src="/assets/boxmyindia-logo.png?v=2"
        alt="boxmyindia.com"
        onClick={onClick}
        className={`object-contain shrink-0 select-none ${iconHeightClasses[size]} ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
    >
      <img
        src="/assets/boxmyindia-logo.png?v=2"
        alt="boxmyindia.com"
        className={`w-auto object-contain ${heightClasses[size]}`}
      />
    </div>
  );
};
