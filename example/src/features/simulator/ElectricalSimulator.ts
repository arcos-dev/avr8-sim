import {
  ElectricalWire,
  ElectricalComponent,
  ElectricalPin,
  SignalState,
  SignalType,
  ElectricalEvent,
  ElectricalMonitor,
  CircuitAnalysis,
  SpiceIntegration
} from '../../shared/types/electrical';
import { ElectricalCalculator } from '../../shared/utils/electricalCalculations';

// Classe principal do simulador elétrico
export class ElectricalSimulator {
  private components: Map<string, ElectricalComponent> = new Map();
  private wires: Map<string, ElectricalWire> = new Map();
  private monitor: ElectricalMonitor;
  private isRunning: boolean = false;
  private simulationSpeed: number = 1.0;
  private timeStep: number = 1e-6; // 1 microsegundo
  private currentTime: number = 0;
  private spiceIntegration?: SpiceIntegration;
  
  // Callbacks para eventos
  private onStateChange?: (state: any) => void;
  private onCircuitAnalysis?: (analysis: CircuitAnalysis) => void;
  private onElectricalEvent?: (event: ElectricalEvent) => void;
  
  constructor() {
    this.monitor = {
      isActive: true,
      samplingRate: 1000, // 1kHz
      events: [],
      realTimeData: {
        totalCurrent: 0,
        totalPower: 0,
        efficiency: 0,
        temperature: 25
      },
      alerts: {
        overcurrentThreshold: 2.0, // 2A
        overvoltageThreshold: 6.0, // 6V
        temperatureThreshold: 85, // 85°C
        powerThreshold: 10.0 // 10W
      }
    };
  }
  
  /**
   * Adiciona um componente ao simulador
   */
  addComponent(component: ElectricalComponent): void {
    this.components.set(component.id, component);
    this.emitEvent({
      id: `event_${Date.now()}`,
      timestamp: Date.now(),
      type: 'connection',
      componentId: component.id,
      data: { action: 'component_added', component },
      severity: 'info'
    });
  }
  
  /**
   * Remove um componente do simulador
   */
  removeComponent(componentId: string): void {
    const component = this.components.get(componentId);
    if (component) {
      // Remover todas as conexões do componente
      const connectedWires = Array.from(this.wires.values()).filter(
        wire => wire.from.componentId === componentId || wire.to.componentId === componentId
      );
      
      connectedWires.forEach(wire => this.removeWire(wire.id));
      
      this.components.delete(componentId);
      this.emitEvent({
        id: `event_${Date.now()}`,
        timestamp: Date.now(),
        type: 'disconnection',
        componentId: componentId,
        data: { action: 'component_removed' },
        severity: 'info'
      });
    }
  }
  
