import React from 'react';

interface BrainLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function BrainLogo({ 
  className = "", 
  size = 24, 
  color = "#1f2937" 
}: BrainLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Brain Hemisphere */}
      <path 
        d="M2.5 6.5C2.5 4.567 4.067 3 6 3C7.933 3 9.5 4.567 9.5 6.5V7.5C9.5 8.052 9.948 8.5 10.5 8.5H11C11.552 8.5 12 8.948 12 9.5V10.5C12 11.328 11.328 12 10.5 12H9C8.172 12 7.5 12.672 7.5 13.5V15C7.5 16.381 6.381 17.5 5 17.5C3.619 17.5 2.5 16.381 2.5 15V14C2.5 13.172 3.172 12.5 4 12.5H4.5C5.052 12.5 5.5 12.052 5.5 11.5V10C5.5 9.172 4.828 8.5 4 8.5H3.5C2.948 8.5 2.5 8.052 2.5 7.5V6.5Z" 
        fill={color}
      />
      
      {/* Right Brain Hemisphere */}
      <path 
        d="M21.5 6.5C21.5 4.567 19.933 3 18 3C16.067 3 14.5 4.567 14.5 6.5V7.5C14.5 8.052 14.052 8.5 13.5 8.5H13C12.448 8.5 12 8.948 12 9.5V10.5C12 11.328 12.672 12 13.5 12H15C15.828 12 16.5 12.672 16.5 13.5V15C16.5 16.381 17.619 17.5 19 17.5C20.381 17.5 21.5 16.381 21.5 15V14C21.5 13.172 20.828 12.5 20 12.5H19.5C18.948 12.5 18.5 12.052 18.5 11.5V10C18.5 9.172 19.172 8.5 20 8.5H20.5C21.052 8.5 21.5 8.052 21.5 7.5V6.5Z" 
        fill={color}
      />
      
      {/* Center Connection */}
      <path 
        d="M12 9.5C12 8.948 11.552 8.5 11 8.5H10.5C9.948 8.5 9.5 8.948 9.5 9.5V10.5C9.5 11.052 9.948 11.5 10.5 11.5H13.5C14.052 11.5 14.5 11.052 14.5 10.5V9.5C14.5 8.948 14.052 8.5 13.5 8.5H13C12.448 8.5 12 8.948 12 9.5Z" 
        fill={color}
        opacity="0.7"
      />
      
      {/* Additional Brain Detail - Left Side */}
      <path 
        d="M4 5C4.552 5 5 5.448 5 6V7C5 7.552 4.552 8 4 8C3.448 8 3 7.552 3 7V6C3 5.448 3.448 5 4 5Z" 
        fill={color}
        opacity="0.8"
      />
      
      {/* Additional Brain Detail - Right Side */}
      <path 
        d="M20 5C20.552 5 21 5.448 21 6V7C21 7.552 20.552 8 20 8C19.448 8 19 7.552 19 7V6C19 5.448 19.448 5 20 5Z" 
        fill={color}
        opacity="0.8"
      />
      
      {/* Lower Brain Connections */}
      <path 
        d="M6 18.5C6.828 18.5 7.5 19.172 7.5 20C7.5 20.828 6.828 21.5 6 21.5C5.172 21.5 4.5 20.828 4.5 20C4.5 19.172 5.172 18.5 6 18.5Z" 
        fill={color}
        opacity="0.6"
      />
      
      <path 
        d="M18 18.5C18.828 18.5 19.5 19.172 19.5 20C19.5 20.828 18.828 21.5 18 21.5C17.172 21.5 16.5 20.828 16.5 20C16.5 19.172 17.172 18.5 18 18.5Z" 
        fill={color}
        opacity="0.6"
      />
    </svg>
  );
}