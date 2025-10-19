import React from 'react';
import type { BoardType, WireSignalType } from '../types';

interface ArduinoBoardProps {
  boardType: BoardType;
  x: number;
  y: number;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onPinMouseDown?: (pinName: string) => void;
  onPinMouseUp?: (pinName: string) => void;
}

// Pin color map based on signal type
const PIN_COLOR_MAP: Record<string, { bg: string; border: string; signal: WireSignalType }> = {
  // Power pins
  'VCC': { bg: '#ef4444', border: '#dc2626', signal: 'power' },
  '5V': { bg: '#ef4444', border: '#dc2626', signal: 'power' },
  '3V3': { bg: '#f97316', border: '#ea580c', signal: 'power' },
  // Ground pins
  'GND': { bg: '#1f2937', border: '#111827', signal: 'ground' },
  // Default digital
  'default': { bg: '#3b82f6', border: '#2563eb', signal: 'digital' },
};

function getPinColor(pinName: string) {
  if (PIN_COLOR_MAP[pinName]) {
    return PIN_COLOR_MAP[pinName];
  }
  if (pinName.startsWith('A')) {
    return { bg: '#10b981', border: '#059669', signal: 'analog' as WireSignalType };
  }
  if (pinName === 'RST' || pinName === 'RESET') {
    return { bg: '#8b5cf6', border: '#7c3aed', signal: 'digital' };
  }
  return PIN_COLOR_MAP['default'];
}

// Define pin layouts for each Arduino board type - more realistic and spacious
const BOARD_CONFIGS: Record<BoardType, {
  width: number;
  height: number;
  label: string;
  color: string;
  pins: { name: string; x: number; y: number; side: 'left' | 'right' }[];
}> = {
  uno: {
    width: 200,
    height: 140,
    label: 'ARDUINO\nUNO',
    color: '#1e3a5f',
    pins: [
      // Left side - Digital pins (D0-D13)
      { name: '0', x: 15, y: 20, side: 'left' },
      { name: '1', x: 15, y: 38, side: 'left' },
      { name: '2', x: 15, y: 56, side: 'left' },
      { name: '3', x: 15, y: 74, side: 'left' },
      { name: '4', x: 15, y: 92, side: 'left' },
      { name: '5', x: 15, y: 110, side: 'left' },
      { name: 'GND', x: 15, y: 128, side: 'left' },
      // Right side - Power and Analog (A0-A5)
      { name: 'VCC', x: 185, y: 20, side: 'right' },
      { name: 'GND', x: 185, y: 38, side: 'right' },
      { name: 'A0', x: 185, y: 56, side: 'right' },
      { name: 'A1', x: 185, y: 74, side: 'right' },
      { name: 'A2', x: 185, y: 92, side: 'right' },
      { name: 'A3', x: 185, y: 110, side: 'right' },
      { name: 'A4', x: 185, y: 128, side: 'right' },
      // Center column (bottom) - More digital and analog
      { name: '13', x: 100, y: 128, side: 'left' },
      { name: '12', x: 80, y: 128, side: 'left' },
      { name: '11', x: 60, y: 128, side: 'left' },
      { name: '10', x: 40, y: 128, side: 'left' },
      { name: 'A5', x: 160, y: 128, side: 'right' },
      { name: 'RST', x: 180, y: 10, side: 'right' },
    ]
  },
  nano: {
    width: 180,
    height: 110,
    label: 'NANO',
    color: '#1e3a5f',
    pins: [
      // Left side (bottom row in real layout)
      { name: 'D0', x: 15, y: 20, side: 'left' },
      { name: 'D1', x: 15, y: 38, side: 'left' },
      { name: 'D2', x: 15, y: 56, side: 'left' },
      { name: 'D3', x: 15, y: 74, side: 'left' },
      { name: 'D4', x: 15, y: 92, side: 'left' },
      { name: 'GND', x: 35, y: 92, side: 'left' },
      { name: 'VCC', x: 55, y: 92, side: 'left' },
      // Right side (top row)
      { name: 'RST', x: 165, y: 20, side: 'right' },
      { name: 'GND', x: 165, y: 38, side: 'right' },
      { name: 'A7', x: 165, y: 56, side: 'right' },
      { name: 'A6', x: 165, y: 74, side: 'right' },
      // Analog pins on bottom right
      { name: 'A5', x: 145, y: 92, side: 'right' },
      { name: 'A4', x: 125, y: 92, side: 'right' },
      { name: 'A3', x: 105, y: 92, side: 'right' },
      { name: 'A2', x: 85, y: 92, side: 'right' },
      { name: 'A1', x: 65, y: 92, side: 'right' },
      { name: 'A0', x: 45, y: 92, side: 'right' },
      // More digital pins
      { name: 'D13', x: 100, y: 20, side: 'left' },
      { name: 'D12', x: 80, y: 20, side: 'left' },
      { name: 'D11', x: 60, y: 20, side: 'left' },
      { name: 'D10', x: 40, y: 20, side: 'left' },
    ]
  },
  mega: {
    width: 220,
    height: 160,
    label: 'MEGA 2560',
    color: '#1e3a5f',
    pins: [
      // Left side - Digital pins (D0-D21+)
      { name: '0', x: 15, y: 20, side: 'left' },
      { name: '1', x: 15, y: 38, side: 'left' },
      { name: '2', x: 15, y: 56, side: 'left' },
      { name: '3', x: 15, y: 74, side: 'left' },
      { name: '4', x: 15, y: 92, side: 'left' },
      { name: '5', x: 15, y: 110, side: 'left' },
      { name: '6', x: 15, y: 128, side: 'left' },
      { name: 'GND', x: 15, y: 146, side: 'left' },
      // Right side - Power and Analog
      { name: 'VCC', x: 205, y: 20, side: 'right' },
      { name: 'GND', x: 205, y: 38, side: 'right' },
      { name: 'A0', x: 205, y: 56, side: 'right' },
      { name: 'A1', x: 205, y: 74, side: 'right' },
      { name: 'A2', x: 205, y: 92, side: 'right' },
      { name: 'A3', x: 205, y: 110, side: 'right' },
      { name: 'A4', x: 205, y: 128, side: 'right' },
      { name: 'A5', x: 205, y: 146, side: 'right' },
      // Additional digital pins bottom left
      { name: '20', x: 50, y: 146, side: 'left' },
      { name: '21', x: 90, y: 146, side: 'left' },
      { name: '22', x: 130, y: 146, side: 'left' },
      { name: 'RST', x: 200, y: 10, side: 'right' },
    ]
  }
};

