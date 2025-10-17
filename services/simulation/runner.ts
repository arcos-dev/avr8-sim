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

  private stopped = false;
  private serialBuffer: number[] = [];

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

  connectComponent(component: HTMLElement, connections: Record<string, string>, type: string) {
    const pinMapping = (this as any).pinMapping;
    if (!pinMapping || !connections) return;

    Object.entries(connections).forEach(([componentPinName, arduinoPinStr]) => {
      const arduinoPin = parseInt(arduinoPinStr as string, 10);
      if (isNaN(arduinoPin)) return;

      const mapping = pinMapping[arduinoPin];
      if (!mapping) return;

      if (type === 'wokwi-led' && (componentPinName === 'A' || componentPinName === 'C')) {
        this[mapping.port].addListener(state => {
          // Anode is HIGH, Cathode is LOW to light up
          const pinValue = (state & (1 << mapping.pin)) !== 0;
          const value = (componentPinName === 'A') ? pinValue : !pinValue;
          component.dispatchEvent(new CustomEvent('value-change', { detail: value }));
        });
      }

      if (type === 'wokwi-pushbutton' && componentPinName.startsWith('2')) {
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
    const deadline = this.cpu.cycles + this.frequency / 60; // 60 FPS
    
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