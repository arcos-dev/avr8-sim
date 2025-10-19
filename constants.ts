
import type { BoardType } from './types';

export const BOARDS: BoardType[] = ['uno', 'nano', 'mega'];

export const COMPONENTS = {
  'led': { color: 'red', label: 'LED' },
  'pushbutton': { color: 'blue', label: 'Push Button' },
  'potentiometer': { label: 'Potentiometer' },
  'dht22': { label: 'DHT22 Sensor' },
  'lcd1602': { label: 'LCD 16x2' },
  'ssd1306': { label: 'OLED Display' },
  'servo': { label: 'Servo Motor' },
  'membrane-keypad': { label: 'Membrane Keypad' },
  'rgb-led': { label: 'RGB LED (Common Anode)'},
  'resistor': { value: '1000', label: 'Resistor' },
  'seven-segment': { label: '7-Segment Display'},
  'neopixel': { label: 'NeoPixel LED' },
  'neopixel-ring': { label: 'NeoPixel Ring' },
  'neopixel-matrix': { label: 'NeoPixel Matrix' },
  'pir-motion-sensor': { label: 'PIR Motion Sensor' },
  'ntc-temperature-sensor': { label: 'NTC Temp Sensor' },
};

// Keep WOKWI_ELEMENTS as alias for backward compatibility during transition
export const WOKWI_ELEMENTS = COMPONENTS;

export const BOARD_ELEMENTS = {
    'uno': 'arduino-uno',
    'nano': 'arduino-nano',
    'mega': 'arduino-mega'
};
