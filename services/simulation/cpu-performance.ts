
import type { CPU } from 'avr8js';

export class CPUPerformance {
  private prevTime = 0;
  private prevCycles = 0;
  private samples = new Float32Array(64);
  private sampleIndex = 0;
  private lastDisplayUpdate = 0;
  private accumulatedPerformance = 0;
  private measurementCount = 0;

  constructor(private cpu: CPU, private MHZ: number, private runner?: any) {
    // Initialize with 100% to avoid absurd values on first call
    this.samples.fill(100);
  }

  reset() {
    this.prevTime = 0;
    this.prevCycles = 0;
    this.sampleIndex = 0;
    this.samples.fill(100);
    this.lastDisplayUpdate = 0;
    this.accumulatedPerformance = 0;
    this.measurementCount = 0;
  }

  update() {
    if (this.prevTime) {
      const delta = performance.now() - this.prevTime; // in milliseconds
      const deltaCycles = this.cpu.cycles - this.prevCycles;

      // At 100% speed, we should execute MHZ * 1000 cycles per millisecond
      const expectedCyclesPerMs = this.MHZ * 1000; // cycles per millisecond at 100% speed
      const actualCyclesPerMs = deltaCycles / delta;

      if (delta > 0) {
        const factor = (actualCyclesPerMs / expectedCyclesPerMs) * 100;
        this.samples[this.sampleIndex % this.samples.length] = Math.max(factor, 0);
        this.accumulatedPerformance += factor;
        this.measurementCount++;
      }
      this.sampleIndex++;
    }

    this.prevCycles = this.cpu.cycles;
    this.prevTime = performance.now();

    // Return average, but adjust adaptive speed every 100ms if runner exists
    const now = performance.now();
    if (this.runner && now - this.lastDisplayUpdate >= 100) {
      const avgPerformance = this.accumulatedPerformance / Math.max(1, this.measurementCount);
      this.runner.adjustSpeedForPerformance(avgPerformance);
      this.lastDisplayUpdate = now;
      this.accumulatedPerformance = 0;
      this.measurementCount = 0;
    }

    return this.samples.reduce((x, y) => x + y) / this.samples.length;
  }
}
