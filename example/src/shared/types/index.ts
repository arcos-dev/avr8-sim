export interface Wire {
  id: string;
  from: PinConnection;
  to: PinConnection;
  color: string;
  // Propriedades elétricas opcionais para compatibilidade
  electricalProperties?: {
    resistance?: number;
    capacitance?: number;
    inductance?: number;
    length?: number;
    material?: string;
  };
  [key: string]: unknown;
}

export interface Component {
  id: string;
  tag: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

export interface PinConnection {
  componentId: string;
  pin: string;
  x: number;
  y: number;
}

export interface DroppedComponent {
  id: string;
  tag: string;
  name: string;
  x: number;
  y: number;
  selected: boolean;
  props: ComponentProps;
  [key: string]: unknown;
}

export interface ComponentProps {
  [key: string]: unknown;
}

export interface CPUState {
  pc?: number;
  cycles?: number;
  clockFrequency?: number;
  data?: Uint8Array;
  SP?: number;
  [key: string]: unknown;
}