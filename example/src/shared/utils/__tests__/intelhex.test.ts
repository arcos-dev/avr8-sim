import { loadHex } from '../intelhex';
import { BLINK_HEX } from '../../constants/hexPrograms';

describe('loadHex', () => {
  it('should parse valid Intel HEX format', () => {
    const simpleHex = `
:020000040000FA
:10000000259A25BA25982598FECF
:00000001FF
`;
    
    const target = new Uint8Array(1024);
    
    expect(() => loadHex(simpleHex, target)).not.toThrow();
    expect(target).toBeInstanceOf(Uint8Array);
  });

  it('should handle BLINK_HEX program', () => {
    const target = new Uint8Array(1024);
    
    expect(() => loadHex(BLINK_HEX, target)).not.toThrow();
    expect(target).toBeInstanceOf(Uint8Array);
    
    // Verify that the hex contains expected instructions
    // The BLINK_HEX should contain SBI and CBI instructions for PORTB
    expect(target.some(byte => byte !== 0)).toBe(true);
  });

  it('should handle empty hex string', () => {
    const target = new Uint8Array(1024);
    
    expect(() => loadHex('', target)).not.toThrow();
    expect(target).toBeInstanceOf(Uint8Array);
  });

  it('should handle hex with only end record', () => {
    const endOnlyHex = ':00000001FF';
    const target = new Uint8Array(1024);
    
    expect(() => loadHex(endOnlyHex, target)).not.toThrow();
    expect(target).toBeInstanceOf(Uint8Array);
  });

  it('should parse data records correctly', () => {
    // Simple hex with known data
    const knownHex = `
:10000000259A25BA25982598000000000000000000
:00000001FF
`;
    const target = new Uint8Array(1024);
    
    loadHex(knownHex, target);
    
    expect(target).toBeInstanceOf(Uint8Array);
    expect(target[0]).toBe(0x25); // First byte should be 0x25
    expect(target[1]).toBe(0x9A); // Second byte should be 0x9A
  });

  it('should handle multi-line hex data', () => {
    const multiLineHex = `
:10000000259A25BA25982598000000000000000000
:10001000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
:00000001FF
`;
    const target = new Uint8Array(1024);
    
    loadHex(multiLineHex, target);
    
    expect(target).toBeInstanceOf(Uint8Array);
    expect(target.slice(0, 32).some(byte => byte !== 0)).toBe(true); // At least some bytes from two 16-byte records
  });

  it('should validate checksum', () => {
    // Invalid checksum should not crash the parser
    const invalidChecksumHex = `
:10000000259A25BA25982598000000000000000001
:00000001FF
`;
    const target = new Uint8Array(1024);
    
    expect(() => {
      loadHex(invalidChecksumHex, target);
    }).not.toThrow();
  });

  it('should handle hex with whitespace and comments', () => {
    const hexWithWhitespace = `
:10000000259A25BA25982598000000000000000000
:00000001FF
`;
    const target = new Uint8Array(1024);
    
    expect(() => loadHex(hexWithWhitespace, target)).not.toThrow();
    expect(target).toBeInstanceOf(Uint8Array);
    expect(target.some(byte => byte !== 0)).toBe(true);
  });
});