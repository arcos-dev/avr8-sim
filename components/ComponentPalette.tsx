import React from 'react';
import { WOKWI_ELEMENTS } from '../constants';
import { LedIcon, PushButtonIcon, PotentiometerIcon, Dht22Icon, Lcd1602Icon, Ssd1306Icon, ServoIcon, KeypadIcon, RgbLedIcon, ResistorIcon, SevenSegmentIcon, NeoPixelIcon, NeoPixelRingIcon, NeoPixelMatrixIcon, PirMotionSensorIcon, NtcTempSensorIcon, GenericComponentIcon } from './icons/ComponentIcons';


interface ComponentPaletteProps {
  onAddComponent: (type: string, defaults: Record<string, any>) => void;
  dragPreviewRef: React.RefObject<HTMLDivElement>;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent, dragPreviewRef }) => {
  
  const handleDragStart = async (e: React.DragEvent<HTMLDivElement>, type: string, defaults: Record<string, any>) => {
    const data = JSON.stringify({ type, defaults });
    e.dataTransfer.setData('application/json', data);

    // For simplicity, we will let the browser generate a default preview from the dragged element.
  };

  return (
    <aside className="p-4 overflow-y-auto w-full h-full">
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
    </aside>
  );
};

const getComponentIcon = (type: string) => {
    switch(type) {
        case 'wokwi-led': return <LedIcon />;
        case 'wokwi-pushbutton': return <PushButtonIcon />;
        case 'wokwi-potentiometer': return <PotentiometerIcon />;
        case 'wokwi-dht22': return <Dht22Icon />;
        case 'wokwi-lcd1602': return <Lcd1602Icon />;
        case 'wokwi-ssd1306': return <Ssd1306Icon />;
        case 'wokwi-servo': return <ServoIcon />;
        case 'wokwi-membrane-keypad': return <KeypadIcon />;
        case 'wokwi-rgb-led': return <RgbLedIcon />;
        case 'wokwi-resistor': return <ResistorIcon />;
        case 'wokwi-seven-segment': return <SevenSegmentIcon />;
        case 'wokwi-neopixel': return <NeoPixelIcon />;
        case 'wokwi-neopixel-ring': return <NeoPixelRingIcon />;
        case 'wokwi-neopixel-matrix': return <NeoPixelMatrixIcon />;
        case 'wokwi-pir-motion-sensor': return <PirMotionSensorIcon />;
        case 'wokwi-ntc-temperature-sensor': return <NtcTempSensorIcon />;
        default: return <GenericComponentIcon />;
    }
}