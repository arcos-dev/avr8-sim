import type { EEPROMBackend } from 'avr8js';

function zeroPad(value: string, minLength: number) {
  while (value.length < minLength) {
    value = '0' + value;
  }
  return value;
}

function formatAddr(addr: number) {
  return zeroPad(addr.toString(16), 4);
}

export class EEPROMLocalStorageBackend implements EEPROMBackend {
  constructor (private readonly prefix = 'AVR8JS_EEPROM_') {}

  readMemory(addr: number) {
    const value = localStorage.getItem(this.prefix + formatAddr(addr));
    return value != null ? parseInt(value, 16) : 0xff;
  }

  writeMemory(addr: number, value: number) {
    localStorage.setItem(this.prefix + formatAddr(addr), zeroPad(value.toString(16), 2));
  }

  // Fix: Implement the `eraseMemory` method required by the `EEPROMBackend` interface.
  eraseMemory(addr: number): void {
    localStorage.removeItem(this.prefix + formatAddr(addr));
  }
}
