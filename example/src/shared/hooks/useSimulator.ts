import { useRef, useCallback, useState, useEffect } from 'react';
import {
  avrInstruction,
  CPU,
  AVRUSART,
  AVRTimer,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config
} from 'avr8js';
import { loadHex } from '../utils/intelhex';

// CPU Performance class based on data/src/shared/cpu-performance.ts
class CPUPerformance {
  private readonly prevTime = 0;
  private readonly prevCycles = 0;
  private readonly samples = new Float32Array(64);
  private readonly sampleIndex = 0;
  private readonly avg = 0;

  constructor(private readonly cpu: CPU, private readonly MHZ: number) {}

  reset() {
    Object.defineProperty(this, 'prevTime', { value: 0, writable: true });
    Object.defineProperty(this, 'prevCycles', { value: 0, writable: true });
    Object.defineProperty(this, 'sampleIndex', { value: 0, writable: true });
  }

  update() {
    if (this.prevTime) {
      const delta = performance.now() - this.prevTime;
      const deltaCycles = this.cpu.cycles - this.prevCycles;
      const deltaCpuMillis = 1000 * (deltaCycles / this.MHZ);
      const factor = deltaCpuMillis / delta;

      if (!this.sampleIndex) {
        this.samples.fill(factor);
      }

      Object.defineProperty(this, 'sampleIndex', { value: (this.sampleIndex + 1) % this.samples.length, writable: true });
      this.samples[this.sampleIndex] = factor;
    }

    Object.defineProperty(this, 'prevCycles', { value: this.cpu.cycles, writable: true });
    Object.defineProperty(this, 'prevTime', { value: performance.now(), writable: true });
    Object.defineProperty(this, 'avg', { value: this.samples.reduce((x, y) => x + y) / this.samples.length, writable: true });

    return this.avg;
  }

  getPerformancePercentage(): number {
    return Math.min(this.avg * 100, 100);
  }
}

export interface SimulationState {
  led1: boolean;
  running: boolean;
  frequency: number;
  performancePercentage: number;
}

export interface SerialData {
  output: string[];
  onSerialOutput?: (data: string) => void;
}

class SimpleAVRRunner {
  readonly program = new Uint16Array(0x8000);
  readonly cpu: CPU;
  readonly timer0: AVRTimer;
  readonly timer1: AVRTimer;
  readonly timer2: AVRTimer;
  readonly portB: AVRIOPort;
  readonly portC: AVRIOPort;
  readonly portD: AVRIOPort;
  readonly usart: AVRUSART;
  readonly frequency = 16e6;
  private readonly performance: CPUPerformance;

  private stopped = false;
  private onStateChange?: (state: Partial<SimulationState>) => void;
  private onSerialOutput?: (data: string) => void;
  private lastLedState = false;
  private performanceUpdateCounter = 0;
  private serialBuffer: string[] = [];

  constructor(hex: string) {
    loadHex(hex, new Uint8Array(this.program.buffer));

    // Initialize CPU
    this.cpu = new CPU(this.program);

    // Initialize timers
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);

    // Initialize I/O ports
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);

    // Initialize USART
    this.usart = new AVRUSART(this.cpu, usart0Config, this.frequency);

    this.performance = new CPUPerformance(this.cpu, this.frequency / 1e6);

    // Configure serial output
    this.usart.onByteTransmit = (value: number) => {
      const char = String.fromCharCode(value);
      if (char === '\n') {
        // Send complete line
        const line = this.serialBuffer.join('');
        this.onSerialOutput?.(line);
        this.serialBuffer = [];
      } else if (char !== '\r') {
        // Add character to buffer (ignore carriage return)
        this.serialBuffer.push(char);
      }
    };

    // Set up port listeners for LED detection
    this.portB.addListener((value) => {
      // Pin 13 (LED_BUILTIN) is PB5 (bit 5 of PORTB)
      const led1State = !!(value & (1 << 5));
      if (led1State !== this.lastLedState) {
        this.lastLedState = led1State;
        this.onStateChange?.({ led1: led1State });
      }
    });


  }

  setStateChangeCallback(callback: (state: Partial<SimulationState>) => void) {
    this.onStateChange = callback;
  }

  setSerialOutputCallback(callback: (data: string) => void) {
    this.onSerialOutput = callback;
  }

  execute() {
    if (this.stopped) {
      return;
    }

    const { cpu } = this;
    const deadline = cpu.cycles + this.frequency / 100; // Execute in chunks for better performance

    while (cpu.cycles <= deadline && !this.stopped) {
      avrInstruction(cpu);
      cpu.tick();
    }

    // Update performance every 10 cycles for better accuracy
    this.performanceUpdateCounter++;
    if (this.performanceUpdateCounter >= 10) {
      this.performance.update();
      this.onStateChange?.({ performancePercentage: this.performance.getPerformancePercentage() });
      this.performanceUpdateCounter = 0;
    }

    if (!this.stopped) {
      setTimeout(() => this.execute(), 10); // Faster execution for better LED timing
    }
  }

  stop() {
    this.stopped = true;
  }

  start() {
    this.stopped = false;
    this.performance.reset();
    this.execute();
  }
}

export function useSimulator(hexCode: string) {
  const runnerRef = useRef<SimpleAVRRunner | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    led1: false,
    running: false,
    frequency: 16000000,
    performancePercentage: 0,
  });
  const [cpu, setCpu] = useState<CPU | null>(null);
  const [serialOutput, setSerialOutput] = useState<string[]>([]);

  // Reinitialize when hexCode changes
  useEffect(() => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      runnerRef.current = null;
    }
    setCpu(null);
  }, [hexCode]);

  const initializeSimulator = useCallback(() => {
    try {
      const runner = new SimpleAVRRunner(hexCode);
      runner.setStateChangeCallback((state) => {
        setSimulationState(prev => ({ ...prev, ...state }));
      });
      runner.setSerialOutputCallback((data) => {
        setSerialOutput(prev => [...prev, data]);
      });
      runnerRef.current = runner;
      setCpu(runner.cpu);
      return true;
    } catch (error) {
      console.error('Failed to initialize simulator:', error);
      return false;
    }
  }, [hexCode]);

  const start = useCallback(() => {
    if (!runnerRef.current) {
      const initialized = initializeSimulator();
      if (!initialized) {
        return;
      }
    }

    setSimulationState(prev => ({ ...prev, running: true }));
    runnerRef.current?.start();
  }, [initializeSimulator]);

  const stop = useCallback(() => {
    setSimulationState(prev => ({ ...prev, running: false }));
    runnerRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    stop();
    runnerRef.current = null;
    setCpu(null);
    setSerialOutput([]);
    setSimulationState({
      led1: false,
      running: false,
      frequency: 16000000,
      performancePercentage: 0,
    });
  }, [stop]);

  const clearSerialOutput = useCallback(() => {
    setSerialOutput([]);
  }, []);

  return {
    simulationState,
    start,
    stop,
    reset,
    cpu,
    serialOutput,
    clearSerialOutput,
  };
}

// Export SimpleAVRRunner for testing
export { SimpleAVRRunner };
