
import React from 'react';

interface SplitterProps {
  onResize: (delta: number) => void;
  orientation: 'vertical' | 'horizontal';
  className?: string;
}

export const Splitter: React.FC<SplitterProps> = ({ onResize, orientation, className }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = orientation === 'vertical' ? moveEvent.movementX : moveEvent.movementY;
      onResize(delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const baseClasses = "bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors shrink-0";
  const orientationClasses = orientation === 'vertical'
    ? "w-1.5 cursor-col-resize"
    : "h-1.5 cursor-row-resize";

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${baseClasses} ${orientationClasses} ${className || ''}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
};
