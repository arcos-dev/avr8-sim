import React, { useState, useEffect } from 'react';
import { ComponentPalette } from './ComponentPalette';
import { PropertiesPanel } from './PropertiesPanel';
import type { ComponentInstance, PinConnectionMap, PinConnectionTarget } from '../types';
import { WOKWI_ELEMENTS } from '../constants';
import { LedIcon, PushButtonIcon, PotentiometerIcon, Dht22Icon, Lcd1602Icon, Ssd1306Icon, ServoIcon, KeypadIcon, RgbLedIcon, ResistorIcon, SevenSegmentIcon, NeoPixelIcon, NeoPixelRingIcon, NeoPixelMatrixIcon, PirMotionSensorIcon, NtcTempSensorIcon, GenericComponentIcon } from './icons/ComponentIcons';

type ComponentPanelTab = 'palette' | 'properties';

interface ComponentPanelProps {
  onAddComponent: (type: string, defaults: Record<string, any>) => void;
  dragPreviewRef: React.RefObject<HTMLDivElement>;
  selectedComponent: ComponentInstance | null;
  selectedComponentPins: any[] | null;
  selectedComponentConnections: PinConnectionMap;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onDeleteComponent: (id: string) => void;
  onRemoveConnection: (componentId: string, pinName: string, target: PinConnectionTarget) => void;
  activeTab?: ComponentPanelTab;
  onTabChange?: (tab: ComponentPanelTab) => void;
}

export const ComponentPanel: React.FC<ComponentPanelProps> = ({
  onAddComponent,
  dragPreviewRef,
  selectedComponent,
  selectedComponentPins,
  selectedComponentConnections,
  onUpdateComponent,
  onDeleteComponent,
  onRemoveConnection,
  activeTab: externalActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<ComponentPanelTab>('palette');

  // Use external tab state if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const handleTabChange = (tab: ComponentPanelTab) => {
    if (externalActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };

  // Auto-switch to properties tab when component is selected
  useEffect(() => {
    if (selectedComponent && activeTab === 'palette') {
      handleTabChange('properties');
    }
  }, [selectedComponent?.id]);

  // Reset to palette tab when component is deselected
  useEffect(() => {
    if (!selectedComponent && activeTab === 'properties') {
      handleTabChange('palette');
    }
  }, [selectedComponent]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string, defaults: Record<string, any>) => {
    const data = JSON.stringify({ type, defaults });
    e.dataTransfer.setData('application/json', data);
    // Auto-switch to palette tab when dragging
    handleTabChange('palette');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Tab Navigation */}
      <div className="flex items-center gap-0 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => handleTabChange('palette')}
          className={`flex-1 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'palette'
              ? 'border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => handleTabChange('properties')}
          disabled={!selectedComponent}
          className={`flex-1 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            selectedComponent
              ? activeTab === 'properties'
                ? 'border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          Properties
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'palette' && (
          <div className="h-full overflow-y-auto p-4 auto-scrollbar">
            <h2 className="text-lg font-semibold mb-4">Components</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(WOKWI_ELEMENTS).map(([type, { label, ...defaults }]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type, defaults)}
                  className="flex flex-col items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all"
                  title={`Drag to add ${label}`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getComponentIcon(type)}
                  </div>
                  <span className="text-xs text-center mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="h-full overflow-y-auto auto-scrollbar">
            {selectedComponent ? (
              <PropertiesPanel
                key={selectedComponent.id}
                component={selectedComponent}
                pins={selectedComponentPins}
                connections={selectedComponentConnections}
                onUpdate={onUpdateComponent}
                onDelete={onDeleteComponent}
                onRemoveConnection={onRemoveConnection}
              />
            ) : (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                Select a component on the canvas to see its properties.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const getComponentIcon = (type: string) => {
  switch(type) {
    case 'led': return <LedIcon />;
    case 'pushbutton': return <PushButtonIcon />;
    case 'potentiometer': return <PotentiometerIcon />;
    case 'dht22': return <Dht22Icon />;
    case 'lcd1602': return <Lcd1602Icon />;
    case 'ssd1306': return <Ssd1306Icon />;
    case 'servo': return <ServoIcon />;
    case 'membrane-keypad': return <KeypadIcon />;
    case 'rgb-led': return <RgbLedIcon />;
    case 'resistor': return <ResistorIcon />;
    case 'seven-segment': return <SevenSegmentIcon />;
    case 'neopixel': return <NeoPixelIcon />;
    case 'neopixel-ring': return <NeoPixelRingIcon />;
    case 'neopixel-matrix': return <NeoPixelMatrixIcon />;
    case 'pir-motion-sensor': return <PirMotionSensorIcon />;
    case 'ntc-temperature-sensor': return <NtcTempSensorIcon />;
    default: return <GenericComponentIcon />;
  }
};
