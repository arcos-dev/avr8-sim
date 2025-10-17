import type { BoardType } from "../../types";

type Port = 'portB' | 'portC' | 'portD';
interface PinMapping {
    [pin: number]: { port: Port, pin: number }
}

const unoNanoMapping: PinMapping = {
    // PORTD
    0: { port: 'portD', pin: 0 },
    1: { port: 'portD', pin: 1 },
    2: { port: 'portD', pin: 2 },
    3: { port: 'portD', pin: 3 },
    4: { port: 'portD', pin: 4 },
    5: { port: 'portD', pin: 5 },
    6: { port: 'portD', pin: 6 },
    7: { port: 'portD', pin: 7 },
    // PORTB
    8: { port: 'portB', pin: 0 },
    9: { port: 'portB', pin: 1 },
    10: { port: 'portB', pin: 2 },
    11: { port: 'portB', pin: 3 },
    12: { port: 'portB', pin: 4 },
    13: { port: 'portB', pin: 5 },
    // PORTC (Analog)
    14: { port: 'portC', pin: 0 }, // A0
    15: { port: 'portC', pin: 1 }, // A1
    16: { port: 'portC', pin: 2 }, // A2
    17: { port: 'portC', pin: 3 }, // A3
    18: { port: 'portC', pin: 4 }, // A4
    19: { port: 'portC', pin: 5 }, // A5
};

// Note: This is a simplified mapping for the Arduino Mega
// It does not include all 54 digital pins or all 16 analog inputs
const megaMapping: PinMapping = {
    ...unoNanoMapping,
    // Add more mega-specific pins here if needed
    // For now, it shares the same base mapping for compatibility
};


export function getPinMapping(board: BoardType): PinMapping | null {
    switch(board) {
        case 'uno':
        case 'nano':
            return unoNanoMapping;
        case 'mega':
            return megaMapping; // For now, mega uses a subset
        default:
            return null;
    }
}