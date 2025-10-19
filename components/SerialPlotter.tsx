import React, { useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ResetViewIcon } from './icons/ResetViewIcon';

interface SerialPlotterProps {
  serialOutput: string;
}

const MAX_DATA_POINTS = 500; // Increased buffer for a smoother plot
const PLOT_COLORS = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#a855f7', // purple-500
    '#f97316', // orange-500
];

const PlotterButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button
        onClick={onClick}
        title={title}
        className="p-1.5 text-gray-700 bg-white/80 rounded-md shadow-md hover:bg-gray-100/80 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
        {children}
    </button>
);

export const SerialPlotter: React.FC<SerialPlotterProps> = ({ serialOutput }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<number[][]>([]);
  const lastProcessedIndex = useRef(0);
  const incompleteLineRef = useRef('');
  const { theme } = useTheme();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Debug: log incoming data
    console.log('SerialPlotter received:', {
      serialOutput: serialOutput?.substring(0, 100),
      length: serialOutput?.length,
      lastProcessedIndex: lastProcessedIndex.current,
    });

    // Handle the "Clear Output" case
    if (!serialOutput || (serialOutput.length === 0 && lastProcessedIndex.current > 0)) {
        setData([]);
        lastProcessedIndex.current = 0;
        incompleteLineRef.current = '';
        return;
    }

    // Don't process if no new data
    if (!serialOutput || serialOutput.length <= lastProcessedIndex.current) {
      return;
    }

    // Process new incoming data
    const newChunk = serialOutput.substring(lastProcessedIndex.current);
    lastProcessedIndex.current = serialOutput.length;

    const fullBuffer = incompleteLineRef.current + newChunk;
    const lines = fullBuffer.split('\n');

    // The last item in the array is either an empty string or an incomplete line
    incompleteLineRef.current = lines.pop() || '';

    if (lines.length === 0) {
      return; // No complete lines to process yet
    }

    const newPoints = lines
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        return trimmed.split(',')
            .map(val => parseFloat(val.trim()))
            .filter(num => !isNaN(num));
      })
      .filter(point => point.length > 0);

    console.log('Parsed newPoints:', newPoints);

    if (newPoints.length > 0) {
      setData(prevData => {
        console.log('Setting data:', { prevLength: prevData.length, newPoints: newPoints.length });
        // If the number of variables changes, reset the buffer with the new points
        if (prevData.length > 0 && newPoints[0].length !== prevData[prevData.length - 1].length) {
          return newPoints.slice(-MAX_DATA_POINTS);
        }
        const combined = [...prevData, ...newPoints];
        return combined.slice(-MAX_DATA_POINTS);
      });
    }
  }, [serialOutput]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 20));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 1));
  const handleResetZoom = () => setZoom(1);

  const themeColors = useMemo(() => ({
    bg: theme === 'dark' ? '#252526' : '#f5f5f5',
    grid: theme === 'dark' ? '#3E3E42' : '#E7E7E7',
    text: theme === 'dark' ? '#F5F5F5' : '#1E1E1E'
  }), [theme]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      draw();
    });
    resizeObserver.observe(container);

    const PADDING = { top: 10, right: 10, bottom: 20, left: 40 };

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, width, height);

      const pointsToShow = Math.max(2, Math.floor(data.length / zoom));
      const visibleData = data.slice(-pointsToShow);

      if (visibleData.length < 2) {
        ctx.fillStyle = themeColors.text;
        ctx.font = `${12 * window.devicePixelRatio}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for data...', width / 2, height / 2);
        return;
      }

      const flatVisibleData = visibleData.flat();
      let yMin = Math.min(...flatVisibleData);
      let yMax = Math.max(...flatVisibleData);

      if (yMin === yMax) {
        yMin -= 10;
        yMax += 10;
      }

      const yRange = yMax - yMin;
      yMin -= yRange * 0.1;
      yMax += yRange * 0.1;
      const effectiveYRange = yMax - yMin;

      const plotWidth = width - PADDING.left - PADDING.right;
      const plotHeight = height - PADDING.top - PADDING.bottom;

      ctx.strokeStyle = themeColors.grid;
      ctx.lineWidth = window.devicePixelRatio;
      ctx.font = `${10 * window.devicePixelRatio}px sans-serif`;
      ctx.fillStyle = themeColors.text;

      const numYGridLines = 5;
      for (let i = 0; i <= numYGridLines; i++) {
          const y = PADDING.top + (i / numYGridLines) * plotHeight;
          const value = yMax - (i / numYGridLines) * effectiveYRange;

          ctx.beginPath();
          ctx.moveTo(PADDING.left, y);
          ctx.lineTo(width - PADDING.right, y);
          ctx.stroke();

          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(value.toFixed(1), PADDING.left - 5, y);
      }

      const numVars = visibleData[0].length;
      for (let varIndex = 0; varIndex < numVars; varIndex++) {
        ctx.strokeStyle = PLOT_COLORS[varIndex % PLOT_COLORS.length];
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.beginPath();

        visibleData.forEach((point, i) => {
          if (point.length <= varIndex) return;

          const x = visibleData.length > 1
            ? PADDING.left + (i / (visibleData.length - 1)) * plotWidth
            : PADDING.left + plotWidth / 2;
          const y = PADDING.top + (1 - (point[varIndex] - yMin) / effectiveYRange) * plotHeight;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        ctx.fillStyle = PLOT_COLORS[varIndex % PLOT_COLORS.length];
        ctx.fillRect(PADDING.left + varIndex * 70, height - PADDING.bottom + 5, 10 * window.devicePixelRatio, 10 * window.devicePixelRatio);
        ctx.fillStyle = themeColors.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Var ${varIndex + 1}`, PADDING.left + varIndex * 70 + 12 * window.devicePixelRatio, height - PADDING.bottom + 4);
      }
    };

    draw();

    return () => resizeObserver.disconnect();
  }, [data, themeColors, zoom]);


  return (
    <div ref={containerRef} className="w-full h-full bg-gray-100 dark:bg-gray-800 relative">
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <PlotterButton onClick={handleZoomIn} title="Zoom In">
            <ZoomInIcon />
        </PlotterButton>
        <PlotterButton onClick={handleZoomOut} title="Zoom Out">
            <ZoomOutIcon />
        </PlotterButton>
        <PlotterButton onClick={handleResetZoom} title="Reset Zoom">
            <ResetViewIcon />
        </PlotterButton>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};