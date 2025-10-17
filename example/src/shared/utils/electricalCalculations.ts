import {
  ElectricalWire,
  ElectricalComponent,
  ElectricalPin,
  SignalState,
  SignalType,
  CircuitAnalysis,
  ResistorComponent
} from '../types/electrical';

// Constantes físicas
const COPPER_RESISTIVITY = 1.68e-8; // Ω⋅m
const ALUMINUM_RESISTIVITY = 2.65e-8; // Ω⋅m
const SILVER_RESISTIVITY = 1.59e-8; // Ω⋅m

// Classe para cálculos elétricos
export class ElectricalCalculator {
  
  /**
   * Calcula a resistência de um fio baseado em suas propriedades físicas
   */
  static calculateWireResistance(wire: ElectricalWire): number {
    const { length, crossSection, material } = wire.electricalProperties;
    
    let resistivity: number;
    switch (material) {
      case 'copper':
        resistivity = COPPER_RESISTIVITY;
        break;
      case 'aluminum':
        resistivity = ALUMINUM_RESISTIVITY;
        break;
      case 'silver':
        resistivity = SILVER_RESISTIVITY;
        break;
      default:
        resistivity = COPPER_RESISTIVITY;
    }
    
    // R = ρ * L / A
    return resistivity * length / (crossSection * 1e-6); // Converter mm² para m²
  }
  
  /**
   * Calcula a queda de tensão em um fio
   */
  static calculateVoltageDropAcrossWire(wire: ElectricalWire, current: number): number {
    const resistance = this.calculateWireResistance(wire);
    return current * resistance; // V = I * R
  }
  
  /**
   * Calcula a potência dissipada em um fio
   */
  static calculateWirePowerDissipation(wire: ElectricalWire, current: number): number {
    const resistance = this.calculateWireResistance(wire);
    return current * current * resistance; // P = I² * R
  }
  
  /**
   * Simula o comportamento de um sinal digital
   */
  static simulateDigitalSignal(
    inputVoltage: number,
    _outputPin: ElectricalPin,
    wire: ElectricalWire,
    inputPin: ElectricalPin
  ): SignalState {
    // Calcular queda de tensão no fio
    const current = this.calculateCurrentFlow(inputVoltage, wire, inputPin);
    const voltageDrop = this.calculateVoltageDropAcrossWire(wire, current);
    const outputVoltage = inputVoltage - voltageDrop;
    
    // Determinar estado lógico (assumindo TTL: HIGH > 2V, LOW < 0.8V)
    const digitalValue = outputVoltage > 2.0;
    
    return {
      type: SignalType.DIGITAL,
      properties: {
        voltage: outputVoltage,
        current: current,
        resistance: wire.electricalProperties.resistance
      },
      timestamp: Date.now(),
      isActive: true,
      direction: 'output',
      digitalValue: digitalValue
    };
  }
  
  /**
   * Simula o comportamento de um sinal analógico
   */
  static simulateAnalogSignal(
    inputVoltage: number,
    _outputPin: ElectricalPin,
    wire: ElectricalWire,
    inputPin: ElectricalPin
  ): SignalState {
    const current = this.calculateCurrentFlow(inputVoltage, wire, inputPin);
    const voltageDrop = this.calculateVoltageDropAcrossWire(wire, current);
    const outputVoltage = inputVoltage - voltageDrop;
    
    // Converter para valor ADC (0-1023 para 10 bits, assumindo 5V como referência)
    const analogValue = Math.round((outputVoltage / 5.0) * 1023);
    
    return {
      type: SignalType.ANALOG,
      properties: {
        voltage: outputVoltage,
        current: current,
        resistance: wire.electricalProperties.resistance
      },
      timestamp: Date.now(),
      isActive: true,
      direction: 'output',
      analogValue: Math.max(0, Math.min(1023, analogValue))
    };
  }
  
  /**
   * Simula sinal PWM
   */
  static simulatePWMSignal(
    inputVoltage: number,
    dutyCycle: number,
    frequency: number,
    _outputPin: ElectricalPin,
    wire: ElectricalWire,
    inputPin: ElectricalPin
  ): SignalState {
    const current = this.calculateCurrentFlow(inputVoltage, wire, inputPin);
    const voltageDrop = this.calculateVoltageDropAcrossWire(wire, current);
    const outputVoltage = inputVoltage - voltageDrop;
    
    // Tensão média do PWM
    const averageVoltage = outputVoltage * dutyCycle;
    
    return {
      type: SignalType.PWM,
      properties: {
        voltage: averageVoltage,
        current: current,
        resistance: wire.electricalProperties.resistance,
        frequency: frequency,
        dutyCycle: dutyCycle
      },
      timestamp: Date.now(),
      isActive: true,
      direction: 'output'
    };
  }
  
  /**
   * Calcula o fluxo de corrente através de um fio
   */
  static calculateCurrentFlow(
    voltage: number,
    wire: ElectricalWire,
    inputPin: ElectricalPin
  ): number {
    const wireResistance = this.calculateWireResistance(wire);
    const totalResistance = wireResistance + inputPin.internalResistance;
    
    return voltage / totalResistance; // I = V / R
  }
  
