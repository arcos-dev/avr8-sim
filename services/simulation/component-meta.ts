import type { WireSignalType } from "../../types";
export interface ComponentPin {
  name: string;
  x: number;
  y: number;
  description?: string;
  signal?: WireSignalType;
  aliases?: string[];
}

export interface ComponentMeta {
  pins: ComponentPin[];
  width: number;
  height: number;
}

const DEFAULT_META: ComponentMeta = {
    width: 64,
    height: 64,
    pins: [],
}

const UNO_META: ComponentMeta = {
  width: 270,
  height: 212,
  pins: [
    { name: 'AREF', x: 126.9, y: 13.5, description: 'Analog reference', signal: 'analog' },
    { name: 'GND', x: 136.6, y: 13.5, description: 'Ground', signal: 'ground' },
    { name: '13', x: 146.4, y: 13.5, description: 'Digital 13 (SCK)', signal: 'digital', aliases: ['D13'] },
    { name: '12', x: 156.2, y: 13.5, description: 'Digital 12 (MISO)', signal: 'digital', aliases: ['D12'] },
    { name: '11', x: 166, y: 13.5, description: 'Digital 11 (MOSI, PWM)', signal: 'pwm', aliases: ['D11'] },
    { name: '10', x: 175.8, y: 13.5, description: 'Digital 10 (SS, PWM)', signal: 'pwm', aliases: ['D10'] },
    { name: '9', x: 185.6, y: 13.5, description: 'Digital 9 (PWM)', signal: 'pwm', aliases: ['D9'] },
    { name: '8', x: 195.4, y: 13.5, description: 'Digital 8', signal: 'digital', aliases: ['D8'] },
    { name: '7', x: 215, y: 13.5, description: 'Digital 7', signal: 'digital', aliases: ['D7'] },
    { name: '6', x: 224.8, y: 13.5, description: 'Digital 6 (PWM)', signal: 'pwm', aliases: ['D6'] },
    { name: '5', x: 234.6, y: 13.5, description: 'Digital 5 (PWM)', signal: 'pwm', aliases: ['D5'] },
    { name: '4', x: 244.4, y: 13.5, description: 'Digital 4', signal: 'digital', aliases: ['D4'] },
    { name: '3', x: 254.2, y: 13.5, description: 'Digital 3 (PWM)', signal: 'pwm', aliases: ['D3'] },
    { name: '2', x: 264, y: 13.5, description: 'Digital 2', signal: 'digital', aliases: ['D2'] },
    { name: '1', x: 273.8, y: 13.5, description: 'Digital 1 (TX)', signal: 'serial', aliases: ['D1', 'TX0'] },
    { name: '0', x: 283.6, y: 13.5, description: 'Digital 0 (RX)', signal: 'serial', aliases: ['D0', 'RX0'] },
    // Power pins
    { name: 'RESET', x: 106.8, y: 198.8, description: 'Reset', signal: 'digital' },
    { name: '3.3V', x: 116.6, y: 198.8, description: '3.3V supply', signal: 'power' },
    { name: '5V', x: 126.4, y: 198.8, description: '5V supply', signal: 'power' },
    { name: 'GND', x: 136.2, y: 198.8, description: 'Ground', signal: 'ground' },
    { name: 'GND', x: 146, y: 198.8, description: 'Ground', signal: 'ground' },
    { name: 'VIN', x: 155.8, y: 198.8, description: 'Voltage input', signal: 'power' },
    // Analog pins
    { name: 'A0', x: 175.8, y: 198.8, signal: 'analog' },
    { name: 'A1', x: 185.6, y: 198.8, signal: 'analog' },
    { name: 'A2', x: 195.4, y: 198.8, signal: 'analog' },
    { name: 'A3', x: 205.2, y: 198.8, signal: 'analog' },
    { name: 'A4', x: 215, y: 198.8, description: 'A4 (SDA)', signal: 'analog', aliases: ['SDA'] },
    { name: 'A5', x: 224.8, y: 198.8, description: 'A5 (SCL)', signal: 'analog', aliases: ['SCL'] },
  ],
};

