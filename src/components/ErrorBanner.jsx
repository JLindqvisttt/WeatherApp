import React from 'react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-8 text-red-200 text-center backdrop-blur-sm">
      {message}
    </div>
  );
};

export default ErrorBanner;
