// components/SkeletonLoader.jsx
import React from "react";

const SkeletonLoader = ({ count = 1, className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden bg-gray-300 rounded-md h-40 w-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