const NANO_META: ComponentMeta = {
  width: 72,
  height: 172,
  pins: [
    // Left side
    { name: 'D13', x: 5.4, y: 16.6, signal: 'digital', aliases: ['13'] },
    { name: '3.3V', x: 5.4, y: 26.1, signal: 'power', description: '3.3V supply' },
    { name: 'AREF', x: 5.4, y: 35.6, signal: 'analog', description: 'Analog reference' },
    { name: 'A0', x: 5.4, y: 45.1, signal: 'analog' },
    { name: 'A1', x: 5.4, y: 54.6, signal: 'analog' },
    { name: 'A2', x: 5.4, y: 64.1, signal: 'analog' },
    { name: 'A3', x: 5.4, y: 73.6, signal: 'analog' },
    { name: 'A4', x: 5.4, y: 83.1, signal: 'analog', aliases: ['SDA'] },
    { name: 'A5', x: 5.4, y: 92.6, signal: 'analog', aliases: ['SCL'] },
    { name: 'A6', x: 5.4, y: 102.1, signal: 'analog' },
    { name: 'A7', x: 5.4, y: 111.6, signal: 'analog' },
    { name: '5V', x: 5.4, y: 124.6, signal: 'power', description: '5V supply' },
    { name: 'RESET', x: 5.4, y: 134.1, signal: 'digital' },
    { name: 'GND', x: 5.4, y: 143.6, signal: 'ground' },
    { name: 'VIN', x: 5.4, y: 153.1, signal: 'power' },
    // Right side
    { name: 'D12', x: 66.8, y: 16.6, signal: 'digital', aliases: ['12'] },
    { name: 'D11', x: 66.8, y: 26.1, signal: 'pwm', aliases: ['11'] },
    { name: 'D10', x: 66.8, y: 35.6, signal: 'pwm', aliases: ['10'] },
    { name: 'D9', x: 66.8, y: 45.1, signal: 'pwm', aliases: ['9'] },
    { name: 'D8', x: 66.8, y: 54.6, signal: 'digital', aliases: ['8'] },
    { name: 'D7', x: 66.8, y: 64.1, signal: 'digital', aliases: ['7'] },
    { name: 'D6', x: 66.8, y: 73.6, signal: 'pwm', aliases: ['6'] },
    { name: 'D5', x: 66.8, y: 83.1, signal: 'pwm', aliases: ['5'] },
    { name: 'D4', x: 66.8, y: 92.6, signal: 'digital', aliases: ['4'] },
    { name: 'D3', x: 66.8, y: 102.1, signal: 'pwm', aliases: ['3'] },
    { name: 'D2', x: 66.8, y: 111.6, signal: 'digital', aliases: ['2'] },
    { name: 'D1', x: 66.8, y: 124.6, signal: 'serial', description: 'TX', aliases: ['1', 'TX0'] },
    { name: 'D0', x: 66.8, y: 134.1, signal: 'serial', description: 'RX', aliases: ['0', 'RX0'] },
    { name: 'RESET', x: 66.8, y: 143.6, signal: 'digital' },
    { name: 'GND', x: 66.8, y: 153.1, signal: 'ground' },
  ],
};

const MEGA_META: ComponentMeta = {
  width: 400,
  height: 212,
  pins: [
    // Digital pins (PWM capable 2-13)
    { name: '13', x: 145.4, y: 13.5, signal: 'pwm', aliases: ['D13'] },
    { name: '12', x: 155.2, y: 13.5, signal: 'pwm', aliases: ['D12'] },
    { name: '11', x: 165, y: 13.5, signal: 'pwm', aliases: ['D11'] },
    { name: '10', x: 174.8, y: 13.5, signal: 'pwm', aliases: ['D10'] },
    { name: '9', x: 184.6, y: 13.5, signal: 'pwm', aliases: ['D9'] },
    { name: '8', x: 194.4, y: 13.5, signal: 'digital', aliases: ['D8'] },
    { name: '7', x: 215.8, y: 13.5, signal: 'digital', aliases: ['D7'] },
    { name: '6', x: 225.6, y: 13.5, signal: 'pwm', aliases: ['D6'] },
    { name: '5', x: 235.4, y: 13.5, signal: 'pwm', aliases: ['D5'] },
    { name: '4', x: 245.2, y: 13.5, signal: 'pwm', aliases: ['D4'] },
    { name: '3', x: 255, y: 13.5, signal: 'pwm', aliases: ['D3'] },
    { name: '2', x: 264.8, y: 13.5, signal: 'pwm', aliases: ['D2'] },
    // Communication pins
    { name: 'TX1', x: 284.4, y: 13.5, signal: 'serial', description: 'Digital 18', aliases: ['D18'] },
    { name: 'RX1', x: 294.2, y: 13.5, signal: 'serial', description: 'Digital 19', aliases: ['D19'] },
    { name: 'SDA', x: 304, y: 13.5, signal: 'serial', description: 'I2C SDA (Digital 20)', aliases: ['D20'] },
    { name: 'SCL', x: 313.8, y: 13.5, signal: 'serial', description: 'I2C SCL (Digital 21)', aliases: ['D21'] },
    { name: 'TX0', x: 382.4, y: 13.5, signal: 'serial', description: 'UART0 TX (Digital 1)', aliases: ['D1'] },
    { name: 'RX0', x: 392.2, y: 13.5, signal: 'serial', description: 'UART0 RX (Digital 0)', aliases: ['D0'] },
    // Power rail
    { name: 'VIN', x: 259.6, y: 198.8, signal: 'power' },
    { name: 'GND', x: 269.4, y: 198.8, signal: 'ground' },
    { name: 'GND', x: 279.2, y: 198.8, signal: 'ground' },
    { name: '5V', x: 289, y: 198.8, signal: 'power' },
    { name: '3.3V', x: 298.8, y: 198.8, signal: 'power' },
    { name: 'RESET', x: 308.6, y: 198.8, signal: 'digital' },
    // Analog inputs
    { name: 'A0', x: 327.2, y: 198.8, signal: 'analog' },
    { name: 'A1', x: 337, y: 198.8, signal: 'analog' },
    { name: 'A2', x: 346.8, y: 198.8, signal: 'analog' },
    { name: 'A3', x: 356.6, y: 198.8, signal: 'analog' },
    { name: 'A4', x: 366.4, y: 198.8, signal: 'analog' },
    { name: 'A5', x: 376.2, y: 198.8, signal: 'analog' },
    { name: 'A6', x: 386, y: 198.8, signal: 'analog' },
    { name: 'A7', x: 395.8, y: 198.8, signal: 'analog' },
    { name: 'A8', x: 194.4, y: 198.8, signal: 'analog' },
    { name: 'A9', x: 184.6, y: 198.8, signal: 'analog' },
    { name: 'A10', x: 174.8, y: 198.8, signal: 'analog' },
    { name: 'A11', x: 165, y: 198.8, signal: 'analog' },
    { name: 'A12', x: 155.2, y: 198.8, signal: 'analog' },
    { name: 'A13', x: 145.4, y: 198.8, signal: 'analog' },
    { name: 'A14', x: 135.6, y: 198.8, signal: 'analog' },
    { name: 'A15', x: 125.8, y: 198.8, signal: 'analog' },
  ],
};

