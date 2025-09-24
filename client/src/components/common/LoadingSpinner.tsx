import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`
          animate-spin rounded-full border-gray-300 border-t-primary-600
          ${sizeClasses[size]}
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
