import React from 'react';

export interface PushButtonProps {
  color?: string;
}

export const PushButton = React.forwardRef<HTMLDivElement, PushButtonProps>(({ color = '#3b82f6' }, ref) => {

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.dispatchEvent(new Event('button-press', { bubbles: true }));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.dispatchEvent(new Event('button-release', { bubbles: true }));
  };

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ touchAction: 'none', userSelect: 'none' }}
      className="cursor-pointer select-none"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <g>
          {/* Base */}
          <rect x="2" y="2" width="36" height="36" rx="4" ry="4" fill="#333" />
          <rect x="4" y="4" width="32" height="32" rx="2" ry="2" fill="#555" />
          {/* Button */}
          <circle cx="20" cy="20" r="12" fill={color} className="transition-transform duration-75 active:translate-y-0.5" />
          {/* Highlight */}
          <circle cx="20" cy="20" r="10" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
});
