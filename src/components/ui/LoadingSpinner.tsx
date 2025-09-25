import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'fullscreen';
  className?: string;
}

const LoadingSpinner = ({ 
  message = "Loading...", 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'fullscreen') {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-white", className)}>
        <div className="text-center">
          <div className={cn(
            "animate-spin rounded-full border-b-2 border-primary mx-auto mb-4",
            sizeClasses[size]
          )}></div>
          {message && (
            <p className={cn("text-gray-700 font-medium", textSizeClasses[size])}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="flex items-center space-x-3">
          <div className={cn(
            "animate-spin rounded-full border-b-2 border-primary",
            sizeClasses[size]
          )}></div>
          {message && (
            <span className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="text-center">
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-primary mx-auto mb-4",
          sizeClasses[size]
        )}></div>
        {message && (
          <p className={cn("text-gray-700 font-medium", textSizeClasses[size])}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
