import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-4',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${sizeClasses[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-glow`}></div>
    </div>
  );
};

export default LoadingSpinner;
