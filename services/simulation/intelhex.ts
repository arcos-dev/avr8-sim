
/**
 * Minimal Intel HEX loader
 * Part of AVR8js
 *
 * Copyright (C) 2019, Uri Shaked
 */
export function loadHex(source: string, target: Uint8Array) {
  for (const line of source.split('\n')) {
    if (line[0] === ':' && line.length > 8 && line.substring(7, 9) === '00') {
      const byteCount = parseInt(line.substring(1, 3), 16);
      const address = parseInt(line.substring(3, 7), 16);
      for (let i = 0; i < byteCount; i++) {
        if (address + i < target.length) {
          target[address + i] = parseInt(line.substring(9 + i * 2, 11 + i * 2), 16);
        }
      }
    }
  }
}