export const COMPONENT_META: Record<string, ComponentMeta> = {
  'arduino-uno': UNO_META,
  'arduino-nano': NANO_META,
  'arduino-mega': MEGA_META,
  'led': {
    width: 40,
    height: 40,
    pins: [
      { name: 'A', x: 15, y: 40, description: 'Anode (+)' },
      { name: 'C', x: 25, y: 40, description: 'Cathode (-)' }
    ],
  },
  'pushbutton': {
    width: 40,
    height: 40,
    pins: [
      { name: '1A', x: 10, y: 0, description: 'Terminal 1A' },
      { name: '1B', x: 10, y: 40, description: 'Terminal 1B' },
      { name: '2A', x: 30, y: 0, description: 'Terminal 2A' },
      { name: '2B', x: 30, y: 40, description: 'Terminal 2B' },
    ],
  },
  'resistor': {
    width: 80,
    height: 42,
    pins: [
      { name: '1', x: 0, y: 15, description: 'Terminal 1' },
      { name: '2', x: 80, y: 15, description: 'Terminal 2' },
    ],
  },
  'potentiometer': {
    width: 50,
    height: 50,
    pins: [
      { name: 'GND', x: 5, y: 50, description: 'Ground' },
      { name: 'SIG', x: 25, y: 50, description: 'Signal' },
      { name: 'VCC', x: 45, y: 50, description: 'Voltage' },
    ],
  },
  'dht22': {
    width: 50,
    height: 55,
    pins: [
      { name: 'VCC', x: 5, y: 55 },
      { name: 'SDA', x: 18, y: 55 },
      { name: 'NC', x: 31, y: 55 },
      { name: 'GND', x: 44, y: 55 },
    ],
  },
  'lcd1602': {
    width: 160,
    height: 60,
    pins: [
      { name: 'GND', x: 10, y: 0 }, { name: 'VCC', x: 20, y: 0 }, { name: 'V0', x: 30, y: 0 },
      { name: 'RS', x: 40, y: 0 }, { name: 'RW', x: 50, y: 0 }, { name: 'E', x: 60, y: 0 },
      { name: 'D4', x: 90, y: 0 }, { name: 'D5', x: 100, y: 0 }, { name: 'D6', x: 110, y: 0 },
      { name: 'D7', x: 120, y: 0 }, { name: 'A', x: 130, y: 0 }, { name: 'K', x: 140, y: 0 },
    ],
  },
  'ssd1306': {
    width: 70,
    height: 40,
    pins: [
      { name: 'GND', x: 10, y: 0 }, { name: 'VCC', x: 25, y: 0 },
      { name: 'SCL', x: 40, y: 0 }, { name: 'SDA', x: 55, y: 0 },
    ],
  },
  'servo': { width: 60, height: 60, pins: [] },
  'membrane-keypad': { width: 80, height: 90, pins: [] },
  'rgb-led': { width: 40, height: 40, pins: [] },
  'seven-segment': { width: 40, height: 60, pins: [] },
  'neopixel': { width: 25, height: 25, pins: [] },
  'neopixel-ring': { width: 80, height: 80, pins: [] },
  'neopixel-matrix': { width: 100, height: 100, pins: [] },
  'pir-motion-sensor': { width: 50, height: 60, pins: [] },
  'ntc-temperature-sensor': { width: 30, height: 50, pins: [] },
};

export function getComponentMeta(type: string): ComponentMeta {
    return COMPONENT_META[type] || DEFAULT_META;
}







