
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

  const baseClasses = "bg-gradient-to-r dark:bg-gradient-to-r from-gray-300 to-gray-300 dark:from-gray-700 dark:to-gray-700 hover:from-blue-500 hover:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-500 transition-colors shrink-0 relative";
  const orientationClasses = orientation === 'vertical'
    ? "w-1 cursor-col-resize rounded-full splitter-vertical"
    : "h-1 cursor-row-resize splitter-horizontal";

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${baseClasses} ${orientationClasses} ${className || ''}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
};
