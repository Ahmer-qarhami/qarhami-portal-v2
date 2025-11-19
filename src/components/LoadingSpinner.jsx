import React from "react";

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
      </div>
      <p className="text-indigo-600 font-medium text-lg">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;
