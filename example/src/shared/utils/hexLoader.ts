// Utility to load Intel HEX format files for AVR8 simulation

export interface HexData {
  data: Uint8Array;
  startAddress: number;
}

/**
 * Parse Intel HEX format string and return program data
 * @param hexString - Intel HEX format string
 * @returns Parsed hex data with program bytes and start address
 */
export function loadHex(hexString: string): Uint8Array {
  const lines = hexString.trim().split('\n');
  const program = new Uint8Array(32 * 1024); // 32KB for ATmega328P
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith(':')) {
      continue; // Skip non-hex lines
    }
    
    try {
      const record = parseHexRecord(trimmedLine);
      
      if (record.type === 0x00) { // Data record
        // Copy data to program memory
        for (let i = 0; i < record.data.length; i++) {
          if (record.address + i < program.length) {
            program[record.address + i] = record.data[i];
          }
        }
      } else if (record.type === 0x01) { // End of file record
        break;
      }
      // Other record types (0x02, 0x03, 0x04, 0x05) are ignored for now
    } catch {
        // Failed to parse hex line
      }
  }
  
  return program;
}

/**
 * Parse a single Intel HEX record line
 * @param line - Single line from Intel HEX file (starting with ':')
 * @returns Parsed record data
 */
function parseHexRecord(line: string) {
  if (!line.startsWith(':')) {
    throw new Error('Invalid hex record: must start with :');
  }
  
  const hexData = line.substring(1); // Remove ':' prefix
  
  if (hexData.length < 8) {
    throw new Error('Invalid hex record: too short');
  }
  
  // Parse fields
  const byteCount = parseInt(hexData.substring(0, 2), 16);
  const address = parseInt(hexData.substring(2, 6), 16);
  const recordType = parseInt(hexData.substring(6, 8), 16);
  
  const dataStart = 8;
  const dataEnd = dataStart + (byteCount * 2);
  const checksumStart = dataEnd;
  
  if (hexData.length < checksumStart + 2) {
    throw new Error('Invalid hex record: missing checksum');
  }
  
  const dataHex = hexData.substring(dataStart, dataEnd);
  const checksum = parseInt(hexData.substring(checksumStart, checksumStart + 2), 16);
  
  // Parse data bytes
  const data = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    const byteHex = dataHex.substring(i * 2, (i + 1) * 2);
    data[i] = parseInt(byteHex, 16);
  }
  
  // Verify checksum
  let calculatedChecksum = byteCount + ((address >> 8) & 0xFF) + (address & 0xFF) + recordType;
  for (const byte of data) {
    calculatedChecksum += byte;
  }
  calculatedChecksum = ((~calculatedChecksum) + 1) & 0xFF;
  
  if (calculatedChecksum !== checksum) {
    throw new Error(`Invalid checksum: expected ${checksum}, got ${calculatedChecksum}`);
  }
  
  return {
    byteCount,
    address,
    type: recordType,
    data,
    checksum
  };
}

/**
 * Convert a binary array to Intel HEX format
 * @param data - Binary data to convert
 * @param startAddress - Starting address (default: 0)
 * @returns Intel HEX format string
 */
export function binaryToHex(data: Uint8Array, startAddress: number = 0): string {
  const lines: string[] = [];
  const recordSize = 16; // Standard record size
  
  for (let offset = 0; offset < data.length; offset += recordSize) {
    const address = startAddress + offset;
    const remainingBytes = Math.min(recordSize, data.length - offset);
    const recordData = data.slice(offset, offset + remainingBytes);
    
    // Skip empty records (all zeros)
    if (recordData.every(byte => byte === 0)) {
      continue;
    }
    
    const line = createHexRecord(0x00, address, recordData);
    lines.push(line);
  }
  
  // Add end-of-file record
  lines.push(createHexRecord(0x01, 0, new Uint8Array(0)));
  
  return lines.join('\n');
}

/**
 * Create a single Intel HEX record line
 * @param type - Record type
 * @param address - Address
 * @param data - Data bytes
 * @returns Formatted hex record line
 */
function createHexRecord(type: number, address: number, data: Uint8Array): string {
  const byteCount = data.length;
  
  // Calculate checksum
  let checksum = byteCount + ((address >> 8) & 0xFF) + (address & 0xFF) + type;
  for (const byte of data) {
    checksum += byte;
  }
  checksum = ((~checksum) + 1) & 0xFF;
  
  // Format record
  let record = ':';
  record += byteCount.toString(16).padStart(2, '0').toUpperCase();
  record += address.toString(16).padStart(4, '0').toUpperCase();
  record += type.toString(16).padStart(2, '0').toUpperCase();
  
  for (const byte of data) {
    record += byte.toString(16).padStart(2, '0').toUpperCase();
  }
  
  record += checksum.toString(16).padStart(2, '0').toUpperCase();
  
  return record;
}

/**
 * Validate Intel HEX format string
 * @param hexString - Intel HEX format string to validate
 * @returns True if valid, false otherwise
 */
export function validateHex(hexString: string): boolean {
  try {
    loadHex(hexString);
    return true;
  } catch {
      return false;
    }
}

/**
 * Get program size from Intel HEX string
 * @param hexString - Intel HEX format string
 * @returns Size of the program in bytes
 */
export function getHexProgramSize(hexString: string): number {
  const lines = hexString.trim().split('\n');
  let maxAddress = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith(':')) {
      continue;
    }
    
    try {
      const record = parseHexRecord(trimmedLine);
      if (record.type === 0x00) { // Data record
        const endAddress = record.address + record.byteCount;
        maxAddress = Math.max(maxAddress, endAddress);
      }
    } catch {
      // Ignore invalid records
    }
  }
  
  return maxAddress;
}

// Utility to create a hex loader
export const createHexLoader = (hexCode: string) => {
  return () => loadHex(hexCode);
};