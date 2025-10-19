import React, { useState } from 'react';
import type { BoardType } from '../types';
import { ArduinoBoard } from './ArduinoBoard';

interface BoardProps {
  boardType: BoardType;
  onPinMouseDown: (componentId: string, pinName: string) => void;
  onPinMouseUp: (componentId: string, pinName: string) => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const BOARD_COMPONENT_ID = 'board';

export const Board = React.forwardRef<HTMLDivElement, BoardProps>(
  ({ boardType, onPinMouseDown, onPinMouseUp, position = { x: 0, y: 0 }, onPositionChange }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        onPositionChange?.({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragStart, position, onPositionChange]);

    try {
      return (
        <ArduinoBoard
          ref={ref}
          boardType={boardType}
          x={0}
          y={0}
          isDragging={isDragging}
          onMouseDown={handleMouseDown}
          onPinMouseDown={(pinName) => onPinMouseDown(BOARD_COMPONENT_ID, pinName)}
          onPinMouseUp={(pinName) => onPinMouseUp(BOARD_COMPONENT_ID, pinName)}
        />
      );
    } catch (e) {
      // Fallback if component meta not found
      return (
        <div className="relative bg-gray-200 dark:bg-gray-700 rounded p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Board not available</p>
        </div>
      );
    }
  }
);
