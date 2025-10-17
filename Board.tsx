import React from 'react';
import { BOARD_ELEMENTS } from '../constants';
import { getComponentMeta } from '../services/simulation/component-meta';
import type { BoardType } from '../types';

interface BoardProps {
    boardType: BoardType;
    onPinClick: (componentId: string, pinName: string) => void;
}

const BOARD_COMPONENT_ID = 'board';

export const Board = React.forwardRef<HTMLElement, BoardProps>(({ boardType, onPinClick }, ref) => {
    const boardElementName = BOARD_ELEMENTS[boardType];
    const boardMeta = getComponentMeta(boardElementName);

    return (
        <div className="relative" style={{ width: boardMeta.width, height: boardMeta.height }}>
            {React.createElement(boardElementName, { ref })}
            {/* Overlay for pins */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {boardMeta.pins.map((pin) => (
                    <div
                        key={`board-${pin.name}-${pin.x}-${pin.y}`}
                        className="absolute group pointer-events-auto"
                        style={{ left: pin.x, top: pin.y, transform: 'translate(-50%, -50%)' }}
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onPinClick(BOARD_COMPONENT_ID, pin.name); }}
                    >
                        <div
                            className="w-2.5 h-2.5 bg-blue-500/30 group-hover:bg-blue-500/80 rounded-full cursor-crosshair"
                            title={`${pin.name}: ${pin.description || ''}`}
                        />
                        {/* Pin label visible on hover */}
                        <div className="absolute left-1/2 top-full mt-1 transform -translate-x-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded shadow-lg">
                                {pin.name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});