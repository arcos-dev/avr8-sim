export type BoardType = 'uno' | 'nano' | 'mega';

export interface ComponentInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  [key: string]: any; // for other props like color, etc.
}

export type PinIdentifier = {
  componentId: string;
  pinName: string;
};

export type WireSignalType =
  | 'digital'
  | 'analog'
  | 'power'
  | 'ground'
  | 'serial'
  | 'pwm';

export interface WireMetadata {
  createdAt: number;
  updatedAt: number;
  label?: string;
  length?: number;
}

export interface WireOptions {
  from: PinIdentifier;
  to: PinIdentifier;
  signal?: WireSignalType;
  color?: string;
  metadata?: Partial<WireMetadata>;
}

export interface Wire {
  id: string;
  from: PinIdentifier;
  to: PinIdentifier;
  signal: WireSignalType;
  color: string;
  metadata: WireMetadata;
}

export type WireLogicalState = 'floating' | 'low' | 'high';

export type WireDirection = 'forward' | 'reverse' | 'bidirectional' | 'none';

export interface WireRuntimeState {
  id: string;
  logical: WireLogicalState;
  direction: WireDirection;
  magnitude: number;
}

export interface SimulationSettings {
  simulateElectronFlow: boolean;
  simulationSpeedMode?: 'realistic' | 'maximum'; // 'realistic' = 100% hardware speed, 'maximum' = max possible speed
  renderingFPS?: 30 | 60 | 120 | 'unlimited'; // Cap rendering FPS to save CPU, or 'unlimited' for max FPS
}

export interface PinConnectionTarget {
  componentId: string;
  pinName: string;
}

export type PinConnectionMap = Record<string, PinConnectionTarget[]>;

export type CodeLanguage = 'arduino' | 'c' | 'cpp' | 'asm' | 'markdown';

export interface CodeFile {
  id: string;
  name: string;
  language: CodeLanguage;
  content: string;
  isReadOnly?: boolean;
}
