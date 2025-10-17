import React from 'react';

export interface ResistorProps {
  value?: string;
}

export const Resistor = React.forwardRef<HTMLDivElement, ResistorProps>(({ value = '1000' }, ref) => {
  return (
    <div ref={ref} className="flex flex-col items-center justify-center h-full">
      <svg width="80" height="30" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg">
        {/* Wires */}
        <line x1="0" y1="15" x2="15" y2="15" stroke="#999" strokeWidth="2" />
        <line x1="65" y1="15" x2="80" y2="15" stroke="#999" strokeWidth="2" />
        {/* Body */}
        <rect x="15" y="5" width="50" height="20" rx="5" ry="5" fill="#d2b48c" stroke="#a0522d" strokeWidth="1" />
        {/* Color bands (example for 1k ohm: brown, black, red) */}
        <rect x="25" y="5" width="4" height="20" fill="#a52a2a" />
        <rect x="35" y="5" width="4" height="20" fill="#000000" />
        <rect x="45" y="5" width="4" height="20" fill="#ff0000" />
        <rect x="55" y="5" width="4" height="20" fill="#ffd700" />
      </svg>
      <span className="text-xs text-gray-700 dark:text-gray-300 -mt-1">{value}Ω</span>
    </div>
  );
});