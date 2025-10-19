import React, { useState, useEffect, useRef } from 'react';
import { WOKWI_ELEMENTS } from '../constants';
import { LedIcon, PushButtonIcon, PotentiometerIcon, Dht22Icon, Lcd1602Icon, Ssd1306Icon, ServoIcon, KeypadIcon, RgbLedIcon, ResistorIcon, SevenSegmentIcon, NeoPixelIcon, NeoPixelRingIcon, NeoPixelMatrixIcon, PirMotionSensorIcon, NtcTempSensorIcon, GenericComponentIcon } from './icons/ComponentIcons';
import { PropertiesPanel } from './PropertiesPanel';
import type { ComponentInstance, PinConnectionMap, PinConnectionTarget } from '../types';

interface ComponentPaletteProps {
  onAddComponent: (type: string, defaults: Record<string, any>) => void;
  dragPreviewRef: React.RefObject<HTMLDivElement>;
  selectedComponent: ComponentInstance | null;
  selectedComponentPins: any[] | null;
  selectedComponentConnections: PinConnectionMap;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onDeleteComponent: (id: string) => void;
  onRemoveConnection: (componentId: string, pinName: string, target: PinConnectionTarget) => void;
  onComponentGridClick?: () => void;
}

type PaletteTab = 'components' | 'properties';

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent,
  dragPreviewRef,
  selectedComponent,
  selectedComponentPins,
  selectedComponentConnections,
  onUpdateComponent,
  onDeleteComponent,
  onRemoveConnection,
  onComponentGridClick
}) => {
  const [activeTab, setActiveTab] = useState<PaletteTab>('components');
  const previousSelectedComponentRef = useRef<string | null>(null);

  // Switch to properties tab when a NEW component is selected
  useEffect(() => {
    const currentId = selectedComponent?.id || null;
    const previousId = previousSelectedComponentRef.current;

    // Only auto-switch if a different component is selected (not just re-selecting the same one)
    if (selectedComponent && currentId !== previousId) {
      setActiveTab('properties');
    } else if (!selectedComponent && activeTab === 'properties') {
      // Switch back to components if no component is selected
      setActiveTab('components');
    }

    previousSelectedComponentRef.current = currentId;
  }, [selectedComponent, activeTab]);

  const handleDragStart = async (e: React.DragEvent<HTMLDivElement>, type: string, defaults: Record<string, any>) => {
    const data = JSON.stringify({ type, defaults });
    e.dataTransfer.setData('application/json', data);
  };

  return (
    <aside className="flex flex-col w-full h-full bg-white dark:bg-gray-800 select-none">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 px-4 py-3 text-sm font-semibold ${
            activeTab === 'components'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => selectedComponent && setActiveTab('properties')}
          disabled={!selectedComponent}
          className={`flex-1 px-4 py-3 text-sm font-semibold ${
            selectedComponent
              ? activeTab === 'properties'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          Properties
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'components' && (
          <div className="p-4 overflow-y-auto h-full auto-scrollbar">
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

        {activeTab === 'properties' && selectedComponent && (
          <div className="h-full overflow-y-auto auto-scrollbar">
            <PropertiesPanel
              key={selectedComponent.id}
              component={selectedComponent}
              pins={selectedComponentPins}
              connections={selectedComponentConnections}
              onUpdate={onUpdateComponent}
              onDelete={onDeleteComponent}
              onRemoveConnection={onRemoveConnection}
            />
          </div>
        )}

        {activeTab === 'properties' && !selectedComponent && (
          <div className="p-4 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 h-full flex items-center justify-center">
            <p className="text-center">Select a component on the canvas to see its properties.</p>
          </div>
        )}
      </div>
    </aside>
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
}