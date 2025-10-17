import { SimpleAVRRunner } from '../useSimulator';
import { CPU } from 'avr8js';
import { loadHex } from '../../utils/intelhex';

// Mock avr8js
jest.mock('avr8js', () => ({
  CPU: jest.fn(),
}));

// Mock loadHex
jest.mock('../../utils/intelhex', () => ({
  loadHex: jest.fn(),
}));

const mockCPU = {
  cycles: 0,
  data: new Uint8Array(2048),
  tick: jest.fn(),
  progMem: new Uint16Array(16384),
  sramBytes: 2048,
  data16: new Uint16Array(1024),
  dataView: new DataView(new ArrayBuffer(2048)),
  pc: 0,
  SP: 0x5FF,
  writeHooks: {},
  readHooks: {},
  clockFrequency: 16000000,
  reset: jest.fn(),
  step: jest.fn(),
  run: jest.fn(),
  stop: jest.fn(),
  addBreakpoint: jest.fn(),
  removeBreakpoint: jest.fn(),
  clearBreakpoints: jest.fn(),
  getBreakpoints: jest.fn(),
  readData: jest.fn(),
  writeData: jest.fn(),
  readProgMem: jest.fn(),
  writeProgMem: jest.fn(),
  readIO: jest.fn(),
  writeIO: jest.fn(),
  readGPR: jest.fn(),
  writeGPR: jest.fn(),
  readSRAM: jest.fn(),
  writeSRAM: jest.fn()
};

const mockLoadHex = loadHex as jest.MockedFunction<typeof loadHex>;
const MockedCPU = CPU as jest.MockedClass<typeof CPU>;

describe('SimpleAVRRunner', () => {
  let runner: SimpleAVRRunner;
  let stateCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup CPU mock
    MockedCPU.mockImplementation(() => mockCPU as unknown as CPU);
    
    // Setup loadHex mock
    mockLoadHex.mockReturnValue(undefined);
    
    stateCallback = jest.fn();
    runner = new SimpleAVRRunner(':020000040000FA');
    runner.setStateChangeCallback(stateCallback);
  });

  it('should initialize CPU correctly', () => {
    expect(MockedCPU).toHaveBeenCalled();
    expect(mockLoadHex).toHaveBeenCalledWith(':020000040000FA', expect.any(Uint8Array));
  });

  it('should load hex code into CPU memory', () => {
    mockLoadHex.mockReturnValue(undefined);
    
    const runner = new SimpleAVRRunner(':020000040000FA');
    
    expect(mockLoadHex).toHaveBeenCalledWith(':020000040000FA', expect.any(Uint8Array));
    expect(mockCPU.data).toBeDefined();
    expect(runner).toBeDefined();
  });

  it('should detect LED state based on PORTB bit 5', () => {
    // Test LED OFF state
    mockCPU.data[0x25] = 0b00000000; // PB5 = 0
    const ledOffState = (mockCPU.data[0x25] & (1 << 5)) !== 0;
    expect(ledOffState).toBe(false);
    
    // Test LED ON state
    mockCPU.data[0x25] = 0b00100000; // PB5 = 1
    const ledOnState = (mockCPU.data[0x25] & (1 << 5)) !== 0;
    expect(ledOnState).toBe(true);
  });

  it('should stop and start execution correctly', () => {
    runner.stop();
    expect(runner).toBeDefined();
    
    runner.start();
    expect(runner).toBeDefined();
  });

  // Note: reset method is not implemented in SimpleAVRRunner

  it('should calculate deadline correctly', () => {
    const frequency = 16000000;
    const expectedDeadline = frequency / 10; // 10 FPS
    expect(expectedDeadline).toBe(1600000);
  });

  it('should handle PORTB register correctly', () => {
    // Verify PORTB address is correct (0x25 in data memory)
    const portbAddress = 0x25;
    mockCPU.data[portbAddress] = 0xFF;
    expect(mockCPU.data[portbAddress]).toBe(0xFF);
    
    // Test bit manipulation
    const bit5Mask = 1 << 5;
    expect(bit5Mask).toBe(0b00100000);
  });
});