import '@testing-library/jest-dom';

// Mock do requestAnimationFrame
global.requestAnimationFrame = (callback: (time: number) => void) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock do DataTransfer para testes de drag and drop
class MockDataTransfer {
  data: { [key: string]: string } = {};
  
  getData(format: string): string {
    return this.data[format] || '';
  }
  
  setData(format: string, data: string): void {
    this.data[format] = data;
  }
  
  clearData(format?: string): void {
    if (format) {
      delete this.data[format];
    } else {
      this.data = {};
    }
  }
}

// @ts-expect-error - MockDataTransfer is a test implementation
global.DataTransfer = MockDataTransfer;

// Mock do console para evitar logs desnecessários nos testes
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});