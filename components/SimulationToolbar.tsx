import React from 'react';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { FitToScreenIcon } from './icons/FitToScreenIcon';
import { ResetViewIcon } from './icons/ResetViewIcon';

interface SimulationToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button
        onClick={onClick}
        title={title}
        className="p-2 text-gray-700 bg-white rounded-md shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
        {children}
    </button>
);


export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({ onZoomIn, onZoomOut, onFit, onReset }) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
      <ToolbarButton onClick={onZoomIn} title="Zoom In">
        <ZoomInIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onZoomOut} title="Zoom Out">
        <ZoomOutIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onFit} title="Fit to Screen">
        <FitToScreenIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onReset} title="Reset View">
        <ResetViewIcon />
      </ToolbarButton>
    </div>
  );
};