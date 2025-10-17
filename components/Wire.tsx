
import React from 'react';
import type { WireRuntimeState, WireSignalType } from '../types';

interface WireProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  isSelected: boolean;
  onClick: (id: string) => void;
  color: string;
  signal: WireSignalType;
  runtimeState?: WireRuntimeState;
  simulateElectronFlow: boolean;
  onHandleMouseDown?: (id: string, endpoint: 'from' | 'to', event: React.MouseEvent<SVGCircleElement>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lightenColor(hexColor: string, factor: number): string {
  const match = hexColor.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return '#fef3c7';
  const value = parseInt(match[1], 16);
  let r = (value >> 16) & 255;
  let g = (value >> 8) & 255;
  let b = value & 255;

  r = Math.round(r + (255 - r) * factor);
  g = Math.round(g + (255 - g) * factor);
  b = Math.round(b + (255 - b) * factor);

  r = clamp(r, 0, 255);
  g = clamp(g, 0, 255);
  b = clamp(b, 0, 255);

  const toHex = (component: number) => component.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getFlowColor(baseColor: string, signal: WireSignalType): string {
  const strengthMap: Record<WireSignalType, number> = {
    power: 0.25,
    ground: 0.2,
    analog: 0.4,
    pwm: 0.35,
    serial: 0.3,
    digital: 0.3,
  };
  const factor = strengthMap[signal] ?? 0.3;
  return lightenColor(baseColor, factor);
}

export const Wire: React.FC<WireProps> = ({
  id,
  from,
  to,
  isSelected,
  onClick,
  color,
  signal,
  runtimeState,
  simulateElectronFlow,
  onHandleMouseDown,
}) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const midX = from.x + dx / 2;
  const midY = from.y + dy / 2;
  const length = Math.hypot(dx, dy);
  
  // This creates a nice curve that bows out perpendicularly from the center of the wire,
  // giving it a flexible, physical appearance.
  const perpX = -dy * 0.2;
  const perpY = dx * 0.2;
  
  const pathData = `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY} ${to.x} ${to.y}`;
  const showFlow =
    simulateElectronFlow &&
    runtimeState &&
    runtimeState.logical !== 'floating' &&
    runtimeState.direction !== 'none' &&
    runtimeState.magnitude > 0.05;

  const magnitude = runtimeState?.magnitude ?? 0;
  const baseDuration = Math.max(0.4, Math.min(2.4, length / 110));
  const effectiveDuration = baseDuration / Math.max(0.3, magnitude || 0.3);
  const dashArray = Math.max(14, length / 4);
  const dashOffset = dashArray;
  const flowColor = getFlowColor(color, signal);
  const flowOpacity = clamp(0.2 + magnitude * 0.6, 0.2, 0.95);
  const flowStrokeWidth = isSelected ? 3.2 : 2.4 + magnitude * 0.6;
  const animationForwardTarget = (-dashOffset).toString();
  const animationReverseTarget = dashOffset.toString();

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
        stroke={isSelected ? '#3b82f6' : color}
        strokeWidth={isSelected ? "3" : "2"}
        className="pointer-events-auto transition-all"
        style={{ filter: isSelected ? 'drop-shadow(0 0 2px #3b82f6)' : 'none' }}
      />
      {showFlow && (
        <path
          d={pathData}
          fill="none"
          stroke={flowColor}
          strokeWidth={flowStrokeWidth}
          strokeDasharray={`${dashArray} ${dashArray}`}
          strokeLinecap="round"
          opacity={flowOpacity}
          pointerEvents="none"
        >
          {runtimeState!.direction === 'bidirectional' ? (
            <animate
              attributeName="stroke-dashoffset"
              values={`0; ${animationForwardTarget}; ${animationReverseTarget}; 0`}
              dur={`${effectiveDuration * 1.5}s`}
              repeatCount="indefinite"
            />
          ) : (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to={runtimeState!.direction === 'reverse' ? animationReverseTarget : animationForwardTarget}
              dur={`${effectiveDuration}s`}
              repeatCount="indefinite"
            />
          )}
        </path>
      )}
      {isSelected && onHandleMouseDown && (
        <>
          <circle
            cx={from.x}
            cy={from.y}
            r={4.5}
            className="fill-white stroke-blue-500 stroke-2 pointer-events-auto"
            onMouseDown={(event) => {
              event.stopPropagation();
              onHandleMouseDown(id, 'from', event);
            }}
          />
          <circle
            cx={to.x}
            cy={to.y}
            r={4.5}
            className="fill-white stroke-blue-500 stroke-2 pointer-events-auto"
            onMouseDown={(event) => {
              event.stopPropagation();
              onHandleMouseDown(id, 'to', event);
            }}
          />
        </>
      )}
    </g>
  );
};
