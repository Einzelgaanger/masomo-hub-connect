import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '', variant = 'default' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-sm'
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
          <span className={`fredoka-bold ${variant === 'white' ? 'text-white' : 'text-gray-900'} ${textSizes[size]} text-left`}>
            Bunifu
          </span>
          <span className={`fredoka-medium ${variant === 'white' ? 'text-gray-300' : 'text-gray-600'} ${subtitleSizes[size]} text-left`}>
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