export const ArduinoBoard = React.forwardRef<HTMLDivElement, ArduinoBoardProps>(
  ({ boardType, x, y, isDragging = false, onMouseDown, onPinMouseDown, onPinMouseUp }, ref) => {
    const config = BOARD_CONFIGS[boardType];

    return (
      <div
        ref={ref}
        onMouseDown={onMouseDown}
        className={`absolute rounded-lg shadow-lg border-2 border-gray-700 cursor-grab active:cursor-grabbing transition-transform ${
          isDragging ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          width: `${config.width}px`,
          height: `${config.height}px`,
          backgroundColor: config.color,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Board label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-white font-bold text-xs text-center leading-tight whitespace-pre-line opacity-40">
            {config.label}
          </div>
        </div>

        {/* Pins */}
        {config.pins.map((pin, index) => {
          const colorInfo = getPinColor(pin.name);
          return (
            <div
              key={`${pin.name}-${index}`}
              className="absolute group select-none"
              style={{
                left: `${pin.x}px`,
                top: `${pin.y}px`,
                transform: 'translate(-50%, -50%)',
                userSelect: 'none',
              }}
              data-pin-name={pin.name}
            >
              {/* Pin dot - smaller now */}
              <div
                className="absolute w-2 h-2 rounded-full cursor-pointer transition-all group-hover:scale-125 group-hover:shadow-lg select-none"
                style={{
                  backgroundColor: colorInfo.bg,
                  borderWidth: '1px',
                  borderColor: colorInfo.border,
                  left: '-4px',
                  top: '-4px',
                  boxShadow: `0 0 0 1px ${colorInfo.bg}33`,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onPinMouseDown?.(pin.name);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onPinMouseUp?.(pin.name);
                }}
              />
              {/* Label on hover - Blue background tooltip */}
              <div className="absolute left-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <span
                  className="text-[8px] font-semibold px-1 py-0.5 rounded shadow-md text-white"
                  style={{ backgroundColor: colorInfo.bg }}
                >
                  {pin.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

ArduinoBoard.displayName = 'ArduinoBoard';
