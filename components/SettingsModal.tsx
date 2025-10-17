
import React, { useState } from 'react';
import type { SimulationSettings } from '../types';

interface SettingsModalProps {
  currentUrl: string;
  defaultUrl: string;
  simulationSettings: SimulationSettings;
  defaultSimulationSettings: SimulationSettings;
  onClose: () => void;
  onSave: (options: { compilerUrl: string; simulation: SimulationSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUrl,
  defaultUrl,
  simulationSettings,
  defaultSimulationSettings,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [simulateElectronFlow, setSimulateElectronFlow] = useState(simulationSettings.simulateElectronFlow);

  const handleSave = () => {
    onSave({
      compilerUrl: url,
      simulation: {
        simulateElectronFlow,
      },
    });
    onClose();
  };

  const handleReset = () => {
    setUrl(defaultUrl);
    setSimulateElectronFlow(defaultSimulationSettings.simulateElectronFlow);
  };

  return (
    <div 
        className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Compiler Settings</h2>
        
        <div className="mb-4">
          <label htmlFor="compiler-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Build Server URL
          </label>
          <input
            type="text"
            id="compiler-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., http://127.0.0.1:9090"
          />
        </div>

        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
            Simulation
          </h3>
          <div className="flex items-center justify-between mt-4">
            <div className="pr-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Electron Flow Visualization
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Animate current flow along wires in real time during simulation.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={simulateElectronFlow}
                onChange={(e) => setSimulateElectronFlow(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors"></div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                {simulateElectronFlow ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
