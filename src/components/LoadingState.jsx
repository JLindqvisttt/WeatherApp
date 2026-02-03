import React from 'react';

const LoadingState = () => {
  return (
    <div className="text-center py-16">
      <div className="inline-block">
        <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-blue-200 mt-4">Hämtar väder...</p>
    </div>
  );
};

export default LoadingState;
