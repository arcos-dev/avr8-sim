import { renderHook, act } from '@testing-library/react';
import { useSimulator } from '../useSimulator';
import { BLINK_HEX } from '../../constants/hexPrograms';

// Mock do avr8js
jest.mock('avr8js', () => ({
  avrInstruction: jest.fn(),
  CPU: jest.fn().mockImplementation(() => ({
    cycles: 0,
    data: new Uint8Array(2048),
    tick: jest.fn(),
  })),
}));

// Mock do loadHex
jest.mock('../../utils/intelhex', () => ({
  loadHex: jest.fn().mockReturnValue(new Uint8Array([0x0C, 0x94, 0x34, 0x00])),
}));

describe('useSimulator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSimulator(BLINK_HEX));
    
    expect(result.current.simulationState).toEqual({
      led1: false,
      running: false,
      frequency: 16000000,
    });
  });

  it('should start simulation and update running state', () => {
    const { result } = renderHook(() => useSimulator(BLINK_HEX));
    
    act(() => {
      result.current.start();
    });
    
    expect(result.current.simulationState.running).toBe(true);
  });

  it('should stop simulation and update running state', () => {
    const { result } = renderHook(() => useSimulator(BLINK_HEX));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      result.current.stop();
    });
    
    expect(result.current.simulationState.running).toBe(false);
  });

  it('should reset simulation to initial state', () => {
    const { result } = renderHook(() => useSimulator(BLINK_HEX));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.simulationState).toEqual({
      led1: false,
      running: false,
      frequency: 16000000,
    });
  });

  it('should reinitialize when hexCode changes', () => {
    const { rerender } = renderHook(
      ({ hexCode }) => useSimulator(hexCode),
      { initialProps: { hexCode: BLINK_HEX } }
    );
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    rerender({ hexCode: ':020000040000FA\n:10000000259A25BA25982598FECF\n:00000001FF\n' });
    
    expect(consoleSpy).toHaveBeenCalledWith('HexCode changed, reinitializing simulator...');
    
    consoleSpy.mockRestore();
  });
});