import React from 'react';

interface WireProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  isSelected: boolean;
  onClick: (id: string) => void;
}

export const Wire: React.FC<WireProps> = ({ id, from, to, isSelected, onClick }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;
  
  // Perpendicular vector for curve control, creating the sagging effect
  const perpX = -dy * 0.2;
  const perpY = dx * 0.2;
  
  const pathData = `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY} ${to.x} ${to.y}`;

  return (
    <g 
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
      className="cursor-pointer"
    >
      {/* Hitbox for easier clicking */}
      <path d={pathData} fill="none" stroke="transparent" strokeWidth="10" />
      {/* Visible wire */}
      <path
        d={pathData}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#6b7280'}
        strokeWidth={isSelected ? "3" : "2"}
        className="pointer-events-auto transition-all"
        style={{ filter: isSelected ? 'drop-shadow(0 0 2px #3b82f6)' : 'none' }}
      />
    </g>
  );
};