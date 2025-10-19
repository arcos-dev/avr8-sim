import {
  avrInstruction,
  AVRTimer,
  CPU,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRUSART,
  usart0Config,
  AVREEPROM,
  PinState,
} from 'avr8js';
import { loadHex } from './intelhex';
import { EEPROMLocalStorageBackend } from './eeprom';

// ATmega328p params
const FLASH = 0x8000;

class SimAVRIOPort extends AVRIOPort {
    constructor(cpu: CPU, config: any) {
        super(cpu, config);
    }

    setPin(pin: number, state: boolean) {
        (this as any).pinState[pin] = state ? PinState.High: PinState.Low;
    }
}

type SimAVRIOPortWithListener = SimAVRIOPort & {
  addListener: (listener: (value: number, oldValue: number) => void) => void;
};

export class AVRRunner {
  readonly program = new Uint16Array(FLASH);
  readonly cpu: CPU;
  readonly timer0: AVRTimer;
  readonly timer1: AVRTimer;
  readonly timer2: AVRTimer;
  readonly portB: SimAVRIOPortWithListener;
  readonly portC: SimAVRIOPortWithListener;
  readonly portD: SimAVRIOPortWithListener;
  readonly usart: AVRUSART;
  readonly eeprom: AVREEPROM;

  readonly frequency = 16e6; // 16 MHZ
  readonly workUnitCycles = 500000;
  private speedMultiplier = 1; // 1x = realistic, >1x = faster than real hardware
  private cyclesPerFrameDivisor = 100; // Start with 100 FPS assumption, will adjust

  private stopped = false;
  private serialBuffer: number[] = [];
  private lastPerformanceCheck = 0;
  private lastAdjustment = 0;

  constructor(hex: string) {
    loadHex(hex, new Uint8Array(this.program.buffer));

    this.cpu = new CPU(this.program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);

    this.portB = new SimAVRIOPort(this.cpu, portBConfig) as SimAVRIOPortWithListener;
    this.portC = new SimAVRIOPort(this.cpu, portCConfig) as SimAVRIOPortWithListener;
    this.portD = new SimAVRIOPort(this.cpu, portDConfig) as SimAVRIOPortWithListener;

    this.usart = new AVRUSART(this.cpu, usart0Config, this.frequency);
    this.eeprom = new AVREEPROM(this.cpu, new EEPROMLocalStorageBackend());

    this.cpu.readHooks[usart0Config.UDR] = () => this.serialBuffer.shift() || 0;
  }

  serialWrite(data: string) {
    for (const char of data) {
      this.serialBuffer.push(char.charCodeAt(0));
    }
  }

  setSpeedMode(mode: 'realistic' | 'maximum') {
    if (mode === 'realistic') {
      this.speedMultiplier = 1; // Run at real hardware speed
    } else if (mode === 'maximum') {
      this.speedMultiplier = 10; // Run 10x faster (limited only by CPU performance)
    }
  }

  // Intelligent speed adjustment to keep realistic mode at ~100%
  adjustSpeedForPerformance(currentPerformance: number) {
    if (this.speedMultiplier !== 1) return; // Only adjust in realistic mode

    const now = performance.now();
    if (now - this.lastAdjustment < 500) return; // Adjust at most every 500ms

    this.lastAdjustment = now;

    // If performance is > 105%, increase divisor (execute fewer cycles)
    // If performance is < 95%, decrease divisor (execute more cycles)
    if (currentPerformance > 105) {
      this.cyclesPerFrameDivisor *= 1.02; // Increase by 2%
    } else if (currentPerformance < 95) {
      this.cyclesPerFrameDivisor *= 0.98; // Decrease by 2%
    }

    // Cap the divisor between reasonable bounds
    this.cyclesPerFrameDivisor = Math.max(80, Math.min(120, this.cyclesPerFrameDivisor));
  }

  connectComponent(component: HTMLElement, connections: Record<string, string>, type: string) {
    const pinMapping = (this as any).pinMapping;
    if (!pinMapping || !connections) return;

    Object.entries(connections).forEach(([componentPinName, arduinoPinStr]) => {
      const arduinoPin = parseInt(arduinoPinStr as string, 10);
      if (isNaN(arduinoPin)) return;

      const mapping = pinMapping[arduinoPin];
      if (!mapping) return;

      if (type === 'led' && (componentPinName === 'A' || componentPinName === 'C')) {
        this[mapping.port].addListener(state => {
          // Anode is HIGH, Cathode is LOW to light up
          const pinValue = (state & (1 << mapping.pin)) !== 0;
          const value = (componentPinName === 'A') ? pinValue : !pinValue;
          component.dispatchEvent(new CustomEvent('value-change', { detail: value }));
        });
      }

      if (type === 'pushbutton' && componentPinName.startsWith('2')) {
        component.addEventListener('button-press', () => {
          this[mapping.port].setPin(mapping.pin, false); // Active LOW
        });
        component.addEventListener('button-release', () => {
          this[mapping.port].setPin(mapping.pin, true); // Return to HIGH (pull-up)
        });
      }
    });
  }


  execute(callback: (cpu: CPU) => void) {
    // Execute cycles based on speed mode and adaptive divisor
    // In realistic mode: frequency / cyclesPerFrameDivisor cycles per frame
    // The divisor adapts to keep performance at ~100%
    const baseCyclesPerFrame = this.frequency / this.cyclesPerFrameDivisor;
    const deadline = this.cpu.cycles + baseCyclesPerFrame * this.speedMultiplier;

    while(this.cpu.cycles < deadline) {
        if (this.stopped) break;
        avrInstruction(this.cpu);
        this.cpu.tick();
    }

    if (this.stopped) return;

    callback(this.cpu);
  }

  stop() {
    this.stopped = true;
  }
}