import React from 'react';
import { BOARD_ELEMENTS } from '../constants';
import { getComponentMeta } from '../services/simulation/component-meta';
import type { BoardType, WireSignalType } from '../types';

interface BoardProps {
  boardType: BoardType;
  onPinMouseDown: (componentId: string, pinName: string) => void;
  onPinMouseUp: (componentId: string, pinName: string) => void;
}

const BOARD_COMPONENT_ID = 'board';

const SIGNAL_VARIANTS: Record<WireSignalType | 'default', { dot: string; halo: string; text: string }> = {
  power: { dot: 'bg-rose-500', halo: 'bg-rose-300/40', text: 'text-rose-600 dark:text-rose-300' },
  ground: { dot: 'bg-slate-700', halo: 'bg-slate-400/40', text: 'text-slate-700 dark:text-slate-200' },
  analog: { dot: 'bg-emerald-500', halo: 'bg-emerald-300/35', text: 'text-emerald-600 dark:text-emerald-300' },
  pwm: { dot: 'bg-amber-500', halo: 'bg-amber-300/40', text: 'text-amber-600 dark:text-amber-300' },
  serial: { dot: 'bg-purple-500', halo: 'bg-purple-300/35', text: 'text-purple-600 dark:text-purple-300' },
  digital: { dot: 'bg-sky-500', halo: 'bg-sky-300/40', text: 'text-sky-600 dark:text-sky-300' },
  default: { dot: 'bg-sky-500', halo: 'bg-sky-300/40', text: 'text-sky-600 dark:text-sky-300' },
};

export const Board = React.forwardRef<HTMLElement, BoardProps>(({ boardType, onPinMouseDown, onPinMouseUp }, ref) => {
  const boardElementName = BOARD_ELEMENTS[boardType];
  const boardMeta = getComponentMeta(boardElementName);

  return (
    <div className="relative" style={{ width: boardMeta.width, height: boardMeta.height }}>
      {React.createElement(boardElementName, { ref })}
      <div className="absolute inset-0 pointer-events-none">
        {boardMeta.pins.map((pin) => {
          const signalKey = (pin.signal ?? 'digital') as WireSignalType;
          const variant = SIGNAL_VARIANTS[signalKey] ?? SIGNAL_VARIANTS.default;
          const aliasesLabel = pin.aliases?.length ? ` (${pin.aliases.join(', ')})` : '';
          const tooltipParts = [pin.name, pin.aliases?.join(', '), pin.description].filter(Boolean);
          const tooltip = tooltipParts.join(' • ') || pin.name;

          return (
            <div
              key={`board-${pin.name}-${pin.x}-${pin.y}`}
              className="absolute pointer-events-auto"
              style={{ left: pin.x, top: pin.y, transform: 'translate(-50%, -50%)' }}
            >
              <button
                type="button"
                className="group relative flex h-5 w-5 items-center justify-center focus:outline-none"
                data-signal={signalKey}
                title={tooltip}
                aria-label={tooltip}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onPinMouseDown(BOARD_COMPONENT_ID, pin.name);
                }}
                onMouseUp={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onPinMouseUp(BOARD_COMPONENT_ID, pin.name);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onPinMouseDown(BOARD_COMPONENT_ID, pin.name);
                    onPinMouseUp(BOARD_COMPONENT_ID, pin.name);
                  }
                }}
              >
                <span
                  className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-80 ${variant.halo}`}
                />
                <span
                  className={`h-2.5 w-2.5 rounded-full border border-white/60 shadow-sm transition-transform duration-150 group-hover:scale-110 ${variant.dot}`}
                />
                <span className="absolute top-full mt-1 flex flex-col items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm bg-white/95 dark:bg-gray-900/85 ${variant.text}`}>
                    {pin.name}
                    {aliasesLabel}
                  </span>
                  {pin.description && (
                    <span className="mt-0.5 text-[9px] leading-tight px-1 py-0.5 rounded bg-white/85 text-gray-600 dark:bg-gray-900/85 dark:text-gray-200 shadow-sm">
                      {pin.description}
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
