
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
      <div className="absolute inset-4 rounded-full bg-indigo-50 flex items-center justify-center">
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default Loader;
