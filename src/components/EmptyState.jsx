import React from 'react';
import { Cloud } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="text-center py-16">
      <Cloud className="w-24 h-24 text-blue-300 mx-auto mb-6 opacity-50" />
      <p className="text-blue-200 text-xl">Sök efter en stad för att se vädret</p>
    </div>
  );
};

export default EmptyState;
