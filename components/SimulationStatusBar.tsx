import React from 'react';
import { formatTime } from '../services/simulation/format-time';

interface SimulationStatusBarProps {
    simulationTime: number;
    simulationSpeed: number;
    zoom: number;
    coords: { x: number; y: number };
}

export const SimulationStatusBar: React.FC<SimulationStatusBarProps> = ({
    simulationTime,
    simulationSpeed,
    zoom,
    coords
}) => {
    return (
        <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 text-gray-100 text-xs rounded p-2 pointer-events-none flex space-x-4">
            <span>Time: {formatTime(simulationTime)}</span>
            <span>Speed: {simulationSpeed.toFixed(1)}%</span>
            <span>Zoom: {zoom.toFixed(2)}x</span>
            <span>X: {coords.x.toFixed(0)}, Y: {coords.y.toFixed(0)}</span>
        </div>
    );
};