  /**
   * Adiciona uma via elétrica
   */
  addWire(wire: ElectricalWire): void {
    // Validar conexão
    const fromComponent = this.components.get(wire.from.componentId);
    const toComponent = this.components.get(wire.to.componentId);
    
    if (!fromComponent || !toComponent) {
      throw new Error('Componentes não encontrados para a conexão');
    }
    
    const fromPin = fromComponent.pins.find(p => p.id === wire.from.pinId);
    const toPin = toComponent.pins.find(p => p.id === wire.to.pinId);
    
    if (!fromPin || !toPin) {
      throw new Error('Pinos não encontrados para a conexão');
    }
    
    // Verificar compatibilidade de sinais
    if (!this.areSignalTypesCompatible(fromPin.type, toPin.type)) {
      throw new Error(`Tipos de sinal incompatíveis: ${fromPin.type} -> ${toPin.type}`);
    }
    
    // Marcar pinos como conectados
    fromPin.isConnected = true;
    fromPin.connectedWireId = wire.id;
    toPin.isConnected = true;
    toPin.connectedWireId = wire.id;
    
    this.wires.set(wire.id, wire);
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      timestamp: Date.now(),
      type: 'connection',
      componentId: wire.from.componentId,
      wireId: wire.id,
      data: { action: 'wire_added', wire },
      severity: 'info'
    });
  }
  
  /**
   * Remove uma via elétrica
   */
  removeWire(wireId: string): void {
    const wire = this.wires.get(wireId);
    if (wire) {
      // Desconectar pinos
      const fromComponent = this.components.get(wire.from.componentId);
      const toComponent = this.components.get(wire.to.componentId);
      
      if (fromComponent) {
        const fromPin = fromComponent.pins.find(p => p.id === wire.from.pinId);
        if (fromPin) {
          fromPin.isConnected = false;
          fromPin.connectedWireId = undefined;
        }
      }
      
      if (toComponent) {
        const toPin = toComponent.pins.find(p => p.id === wire.to.pinId);
        if (toPin) {
          toPin.isConnected = false;
          toPin.connectedWireId = undefined;
        }
      }
      
      this.wires.delete(wireId);
      
      this.emitEvent({
        id: `event_${Date.now()}`,
        timestamp: Date.now(),
        type: 'disconnection',
        componentId: wire.from.componentId,
        wireId: wireId,
        data: { action: 'wire_removed' },
        severity: 'info'
      });
    }
  }
  
  /**
   * Inicia a simulação
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentTime = 0;
    
    // Chamar callback inicial para atualizar estado
    if (this.onStateChange) {
      this.onStateChange({
        isRunning: this.isRunning,
        componentCount: this.components.size,
        wireCount: this.wires.size,
        monitor: this.monitor,
        analysis: null
      });
    }
    
    this.simulationLoop();
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      timestamp: Date.now(),
      type: 'signal_change',
      componentId: 'simulator',
      data: { action: 'simulation_started' },
      severity: 'info'
    });
  }
  
  /**
   * Para a simulação
   */
  stop(): void {
    this.isRunning = false;
    
    // Chamar callback para atualizar estado
    if (this.onStateChange) {
      this.onStateChange({
        isRunning: this.isRunning,
        componentCount: this.components.size,
        wireCount: this.wires.size,
        monitor: this.monitor,
        analysis: null
      });
    }
    
    this.emitEvent({
      id: `event_${Date.now()}`,
      timestamp: Date.now(),
      type: 'signal_change',
      componentId: 'simulator',
      data: { action: 'simulation_stopped' },
      severity: 'info'
    });
  }
  
  /**
   * Loop principal da simulação
   */
  private simulationLoop(): void {
    if (!this.isRunning) return;
    
    // Atualizar sinais em todas as vias
    this.updateSignals();
    
    // Analisar circuito
    const analysis = this.analyzeCircuit();
    if (this.onCircuitAnalysis) {
      this.onCircuitAnalysis(analysis);
    }
    
    // Atualizar monitor
    this.updateMonitor(analysis);
    
    // Verificar alertas
    this.checkAlerts(analysis);
    
    // Avançar tempo
    this.currentTime += this.timeStep;
    
    // Agendar próxima iteração (usar intervalo mínimo de 16ms para ~60fps)
    const intervalMs = Math.max(16, this.timeStep * 1000 / this.simulationSpeed);
    setTimeout(() => this.simulationLoop(), intervalMs);
  }
  
  /**
   * Atualiza os sinais em todas as vias
   */
  private updateSignals(): void {
    this.wires.forEach(wire => {
      const fromComponent = this.components.get(wire.from.componentId);
      const toComponent = this.components.get(wire.to.componentId);
      
      if (!fromComponent || !toComponent) return;
      
      const fromPin = fromComponent.pins.find(p => p.id === wire.from.pinId);
      const toPin = toComponent.pins.find(p => p.id === wire.to.pinId);
      
      if (!fromPin || !toPin) return;
      
      // Simular propagação do sinal
      const newSignal = this.propagateSignal(fromPin, wire, toPin);
      wire.currentSignal = newSignal;
      
      // Atualizar estado do pino de destino
      toPin.currentState = newSignal;
      
      // Emitir evento de mudança de sinal se necessário
      if (this.hasSignalChanged(wire.currentSignal, newSignal)) {
        this.emitEvent({
          id: `event_${Date.now()}`,
          timestamp: Date.now(),
          type: 'signal_change',
          componentId: wire.from.componentId,
          wireId: wire.id,
          data: { oldSignal: wire.currentSignal, newSignal },
          severity: 'info'
        });
      }
    });
  }
  
  /**
   * Propaga um sinal através de uma via
   */
  private propagateSignal(
    fromPin: ElectricalPin,
    wire: ElectricalWire,
    toPin: ElectricalPin
  ): SignalState {
    const inputVoltage = fromPin.currentState.properties.voltage;
    
    switch (wire.signalType) {
      case SignalType.DIGITAL:
        return ElectricalCalculator.simulateDigitalSignal(inputVoltage, fromPin, wire, toPin);
      
      case SignalType.ANALOG:
        return ElectricalCalculator.simulateAnalogSignal(inputVoltage, fromPin, wire, toPin);
      
      case SignalType.PWM: {
        const frequency = fromPin.currentState.properties.frequency || 1000;
        const dutyCycle = fromPin.currentState.properties.dutyCycle || 0.5;
        return ElectricalCalculator.simulatePWMSignal(
          inputVoltage, dutyCycle, frequency, fromPin, wire, toPin
        );
      }
      
      default: {
        // Sinal genérico
        const current = ElectricalCalculator.calculateCurrentFlow(inputVoltage, wire, toPin);
        const voltageDrop = ElectricalCalculator.calculateVoltageDropAcrossWire(wire, current);
        
        return {
          type: wire.signalType,
          properties: {
            voltage: inputVoltage - voltageDrop,
            current: current,
            resistance: wire.electricalProperties.resistance
          },
          timestamp: Date.now(),
          isActive: true,
          direction: 'output'
        };
      }
    }
  }
  
  /**
   * Analisa o circuito atual
   */
  private analyzeCircuit(): CircuitAnalysis {
    return ElectricalCalculator.analyzeCircuit(
      Array.from(this.components.values()),
      Array.from(this.wires.values())
    );
  }
  
  /**
   * Atualiza o monitor elétrico
   */
  private updateMonitor(analysis: CircuitAnalysis): void {
    this.monitor.realTimeData = {
      totalCurrent: Array.from(analysis.currentFlow.values()).reduce((sum, current) => sum + current, 0),
      totalPower: analysis.totalPowerConsumption,
      efficiency: analysis.efficiency,
      temperature: Math.max(...Array.from(this.components.values()).map(c => c.simulationState.temperature))
    };
    
    // Chamar callback de mudança de estado
    if (this.onStateChange) {
      this.onStateChange({
        isRunning: this.isRunning,
        componentCount: this.components.size,
        wireCount: this.wires.size,
        monitor: this.monitor,
        analysis: analysis
      });
    }
  }
  
  /**
   * Verifica alertas do sistema
   */
  private checkAlerts(analysis: CircuitAnalysis): void {
    const { alerts } = this.monitor;
    
    // Verificar sobrecorrente
    analysis.currentFlow.forEach((current, wireId) => {
      if (current > alerts.overcurrentThreshold) {
        this.emitEvent({
          id: `event_${Date.now()}`,
          timestamp: Date.now(),
          type: 'overcurrent',
          componentId: 'monitor',
          wireId: wireId,
          data: { current, threshold: alerts.overcurrentThreshold },
          severity: 'warning'
        });
      }
    });
    
    // Verificar sobretensão
    this.wires.forEach(wire => {
      const voltage = wire.currentSignal.properties.voltage;
      if (voltage > alerts.overvoltageThreshold) {
        this.emitEvent({
          id: `event_${Date.now()}`,
          timestamp: Date.now(),
          type: 'overvoltage',
          componentId: wire.from.componentId,
          wireId: wire.id,
          data: { voltage, threshold: alerts.overvoltageThreshold },
          severity: 'warning'
        });
      }
    });
    
    // Verificar temperatura
    this.components.forEach(component => {
      if (component.simulationState.temperature > alerts.temperatureThreshold) {
        this.emitEvent({
          id: `event_${Date.now()}`,
          timestamp: Date.now(),
          type: 'signal_change',
          componentId: component.id,
          data: { 
            temperature: component.simulationState.temperature, 
            threshold: alerts.temperatureThreshold,
            type: 'overtemperature'
          },
          severity: 'warning'
        });
      }
    });
  }
  
  /**
   * Verifica se dois tipos de sinal são compatíveis
   */
  private areSignalTypesCompatible(type1: SignalType, type2: SignalType): boolean {
    // Regras de compatibilidade
    const compatibilityMatrix: Record<SignalType, SignalType[]> = {
      [SignalType.DIGITAL]: [SignalType.DIGITAL, SignalType.PWM],
      [SignalType.ANALOG]: [SignalType.ANALOG, SignalType.DIGITAL],
      [SignalType.POWER]: [SignalType.POWER],
      [SignalType.GROUND]: [SignalType.GROUND],
      [SignalType.I2C_DATA]: [SignalType.I2C_DATA, SignalType.DIGITAL],
      [SignalType.I2C_CLOCK]: [SignalType.I2C_CLOCK, SignalType.DIGITAL],
      [SignalType.SPI_DATA]: [SignalType.SPI_DATA, SignalType.DIGITAL],
      [SignalType.SPI_CLOCK]: [SignalType.SPI_CLOCK, SignalType.DIGITAL],
      [SignalType.UART_TX]: [SignalType.UART_RX, SignalType.DIGITAL],
      [SignalType.UART_RX]: [SignalType.UART_TX, SignalType.DIGITAL],
      [SignalType.PWM]: [SignalType.PWM, SignalType.DIGITAL, SignalType.ANALOG]
    };
    
    return compatibilityMatrix[type1]?.includes(type2) || false;
  }
  
  /**
   * Verifica se um sinal mudou
   */
  private hasSignalChanged(oldSignal: SignalState, newSignal: SignalState): boolean {
    const voltageThreshold = 0.01; // 10mV
    const currentThreshold = 0.001; // 1mA
    
    return Math.abs(oldSignal.properties.voltage - newSignal.properties.voltage) > voltageThreshold ||
           Math.abs(oldSignal.properties.current - newSignal.properties.current) > currentThreshold ||
           oldSignal.digitalValue !== newSignal.digitalValue ||
           Math.abs((oldSignal.analogValue || 0) - (newSignal.analogValue || 0)) > 1;
  }
  
  /**
   * Emite um evento
   */
  private emitEvent(event: ElectricalEvent): void {
    this.monitor.events.push(event);
    
    // Manter apenas os últimos 1000 eventos
    if (this.monitor.events.length > 1000) {
      this.monitor.events = this.monitor.events.slice(-1000);
    }
    
    if (this.onElectricalEvent) {
      this.onElectricalEvent(event);
    }
  }
  
  /**
   * Define callback para mudanças de estado
   */
  setOnStateChange(callback: (state: any) => void): void {
    this.onStateChange = callback;
  }
  
  /**
   * Define callback para análise de circuito
   */
  setOnCircuitAnalysis(callback: (analysis: CircuitAnalysis) => void): void {
    this.onCircuitAnalysis = callback;
  }
  
  /**
   * Define callback para eventos elétricos
   */
  setOnElectricalEvent(callback: (event: ElectricalEvent) => void): void {
    this.onElectricalEvent = callback;
  }
  
  /**
   * Obtém o estado atual do monitor
   */
  getMonitorState(): ElectricalMonitor {
    return { ...this.monitor };
  }
  
  /**
   * Obtém todos os componentes
   */
  getComponents(): ElectricalComponent[] {
    return Array.from(this.components.values());
  }
  
  /**
   * Obtém todas as vias
   */
  getWires(): ElectricalWire[] {
    return Array.from(this.wires.values());
  }
  
  /**
   * Define a velocidade da simulação
   */
  setSimulationSpeed(speed: number): void {
    this.simulationSpeed = Math.max(0.1, Math.min(10, speed));
  }
  
  /**
   * Configura integração com SPICE
   */
  configureSpiceIntegration(config: SpiceIntegration): void {
    this.spiceIntegration = config;
  }
  
  /**
   * Exporta netlist para SPICE
   */
  exportToSpice(): string {
    if (!this.spiceIntegration?.enabled) {
      throw new Error('Integração SPICE não está habilitada');
    }
    
    let netlist = '* Netlist gerada pelo LabElet Simulator\n';
    netlist += '* ' + new Date().toISOString() + '\n\n';
    
    // Adicionar componentes
    this.components.forEach(component => {
      netlist += `* Componente: ${component.name} (${component.type})\n`;
      // Adicionar modelo SPICE do componente
    });
    
    // Adicionar conexões
    this.wires.forEach(wire => {
      netlist += `* Via: ${wire.id}\n`;
      // Adicionar modelo da via
    });
    
    netlist += '\n.end\n';
    
    return netlist;
  }
}