  /**
   * Analisa um circuito completo
   */
  static analyzeCircuit(
    components: ElectricalComponent[],
    wires: ElectricalWire[]
  ): CircuitAnalysis {
    let totalPowerConsumption = 0;
    const voltageDrops = new Map<string, number>();
    const currentFlow = new Map<string, number>();
    const powerDissipation = new Map<string, number>();
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Analisar cada fio
    wires.forEach(wire => {
      const current = wire.currentSignal.properties.current;
      const voltageDrop = this.calculateVoltageDropAcrossWire(wire, current);
      const power = this.calculateWirePowerDissipation(wire, current);
      
      voltageDrops.set(wire.id, voltageDrop);
      currentFlow.set(wire.id, current);
      powerDissipation.set(wire.id, power);
      
      // Verificar limites
      if (current > 1.0) { // Limite arbitrário de 1A
        warnings.push(`Corrente alta detectada no fio ${wire.id}: ${current.toFixed(3)}A`);
      }
      
      if (voltageDrop > 0.5) { // Queda de tensão significativa
        warnings.push(`Queda de tensão significativa no fio ${wire.id}: ${voltageDrop.toFixed(3)}V`);
      }
    });
    
    // Analisar cada componente
    components.forEach(component => {
      const power = component.electricalModel.powerConsumption;
      totalPowerConsumption += power;
      powerDissipation.set(component.id, power);
      
      // Verificar temperatura
      if (component.simulationState.temperature > 85) { // Limite de temperatura
        warnings.push(`Temperatura alta no componente ${component.name}: ${component.simulationState.temperature}°C`);
      }
    });
    
    // Calcular eficiência (simplificado)
    const totalPowerDissipated = Array.from(powerDissipation.values()).reduce((sum, power) => sum + power, 0);
    const efficiency = totalPowerConsumption > 0 ? (totalPowerConsumption - totalPowerDissipated) / totalPowerConsumption : 0;
    
    return {
      totalPowerConsumption,
      voltageDrops,
      currentFlow,
      powerDissipation,
      efficiency: Math.max(0, efficiency),
      warnings,
      errors
    };
  }
  
  /**
   * Calcula a impedância de um fio em uma frequência específica
   */
  static calculateWireImpedance(wire: ElectricalWire, frequency: number): number {
    const { resistance, inductance, capacitance } = wire.electricalProperties;
    const omega = 2 * Math.PI * frequency;
    
    // Z = R + j(ωL - 1/(ωC))
    const reactiveComponent = omega * inductance - 1 / (omega * capacitance);
    return Math.sqrt(resistance * resistance + reactiveComponent * reactiveComponent);
  }
  
  /**
   * Simula o comportamento de um resistor
   */
  static simulateResistor(
    resistor: ResistorComponent,
    inputVoltage: number,
    inputCurrent: number
  ): { outputVoltage: number; powerDissipation: number; temperature: number } {
    const voltageDrop = inputCurrent * resistor.resistance;
    const outputVoltage = inputVoltage - voltageDrop;
    const powerDissipation = inputCurrent * inputCurrent * resistor.resistance;
    
    // Calcular aumento de temperatura (simplificado)
    const thermalResistance = 50; // °C/W (valor típico)
    const temperatureRise = powerDissipation * thermalResistance;
    const temperature = 25 + temperatureRise; // Temperatura ambiente + aumento
    
    return {
      outputVoltage,
      powerDissipation,
      temperature
    };
  }
  
  /**
   * Gera dados para visualização de fluxo de sinal
   */
  static generateSignalFlowVisualization(wire: ElectricalWire): {
    animationSpeed: number;
    particleCount: number;
    color: string;
    intensity: number;
  } {
    const current = wire.currentSignal.properties.current;
    const voltage = wire.currentSignal.properties.voltage;
    const power = voltage * current;
    
    // Velocidade da animação baseada na corrente
    const animationSpeed = Math.min(5, Math.max(0.1, current * 2));
    
    // Número de partículas baseado na potência
    const particleCount = Math.min(20, Math.max(1, Math.floor(power * 10)));
    
    // Cor baseada no tipo de sinal
    let color = '#888888';
    switch (wire.signalType) {
      case SignalType.POWER:
        color = '#ff0000';
        break;
      case SignalType.GROUND:
        color = '#000000';
        break;
      case SignalType.DIGITAL:
        color = '#00ff00';
        break;
      case SignalType.ANALOG:
        color = '#0000ff';
        break;
      case SignalType.PWM:
        color = '#ff00ff';
        break;
    }
    
    // Intensidade baseada na tensão
    const intensity = Math.min(1, voltage / 5); // Normalizado para 5V
    
    return {
      animationSpeed,
      particleCount,
      color,
      intensity
    };
  }
}

// Utilitários para conversão de unidades
export class ElectricalUnits {
  static milliampsToAmps(milliamps: number): number {
    return milliamps / 1000;
  }
  
  static ampsToMilliamps(amps: number): number {
    return amps * 1000;
  }
  
  static millivoltsToVolts(millivolts: number): number {
    return millivolts / 1000;
  }
  
  static voltsToMillivolts(volts: number): number {
    return volts * 1000;
  }
  
  static milliwattsToWatts(milliwatts: number): number {
    return milliwatts / 1000;
  }
  
  static wattsToMilliwatts(watts: number): number {
    return watts * 1000;
  }
  
  static ohmsToKiloohms(ohms: number): number {
    return ohms / 1000;
  }
  
  static kiloohmsTOhms(kiloohms: number): number {
    return kiloohms * 1000;
  }
}