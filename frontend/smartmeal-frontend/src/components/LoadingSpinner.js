import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-4">
          <div className="text-4xl">👨‍🍳</div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Cooking up something delicious...
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          Our AI chef is analyzing your ingredients and creating personalized recipes just for you.
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;