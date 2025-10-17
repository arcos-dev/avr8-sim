
import type { BoardType } from './types';

export const BOARDS: BoardType[] = ['uno', 'nano', 'mega'];

export const WOKWI_ELEMENTS = {
  'wokwi-led': { color: 'red', label: 'LED' },
  'wokwi-pushbutton': { color: 'blue', label: 'Push Button' },
  'wokwi-potentiometer': { label: 'Potentiometer' },
  'wokwi-dht22': { label: 'DHT22 Sensor' },
  'wokwi-lcd1602': { label: 'LCD 16x2' },
  'wokwi-ssd1306': { label: 'OLED Display' },
  'wokwi-servo': { label: 'Servo Motor' },
  'wokwi-membrane-keypad': { label: 'Membrane Keypad' },
  'wokwi-rgb-led': { label: 'RGB LED (Common Anode)'},
  'wokwi-resistor': { value: '1000', label: 'Resistor' },
  'wokwi-seven-segment': { label: '7-Segment Display'},
  'wokwi-neopixel': { label: 'NeoPixel LED' },
  'wokwi-neopixel-ring': { label: 'NeoPixel Ring' },
  'wokwi-neopixel-matrix': { label: 'NeoPixel Matrix' },
  'wokwi-pir-motion-sensor': { label: 'PIR Motion Sensor' },
  'wokwi-ntc-temperature-sensor': { label: 'NTC Temp Sensor' },
};

export const BOARD_ELEMENTS = {
    'uno': 'wokwi-arduino-uno',
    'nano': 'wokwi-arduino-nano',
    'mega': 'wokwi-arduino-mega'
};
