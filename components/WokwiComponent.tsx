import React, { useRef, useLayoutEffect } from 'react';
import type { ComponentInstance } from '../types';
import { getComponentMeta } from '../services/simulation/component-meta';

// Import local React components for hardware simulation
import { Led } from './hardware/Led';
import { PushButton } from './hardware/PushButton';
import { Resistor } from './hardware/Resistor';
import {
  Potentiometer,
  Dht22,
  Lcd1602,
  Ssd1306,
  Servo,
  MembraneKeypad,
  RgbLed,
  SevenSegment,
  NeoPixel,
  NeoPixelRing,
  NeoPixelMatrix,
  PirMotionSensor,
  NtcTempSensor,
} from './hardware/MiscComponents';


interface WokwiComponentProps {
  component: ComponentInstance;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, component: ComponentInstance) => void;
  onPinsLoaded: (componentId: string, pins: any[]) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onPinMouseDown: (componentId: string, pinName: string) => void;
  onPinMouseUp: (componentId: string, pinName: string) => void;
}

const componentMap: Record<string, React.ElementType> = {
  'led': Led,
  'pushbutton': PushButton,
  'resistor': Resistor,
  'potentiometer': Potentiometer,
  'dht22': Dht22,
  'lcd1602': Lcd1602,
  'ssd1306': Ssd1306,
  'servo': Servo,
  'membrane-keypad': MembraneKeypad,
  'rgb-led': RgbLed,
  'seven-segment': SevenSegment,
  'neopixel': NeoPixel,
  'neopixel-ring': NeoPixelRing,
  'neopixel-matrix': NeoPixelMatrix,
  'pir-motion-sensor': PirMotionSensor,
  'ntc-temperature-sensor': NtcTempSensor,
};


export const WokwiComponent: React.FC<WokwiComponentProps> = ({
    component,
    isSelected,
    onMouseDown,
    onPinsLoaded,
    registerRef,
    onPinMouseDown,
    onPinMouseUp,
}) => {
  const componentRef = useRef<HTMLElement & {componentType?: string}>(null);
  const { width, height, pins } = getComponentMeta(component.type);

  useLayoutEffect(() => {
    onPinsLoaded(component.id, pins);

    if (componentRef.current) {
        componentRef.current.componentType = component.type;
        registerRef(component.id, componentRef.current);
    }
    return () => registerRef(component.id, null);
  }, [component.id, component.type, pins, onPinsLoaded, registerRef]);

  const { id, type, x, y, ...wokwiProps } = component;

  const ComponentToRender = componentMap[type] || type;
  let propsToPass: Record<string, any> = wokwiProps;

  if (typeof ComponentToRender === 'string') {
    propsToPass = Object.entries(wokwiProps).reduce((acc, [key, value]) => {
      const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      acc[kebabKey] = value;
      return acc;
    }, {} as Record<string, any>);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isSelected ? 'move' : 'pointer',
      }}
      onMouseDown={(e) => onMouseDown(e, component)}
    >
      {React.createElement(ComponentToRender, {
        ref: componentRef,
        ...propsToPass,
      })}

      {pins.map((pin) => (
        <div
            key={`${component.id}-${pin.name}`}
            className="absolute group pointer-events-auto"
            style={{ left: pin.x, top: pin.y, transform: 'translate(-50%, -50%)' }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onPinMouseDown(component.id, pin.name); }}
            onMouseUp={(e) => { e.stopPropagation(); e.preventDefault(); onPinMouseUp(component.id, pin.name); }}
        >
            <div
                className="w-2.5 h-2.5 bg-blue-500/30 group-hover:bg-blue-500/80 rounded-full cursor-crosshair"
                title={`${pin.name}: ${pin.description || ''}`}
            />
            {/* Pin label visible on hover */}
            <div className="absolute left-1/2 top-full mt-1 transform -translate-x-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded shadow-lg">
                    {pin.name}
                </span>
            </div>
        </div>
      ))}

      {isSelected && (
        <div className="absolute inset-0 outline outline-2 outline-blue-500 rounded-sm pointer-events-none" />
      )}
    </div>
  );
};
