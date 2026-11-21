'use client';

import React from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#pb_grad)" />
      <path
        d="M9.5 21.5V10.5H16.5C19.2614 10.5 21.5 12.2909 21.5 14.5C21.5 16.7091 19.2614 18.5 16.5 18.5H12.5V21.5H9.5Z"
        fill="#080B12"
      />
      <circle cx="22.5" cy="21.5" r="2.5" fill="#080B12" />
      <defs>
        <linearGradient id="pb_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
};
