// Tipos para o sistema elétrico refatorado

// Tipos de sinais que podem trafegar pelas vias
export enum SignalType {
  DIGITAL = 'digital',
  ANALOG = 'analog',
  POWER = 'power',
  GROUND = 'ground',
  I2C_DATA = 'i2c_data',
  I2C_CLOCK = 'i2c_clock',
  SPI_DATA = 'spi_data',
  SPI_CLOCK = 'spi_clock',
  UART_TX = 'uart_tx',
  UART_RX = 'uart_rx',
  PWM = 'pwm'
}

// Propriedades elétricas de um sinal
export interface ElectricalProperties {
  voltage: number; // Tensão em volts
  current: number; // Corrente em amperes
  resistance: number; // Resistência em ohms
  frequency?: number; // Frequência em Hz (para sinais AC ou PWM)
  dutyCycle?: number; // Ciclo de trabalho para PWM (0-1)
  impedance?: number; // Impedância em ohms
  capacitance?: number; // Capacitância em farads
  inductance?: number; // Indutância em henries
}

// Estado de um sinal em um momento específico
export interface SignalState {
  type: SignalType;
  properties: ElectricalProperties;
  timestamp: number;
  isActive: boolean;
  direction: 'input' | 'output' | 'bidirectional';
  digitalValue?: boolean; // Para sinais digitais
  analogValue?: number; // Para sinais analógicos (0-1023 para ADC de 10 bits)
}

// Pino elétrico com capacidades avançadas
export interface ElectricalPin {
  id: string;
  name: string;
  position: { x: number; y: number };
  type: SignalType;
  direction: 'input' | 'output' | 'bidirectional';
  maxVoltage: number;
  maxCurrent: number;
  internalResistance: number;
  currentState: SignalState;
  supportedSignalTypes: SignalType[];
  isConnected: boolean;
  connectedWireId?: string;
}

// Via elétrica com propriedades físicas
export interface ElectricalWire {
  id: string;
  from: {
    componentId: string;
    pinId: string;
    position: { x: number; y: number };
  };
  to: {
    componentId: string;
    pinId: string;
    position: { x: number; y: number };
  };
  signalType: SignalType;
  electricalProperties: {
    resistance: number; // Resistência do fio
    capacitance: number; // Capacitância parasita
    inductance: number; // Indutância parasita
    length: number; // Comprimento em metros
    crossSection: number; // Área da seção transversal em mm²
    material: 'copper' | 'aluminum' | 'silver'; // Material do condutor
  };
  currentSignal: SignalState;
  color: string;
  visualProperties: {
    thickness: number;
    opacity: number;
    animationSpeed: number;
    showSignalFlow: boolean;
  };
  metadata: {
    createdAt: number;
    lastModified: number;
    notes?: string;
  };
}

// Componente elétrico com pinos
export interface ElectricalComponent {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  pins: ElectricalPin[];
  electricalModel: {
    powerConsumption: number; // Consumo em watts
    operatingVoltage: { min: number; max: number };
    operatingCurrent: { min: number; max: number };
    internalCircuit?: string; // Referência para modelo SPICE
  };
  simulationState: {
    isActive: boolean;
    temperature: number; // Temperatura em Celsius
    powerDissipation: number; // Dissipação de potência em watts
  };
}

// Resistor como componente passivo
export interface ResistorComponent extends ElectricalComponent {
  resistance: number; // Resistência em ohms
  tolerance: number; // Tolerância em porcentagem
  powerRating: number; // Potência nominal em watts
  temperatureCoefficient: number; // Coeficiente de temperatura
}

// Análise de circuito
export interface CircuitAnalysis {
  totalPowerConsumption: number;
  voltageDrops: Map<string, number>; // Queda de tensão por fio
  currentFlow: Map<string, number>; // Fluxo de corrente por fio
  powerDissipation: Map<string, number>; // Dissipação por componente
  efficiency: number; // Eficiência do circuito
  warnings: string[]; // Avisos sobre problemas no circuito
  errors: string[]; // Erros críticos
}

// Configuração para integração com SPICE
export interface SpiceIntegration {
  enabled: boolean;
  spiceEngine: 'ltspice' | 'ngspice' | 'xyce';
  netlistPath?: string;
  simulationParameters: {
    timeStep: number;
    totalTime: number;
    temperature: number;
    convergenceThreshold: number;
  };
  exportSettings: {
    includeParasitics: boolean;
    modelAccuracy: 'basic' | 'detailed' | 'precise';
    frequencyAnalysis: boolean;
    transientAnalysis: boolean;
    dcAnalysis: boolean;
  };
}

// Eventos do sistema elétrico
export interface ElectricalEvent {
  id: string;
  timestamp: number;
  type: 'connection' | 'disconnection' | 'signal_change' | 'overcurrent' | 'overvoltage';
  componentId: string;
  pinId?: string;
  wireId?: string;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

// Sistema de monitoramento elétrico
export interface ElectricalMonitor {
  isActive: boolean;
  samplingRate: number; // Hz
  events: ElectricalEvent[];
  realTimeData: {
    totalCurrent: number;
    totalPower: number;
    efficiency: number;
    temperature: number;
  };
  alerts: {
    overcurrentThreshold: number;
    overvoltageThreshold: number;
    temperatureThreshold: number;
    powerThreshold: number;
  };
}

// Estado da simulação elétrica
export interface ElectricalSimulationState {
  isRunning: boolean;
  componentCount: number;
  wireCount: number;
  monitor: ElectricalMonitor;
  analysis: CircuitAnalysis | null;
  alerts: ElectricalEvent[];
}