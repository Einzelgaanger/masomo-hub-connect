import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img 
          src="/logo.svg" 
          alt="Bunifu Logo" 
          className={`${sizeClasses[size]} flex-shrink-0`}
        />
        <div className="flex flex-col text-left">
          <span className={`fredoka-bold text-gray-900 ${textSizes[size]} text-left`}>
            Bunifu
          </span>
          <span className={`fredoka-medium text-gray-600 ${subtitleSizes[size]} text-left`}>
            Where learning meets creativity
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/logo.svg"
      alt="Bunifu Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
