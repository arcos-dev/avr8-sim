import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Wire, Component, PinConnection } from '../../shared/types';
import {
  ElectricalWire,
  ElectricalComponent,
  ElectricalPin,
  SignalType,
  ElectricalSimulationState
} from '../../shared/types/electrical';
import { ElectricalSimulator } from '../simulator/ElectricalSimulator';
import { ElectricalCalculator } from '../../shared/utils/electricalCalculations';
import './WiringSystem.css';

interface WiringSystemProps {
  components: Component[];
  wires: Wire[];
  onWireCreate: (wire: Wire) => void;
  onPadSelect: (componentId: string, pin: string, wireId: string) => void;
  isWiringMode: boolean;
  // Novas propriedades para simulação elétrica
  enableElectricalSimulation?: boolean;
  onElectricalStateChange?: (state: ElectricalSimulationState) => void;
  showSignalFlow?: boolean;
  showElectricalProperties?: boolean;
}

export const WiringSystem: React.FC<WiringSystemProps> = ({
  components,
  wires,
  onWireCreate,
  onPadSelect,
  isWiringMode,
  enableElectricalSimulation = false,
  onElectricalStateChange,
  showSignalFlow = true,
  showElectricalProperties = false
}) => {
  const [startPin, setStartPin] = useState<PinConnection | null>(null);
  const [currentWire, setCurrentWire] = useState<{ start: PinConnection; end: { x: number; y: number } } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Simulador elétrico
  const [electricalSimulator] = useState(() => new ElectricalSimulator());
  const [signalFlowData, setSignalFlowData] = useState<Map<string, any>>(new Map());

  // Inicializar simulador elétrico
  useEffect(() => {
    if (enableElectricalSimulation) {
      electricalSimulator.setOnStateChange((state) => {
        if (onElectricalStateChange) {
          onElectricalStateChange(state);
        }
      });

      electricalSimulator.setOnCircuitAnalysis(() => {
        // Atualizar dados de fluxo de sinal
        const newSignalFlowData = new Map();
        electricalSimulator.getWires().forEach(wire => {
          const flowData = ElectricalCalculator.generateSignalFlowVisualization(wire);
          newSignalFlowData.set(wire.id, flowData);
        });
        setSignalFlowData(newSignalFlowData);
      });

      electricalSimulator.start();
    }

    return () => {
      if (enableElectricalSimulation) {
        electricalSimulator.stop();
      }
    };
  }, [enableElectricalSimulation, electricalSimulator, onElectricalStateChange]);

  // Converter componente legado para componente elétrico
  const convertToElectricalComponent = useCallback((component: Component): ElectricalComponent => {
    const pins = getComponentPins(component).map((pin) => {
      let signalType: SignalType;
      let maxVoltage = 5.0;
      let maxCurrent = 0.02; // 20mA padrão

      // Determinar tipo de sinal baseado no nome do pino e tipo do componente
      if (pin.name === 'VCC' || pin.name === '5V') {
        signalType = SignalType.POWER;
        maxCurrent = 1.0;
      } else if (pin.name === 'GND') {
        signalType = SignalType.GROUND;
        maxVoltage = 0;
        maxCurrent = 1.0;
      } else if (pin.name === 'SDA') {
        signalType = SignalType.I2C_DATA;
      } else if (pin.name === 'SCL') {
        signalType = SignalType.I2C_CLOCK;
      } else if (pin.name.startsWith('A')) {
        signalType = SignalType.ANALOG;
      } else if (pin.name.startsWith('D')) {
        signalType = SignalType.DIGITAL;
      } else {
        signalType = SignalType.DIGITAL; // Padrão
      }

      const electricalPin: ElectricalPin = {
        id: `${component.id}_${pin.name}`,
        name: pin.name,
        position: { x: pin.x, y: pin.y },
        type: signalType,
        direction: (() => {
          if (pin.type === 'output') return 'output';
          if (pin.type === 'power') return 'bidirectional';
          return 'input';
        })(),
        maxVoltage,
        maxCurrent,
        internalResistance: signalType === SignalType.POWER ? 0.1 : 10000, // 0.1Ω para power, 10kΩ para outros
        currentState: {
          type: signalType,
          properties: {
            voltage: signalType === SignalType.POWER ? 5.0 : 0,
            current: 0,
            resistance: 0
          },
          timestamp: Date.now(),
          isActive: false,
          direction: pin.type === 'output' ? 'output' : 'input'
        },
        supportedSignalTypes: [signalType],
        isConnected: false
      };

      return electricalPin;
    });

    return {
      id: component.id,
      type: component.tag,
      name: component.tag,
      position: { x: component.x, y: component.y },
      pins,
      electricalModel: {
        powerConsumption: getPowerConsumption(component.tag),
        operatingVoltage: { min: 3.3, max: 5.5 },
        operatingCurrent: { min: 0.001, max: 0.1 }
      },
      simulationState: {
        isActive: true,
        temperature: 25,
        powerDissipation: 0
      }
    };
  }, []);

  // Converter fio legado para fio elétrico
  const convertToElectricalWire = useCallback((wire: Wire): ElectricalWire => {
    const signalType = getSignalTypeFromWireColor(wire.color);
    const length = Math.sqrt(
      Math.pow(wire.to.x - wire.from.x, 2) +
      Math.pow(wire.to.y - wire.from.y, 2)
    ) / 100; // Converter pixels para metros (aproximação)

    return {
      id: wire.id,
      from: {
        componentId: wire.from.componentId,
        pinId: `${wire.from.componentId}_${wire.from.pin}`,
        position: { x: wire.from.x, y: wire.from.y }
      },
      to: {
        componentId: wire.to.componentId,
        pinId: `${wire.to.componentId}_${wire.to.pin}`,
        position: { x: wire.to.x, y: wire.to.y }
      },
      signalType,
      electricalProperties: {
        resistance: length * 0.017, // Resistência do cobre (Ω/m)
        capacitance: length * 100e-12, // Capacitância parasita (pF/m)
        inductance: length * 1e-6, // Indutância parasita (µH/m)
        length,
        crossSection: 0.5, // 0.5 mm² (fio AWG 20)
        material: 'copper'
      },
      currentSignal: {
        type: signalType,
        properties: {
          voltage: 0,
          current: 0,
          resistance: 0
        },
        timestamp: Date.now(),
        isActive: false,
        direction: 'output'
      },
      color: wire.color,
      visualProperties: {
        thickness: 3,
        opacity: 1,
        animationSpeed: 1,
        showSignalFlow: showSignalFlow
      },
      metadata: {
        createdAt: Date.now(),
        lastModified: Date.now()
      }
    };
  }, [showSignalFlow]);

  // Obter consumo de energia baseado no tipo do componente
  const getPowerConsumption = (componentType: string): number => {
    const powerMap: Record<string, number> = {
      'arduino-uno': 0.2, // 200mW
      'sim-arduino-uno': 0.2,
      'led': 0.02, // 20mW
      'sim-led': 0.02,
      'lcd1602': 0.1, // 100mW
      'sim-lcd1602': 0.1,
      'ssd1306': 0.05, // 50mW
      'sim-ssd1306': 0.05,
      'resistor': 0, // Calculado dinamicamente
      'sim-resistor': 0,
      'pushbutton': 0,
      'sim-pushbutton': 0
    };

    return powerMap[componentType] || 0.01; // 10mW padrão
  };

  // Obter tipo de sinal baseado na cor do fio
  const getSignalTypeFromWireColor = (color: string): SignalType => {
    const colorMap: Record<string, SignalType> = {
      '#ff0000': SignalType.POWER, // Vermelho
      '#000000': SignalType.GROUND, // Preto
      '#00ff00': SignalType.I2C_DATA, // Verde (SDA)
      '#0000ff': SignalType.I2C_CLOCK, // Azul (SCL)
      '#ffff00': SignalType.DIGITAL, // Amarelo
      '#ff8800': SignalType.ANALOG, // Laranja
      '#ff00ff': SignalType.PWM // Magenta
    };

    return colorMap[color] || SignalType.DIGITAL;
  };

  const autoWireI2CComponents = useCallback(() => {
    const arduino = components.find(c => c.tag === 'arduino-uno' || c.tag === 'sim-arduino-uno');
  const displays = components.filter(c =>
    c.tag === 'lcd1602' || c.tag === 'ssd1306' || c.tag === 'sim-lcd1602' || c.tag === 'sim-ssd1306'
  );

    if (!arduino || displays.length === 0) return;

    displays.forEach(component => {
      // Check if this component is already wired
      const existingWires = wires.filter(wire =>
        wire.from.componentId === component.id || wire.to.componentId === component.id
      );

      if (existingWires.length === 0) {
        // Auto-create I2C connections
        const arduinoPins = getComponentPins(arduino);
        const componentPins = getComponentPins(component);

        // Create power connections
        const vccPin = componentPins.find(p => p.name === 'VCC');
        const gndPin = componentPins.find(p => p.name === 'GND');
        const sdaPin = componentPins.find(p => p.name === 'SDA');
        const sclPin = componentPins.find(p => p.name === 'SCL');

        const arduino5V = arduinoPins.find(p => p.name === 'VCC');
        const arduinoGND = arduinoPins.find(p => p.name === 'GND');
        const arduinoA4 = arduinoPins.find(p => p.name === 'A4');
        const arduinoA5 = arduinoPins.find(p => p.name === 'A5');

        // Create wires automatically
        if (vccPin && arduino5V) {
          onWireCreate({
            id: `auto_wire_vcc_${component.id}`,
            from: { componentId: arduino.id, pin: 'VCC', x: arduino5V.x, y: arduino5V.y },
            to: { componentId: component.id, pin: 'VCC', x: vccPin.x, y: vccPin.y },
            color: '#ff0000'
          });
        }

        if (gndPin && arduinoGND) {
          onWireCreate({
            id: `auto_wire_gnd_${component.id}`,
            from: { componentId: arduino.id, pin: 'GND', x: arduinoGND.x, y: arduinoGND.y },
            to: { componentId: component.id, pin: 'GND', x: gndPin.x, y: gndPin.y },
            color: '#000000'
          });
        }

        if (sdaPin && arduinoA4) {
          onWireCreate({
            id: `auto_wire_sda_${component.id}`,
            from: { componentId: arduino.id, pin: 'A4', x: arduinoA4.x, y: arduinoA4.y },
            to: { componentId: component.id, pin: 'SDA', x: sdaPin.x, y: sdaPin.y },
            color: '#00ff00'
          });
        }

        if (sclPin && arduinoA5) {
          onWireCreate({
            id: `auto_wire_scl_${component.id}`,
            from: { componentId: arduino.id, pin: 'A5', x: arduinoA5.x, y: arduinoA5.y },
            to: { componentId: component.id, pin: 'SCL', x: sclPin.x, y: sclPin.y },
            color: '#0000ff'
          });
        }
      }
    });
  }, [components, onWireCreate, wires]);

  // Auto-wire I2C components when they are added
  React.useEffect(() => {
    autoWireI2CComponents();
  }, [autoWireI2CComponents]);

  // Get component pins based on type
  const getComponentPins = (component: Component) => {
    const pins: { name: string; x: number; y: number; type: 'input' | 'output' | 'power' }[] = [];

    switch (component.tag) {
      case 'led':
      case 'sim-led':
        // LED pins positioned below the LED circle
        pins.push(
          { name: 'A', x: component.x + 6, y: component.y + 30, type: 'input' }, // Anodo
          { name: 'C', x: component.x + 19, y: component.y + 30, type: 'input' }  // Catado
        );
        break;
      case 'pushbutton':
      case 'sim-pushbutton':
        // Pushbutton pins positioned at the corners
        pins.push(
          { name: '1.l', x: component.x - 32, y: component.y + 50, type: 'input' },
          { name: '1.r', x: component.x + 42, y: component.y + 50, type: 'input' },
          { name: '2.l', x: component.x - 32, y: component.y + 50, type: 'input' },
          { name: '2.r', x: component.x + 32, y: component.y + 50, type: 'input' }
        );
        break;
      case 'arduino-uno':
      case 'sim-arduino-uno':
        // Digital pins (lado superior) - D13 a D0 (14 pinos) - ordem invertida
        for (let i = 0; i <= 13; i++) {
          pins.push({
            name: `D${13 - i}`, // Inverte a ordem: D13, D12, D11, ..., D1, D0
            x: component.x + (i * 10) + 6,
            y: component.y - 11,
            type: 'output'
          });
        }
        // Analog pins (lado inferior) - A0 a A5 (6 pinos)
        for (let i = 0; i <= 5; i++) {
          pins.push({
            name: `A${i}`,
            x: component.x + (i * 10) + 10,
            y: component.y + 90,
            type: 'input'
          });
        }
        // Power pins (mesma linha dos analógicos, mais à direita)
        pins.push(
          { name: 'VCC', x: component.x + 80, y: component.y + 90, type: 'power' }, // Mesma Y dos analógicos, mais à direita
          { name: 'GND', x: component.x + 110, y: component.y + 90, type: 'power' }  // Espaçamento de 30 pixels do VCC
        );
        break;
      case 'resistor':
      case 'sim-resistor':
        // Resistor pins centered at the terminal ends (gray lines)
        pins.push(
          { name: '1', x: component.x - 7, y: component.y + 15, type: 'input' }, // Terminal esquerdo
          { name: '2', x: component.x + 69, y: component.y + 15, type: 'input' }   // Terminal direito
        );
        break;
      case 'lcd1602':
      case 'sim-lcd1602':
        // LCD I2C pins positioned at the bottom edge
        pins.push(
          { name: 'VCC', x: component.x - 25, y: component.y + 30, type: 'power' },
          { name: 'GND', x: component.x - 8, y: component.y + 30, type: 'power' },
          { name: 'SDA', x: component.x + 8, y: component.y + 30, type: 'input' },
          { name: 'SCL', x: component.x + 25, y: component.y + 30, type: 'input' }
        );
        break;
      case 'ssd1306':
      case 'sim-ssd1306':
        // SSD1306 OLED I2C pins positioned at the bottom edge
        pins.push(
          { name: 'VCC', x: component.x - 15, y: component.y + 24, type: 'power' },
          { name: 'GND', x: component.x - 5, y: component.y + 24, type: 'power' },
          { name: 'SDA', x: component.x + 5, y: component.y + 24, type: 'input' },
          { name: 'SCL', x: component.x + 15, y: component.y + 24, type: 'input' }
        );
        break;
      default:
        // Generic component with 2 pins positioned at the sides
        pins.push(
          { name: '1', x: component.x - 12, y: component.y + 8, type: 'input' },
          { name: '2', x: component.x + 12, y: component.y + 8, type: 'input' }
        );
        break;
    }

    return pins;
  };

  // Sincronizar componentes com simulador elétrico
  useEffect(() => {
    if (enableElectricalSimulation) {
      // Adicionar componentes ao simulador
      components.forEach(component => {
        const electricalComponent = convertToElectricalComponent(component);
        try {
          electricalSimulator.addComponent(electricalComponent);
        } catch (error) {
          // Componente já existe, ignorar
          console.warn('Component already exists:', component.id, error);
        }
      });

      // Adicionar fios ao simulador
      wires.forEach(wire => {
        const electricalWire = convertToElectricalWire(wire);
        try {
          electricalSimulator.addWire(electricalWire);
        } catch (error) {
          // Fio já existe ou conexão inválida, ignorar
          console.warn('Erro ao adicionar fio ao simulador elétrico:', error);
        }
      });
    }
  }, [components, wires, enableElectricalSimulation, electricalSimulator, convertToElectricalComponent, convertToElectricalWire]);

  // Helper function to find connected wire
  const findConnectedWire = useCallback((componentId: string, pin: string) => {
    return wires.find(wire =>
      (wire.from.componentId === componentId && wire.from.pin === pin) ||
      (wire.to.componentId === componentId && wire.to.pin === pin)
    );
  }, [wires]);

  // Helper function to start new wire
  const startNewWire = useCallback((pinConnection: PinConnection) => {
    setStartPin(pinConnection);
    setCurrentWire({ start: pinConnection, end: { x: pinConnection.x, y: pinConnection.y } });
  }, []);

  // Helper function to complete wire
  const completeWire = useCallback((pinConnection: PinConnection) => {
    if (startPin && startPin.componentId !== pinConnection.componentId) {
      const wireColor = getWireColor(startPin.pin, pinConnection.pin);
      const newWire: Wire = {
        id: `wire_${Date.now()}`,
        from: startPin,
        to: pinConnection,
        color: wireColor
      };

      onWireCreate(newWire);

      if (enableElectricalSimulation) {
        try {
          const electricalWire = convertToElectricalWire(newWire);
          electricalSimulator.addWire(electricalWire);
        } catch (error) {
          console.warn('Erro ao adicionar fio ao simulador elétrico:', error);
        }
      }
    }

    setStartPin(null);
    setCurrentWire(null);
  }, [startPin, onWireCreate, enableElectricalSimulation, electricalSimulator, convertToElectricalWire]);

  // Handle pin click
  const handlePinClick = useCallback((componentId: string, pin: string, x: number, y: number) => {
    if (!isWiringMode) return;

    const connectedWire = findConnectedWire(componentId, pin);
    if (connectedWire) {
      onPadSelect(componentId, pin, connectedWire.id);
      return;
    }

    const pinConnection: PinConnection = { componentId, pin, x, y };

    if (!startPin) {
      startNewWire(pinConnection);
    } else {
      completeWire(pinConnection);
    }
  }, [isWiringMode, startPin, onPadSelect, findConnectedWire, startNewWire, completeWire]);

  // Get wire color based on connection type
  const getWireColor = (fromPin: string, toPin: string): string => {
    // Power connections
    if (fromPin.includes('VCC') || toPin.includes('VCC') || fromPin.includes('5V') || toPin.includes('5V')) return '#ff0000'; // Red for power
    if (fromPin.includes('GND') || toPin.includes('GND')) return '#000000'; // Black for ground

    // I2C connections
    if ((fromPin === 'SDA' || toPin === 'SDA') || (fromPin === 'A4' && toPin === 'SDA') || (fromPin === 'SDA' && toPin === 'A4')) return '#00ff00'; // Green for SDA
    if ((fromPin === 'SCL' || toPin === 'SCL') || (fromPin === 'A5' && toPin === 'SCL') || (fromPin === 'SCL' && toPin === 'A5')) return '#0000ff'; // Blue for SCL

    // Digital pins
    if (fromPin.startsWith('D') || toPin.startsWith('D')) return '#ffff00'; // Yellow for digital

    // Analog pins
    if (fromPin.startsWith('A') || toPin.startsWith('A')) return '#ff8800'; // Orange for analog

    return '#888888'; // Gray for others
  };



  // Handle mouse move for current wire
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !currentWire) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentWire(prev => prev ? { ...prev, end: { x, y } } : null);
  }, [currentWire]);

  // Cancel current wire on right click
  const handleRightClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setStartPin(null);
    setCurrentWire(null);
  }, []);

  // Get current pin position for a component
  const getCurrentPinPosition = useCallback((componentId: string, pinName: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return null;

    const pins = getComponentPins(component);
    const pin = pins.find(p => p.name === pinName);
    return pin ? { x: pin.x, y: pin.y } : null;
  }, [components]);

  // Force re-render when components move to update wire positions
  const [forceUpdateValue, setForceUpdateValue] = useState(0);
  React.useEffect(() => {
    setForceUpdateValue(prev => prev + 1);
  }, [components]);

  // Explicitly consume forceUpdateValue to satisfy linting rules
  React.useMemo(() => forceUpdateValue, [forceUpdateValue]);

  // Type guard to check if wire is a current wire
  const isCurrentWire = (w: Wire | { start: PinConnection; end: { x: number; y: number }; color?: string }): w is { start: PinConnection; end: { x: number; y: number }; color?: string } => {
    return 'start' in w;
  };

  // Helper function to get wire positions and color
  const getWireData = (wire: Wire | { start: PinConnection; end: { x: number; y: number }; color?: string }) => {
    if (isCurrentWire(wire)) {
      return {
        from: wire.start,
        to: wire.end,
        color: wire.color || '#888888'
      };
    }

    const fromPos = getCurrentPinPosition(wire.from.componentId, wire.from.pin);
    const toPos = getCurrentPinPosition(wire.to.componentId, wire.to.pin);

    if (!fromPos || !toPos) return null;

    return {
      from: { ...wire.from, x: fromPos.x, y: fromPos.y },
      to: { ...wire.to, x: toPos.x, y: toPos.y },
      color: wire.color
    };
  };

  // Helper function to calculate cable path
  const calculateCablePath = (from: PinConnection, to: PinConnection | { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const baseSag = Math.min(distance * 0.15, 60);
    const tensionFactor = Math.max(0.3, 1 - (distance / 400));
    const sagAmount = baseSag * tensionFactor;

    const horizontalStretch = Math.abs(dx) * 0.3;
    const verticalInfluence = Math.abs(dy) * 0.1;

    const control1X = from.x + (dx > 0 ? horizontalStretch : -horizontalStretch);
    const control1Y = from.y + sagAmount * 0.4 + verticalInfluence;
    const control2X = to.x - (dx > 0 ? horizontalStretch : -horizontalStretch);
    const control2Y = to.y + sagAmount * 0.4 + verticalInfluence;

    return {
      path: `M ${from.x} ${from.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${to.x} ${to.y}`,
      distance
    };
  };

  // Helper function to get cable CSS classes
  const getCableClasses = (wire: Wire | { start: PinConnection; end: { x: number; y: number }; color?: string }, distance: number) => {
    const classes = ['cable-vintage'];

    if (isCurrentWire(wire)) {
      classes.push('cable-connecting');
    } else {
      // Add classes based on wire type
      if (wire.color === '#ff0000') classes.push('cable-power');
      else if (wire.color === '#000000') classes.push('cable-ground');
      else if (wire.color === '#00ff00') classes.push('cable-signal');
      else if (wire.color === '#0000ff') classes.push('cable-data');

      // Add tension classes based on distance
      if (distance > 200) classes.push('cable-tension-high');
      else classes.push('cable-tension-low');

      // Add sway effect for longer cables
      if (distance > 150) classes.push('cable-sway');
    }

    return classes.join(' ');
  };

  // Renderizar informações elétricas do fio
  const renderElectricalInfo = (wire: Wire, wireData: any) => {
    if (!enableElectricalSimulation || !showElectricalProperties) return null;

    const electricalWire = electricalSimulator.getWires().find(w => w.id === wire.id);
    if (!electricalWire) return null;

    const { from, to } = wireData;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const voltage = electricalWire.currentSignal.properties.voltage.toFixed(2);
    const current = (electricalWire.currentSignal.properties.current * 1000).toFixed(1); // mA
    const power = (electricalWire.currentSignal.properties.voltage * electricalWire.currentSignal.properties.current * 1000).toFixed(1); // mW

    return (
      <g key={`electrical-info-${wire.id}`}>
        <rect
          x={midX - 25}
          y={midY - 15}
          width="50"
          height="30"
          fill="rgba(0,0,0,0.8)"
          stroke="#ffffff"
          strokeWidth="1"
          rx="3"
        />
        <text
          x={midX}
          y={midY - 5}
          textAnchor="middle"
          fontSize="8"
          fill="#ffffff"
          fontFamily="monospace"
        >
          {voltage}V
        </text>
        <text
          x={midX}
          y={midY + 5}
          textAnchor="middle"
          fontSize="8"
          fill="#ffffff"
          fontFamily="monospace"
        >
          {current}mA
        </text>
        <text
          x={midX}
          y={midY + 13}
          textAnchor="middle"
          fontSize="7"
          fill="#ffff00"
          fontFamily="monospace"
        >
          {power}mW
        </text>
      </g>
    );
  };

  // Renderizar fluxo de sinal elétrico
  const renderSignalFlow = (wire: Wire, wireData: any) => {
    if (!enableElectricalSimulation || !showSignalFlow) return null;

    const flowData = signalFlowData.get(wire.id);
    if (!flowData) return null;

    const { from, to } = wireData;
    const { path } = calculateCablePath(from, to);

    const particles = [];
    for (let i = 0; i < flowData.particleCount; i++) {
      const delay = (i / flowData.particleCount) * 2; // Espalhar partículas
      particles.push(
        <circle
          key={`particle-${wire.id}-${i}`}
          r="2"
          fill={flowData.color}
          opacity={flowData.intensity}
        >
          <animateMotion
            dur={`${2 / flowData.animationSpeed}s`}
            repeatCount="indefinite"
            begin={`${delay}s`}
          >
            <mpath href={`#signal-path-${wire.id}`} />
          </animateMotion>
        </circle>
      );
    }

    return (
      <g key={`signal-flow-${wire.id}`}>
        <defs>
          <path id={`signal-path-${wire.id}`} d={path} />
        </defs>
        {particles}
      </g>
    );
  };

  // Render wire path with elastic, flexible appearance like vintage synthesizer cables
  const renderWire = (wire: Wire | { start: PinConnection; end: { x: number; y: number }; color?: string }) => {
    const wireData = getWireData(wire);
    if (!wireData) return null;

    const { from, to, color } = wireData;
    const { path, distance } = calculateCablePath(from, to);
    const gradientId = `cable-gradient-${isCurrentWire(wire) ? 'current' : wire.id}`;
    const cableClasses = getCableClasses(wire, distance);

    // Obter dados de fluxo de sinal se disponível
    const flowData = !isCurrentWire(wire) ? signalFlowData.get(wire.id) : null;
    const enhancedColor = flowData ? flowData.color : color;
    const enhancedOpacity = flowData ? flowData.intensity : 1;

    return (
      <g key={isCurrentWire(wire) ? 'current' : wire.id} className={cableClasses}>
        {/* Define gradient for 3D cable effect */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={enhancedColor} stopOpacity={enhancedOpacity} />
            <stop offset="50%" stopColor={enhancedColor} stopOpacity={enhancedOpacity * 0.8} />
            <stop offset="100%" stopColor={enhancedColor} stopOpacity={enhancedOpacity * 0.6} />
          </linearGradient>
        </defs>

        {/* Cable shadow for depth */}
        <path
          d={path}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="4"
          fill="none"
          strokeDasharray={isCurrentWire(wire) ? "5,5" : "none"}
          opacity={isCurrentWire(wire) ? 0.4 : 0.7}
          strokeLinecap="round"
          transform="translate(2,2)"
          style={{ transition: 'all 0.2s ease-out' }}
        />

        {/* Main cable with gradient */}
        <path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          fill="none"
          strokeDasharray={isCurrentWire(wire) ? "5,5" : "none"}
          opacity={isCurrentWire(wire) ? 0.7 : enhancedOpacity}
          strokeLinecap="round"
          style={{ transition: 'all 0.2s ease-out' }}
        />

        {/* Cable highlight for 3D effect */}
        <path
          d={path}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray={isCurrentWire(wire) ? "5,5" : "none"}
          opacity={isCurrentWire(wire) ? 0.5 : 0.8}
          strokeLinecap="round"
          style={{ transition: 'all 0.2s ease-out' }}
        />

        {/* Inner core highlight for vintage cable look */}
         <path
           d={path}
           stroke="rgba(255,255,255,0.3)"
           strokeWidth="0.5"
           fill="none"
           strokeDasharray={isCurrentWire(wire) ? "3,3" : "none"}
           opacity={isCurrentWire(wire) ? 0.3 : 0.5}
           strokeLinecap="round"
           style={{ transition: 'all 0.2s ease-out' }}
         />

         {/* Signal flow animation for active cables */}
         {!isCurrentWire(wire) && distance > 50 && !showSignalFlow && (
           <path
             d={path}
             stroke="rgba(255,255,255,0.8)"
             strokeWidth="1"
             fill="none"
             strokeDasharray="4 8"
             opacity="0.6"
             strokeLinecap="round"
             className="cable-signal-flow"
             style={{
               animationDuration: `${Math.max(1, distance / 100)}s`,
               animationDelay: `${Math.random() * 2}s`
             }}
           />
         )}

         {/* Renderizar fluxo de sinal elétrico */}
         {!isCurrentWire(wire) && renderSignalFlow(wire, wireData)}

         {/* Renderizar informações elétricas */}
         {!isCurrentWire(wire) && renderElectricalInfo(wire, wireData)}


      </g>
    );
  };

  // Helper function to get electrical state of a pin
  const getPinElectricalState = useCallback((component: Component, pinName: string) => {
    if (!enableElectricalSimulation) return null;

    const electricalComponent = electricalSimulator.getComponents().find(c => c.id === component.id);
    if (!electricalComponent) return null;

    const electricalPin = electricalComponent.pins.find(p => p.name === pinName);
    return electricalPin?.currentState || null;
  }, [enableElectricalSimulation, electricalSimulator]);

  // Helper function to determine pin color
  const getPinColor = useCallback((pin: any, electricalState: any) => {
    let pinColor = '#000000'; // default
    if (pin.type === 'power') {
      pinColor = '#ff3333';
    } else if (pin.type === 'output') {
      pinColor = '#33ff33';
    }

    if (electricalState && enableElectricalSimulation) {
      const voltage = electricalState.properties.voltage;
      if (voltage > 4.5) {
        pinColor = '#ff4757'; // Vermelho brilhante para HIGH (5V)
      } else if (voltage > 0.5) {
        pinColor = '#ffa502'; // Laranja para tensões intermediárias
      } else {
        pinColor = '#2f3542'; // Cinza escuro para LOW (0V)
      }
    }

    return pinColor;
  }, [enableElectricalSimulation]);

  // Helper function to determine stroke color
  const getStrokeColor = useCallback((isStartPin: boolean, hasWire: boolean) => {
    if (isStartPin) return '#ffff00';
    if (hasWire) return '#ffffff';
    return '#cccccc';
  }, []);

  // Helper function to render component pins
  const renderComponentPins = useCallback((component: Component) => {
    const pins = getComponentPins(component);
    return pins.map(pin => {
      const isStartPin = startPin?.componentId === component.id && startPin?.pin === pin.name;
      const hasWire = wires.some(wire =>
        (wire.from.componentId === component.id && wire.from.pin === pin.name) ||
        (wire.to.componentId === component.id && wire.to.pin === pin.name)
      );

      // Show pins in wiring mode or if they have wires connected
      if (!isWiringMode && !hasWire) return null;

      const electricalState = getPinElectricalState(component, pin.name);
      const pinColor = getPinColor(pin, electricalState);
      const strokeColor = getStrokeColor(isStartPin, hasWire);

      return (
        <g key={`${component.id}-${pin.name}`}>
          {/* Efeito de brilho para pinos ativos */}
          {electricalState && electricalState.properties.voltage > 0.5 && (
            <circle
              cx={pin.x}
              cy={pin.y}
              r="6"
              fill={pinColor}
              opacity="0.3"
              style={{ animation: 'cable-glow 1s ease-in-out infinite' }}
            />
          )}

          <circle
            cx={pin.x}
            cy={pin.y}
            r={isStartPin ? "6" : "4"}
            fill={pinColor}
            stroke={strokeColor}
            strokeWidth={isStartPin ? "3" : "2"}
            className="cursor-pointer pointer-events-auto"
            onClick={() => handlePinClick(component.id, pin.name, pin.x, pin.y)}
            style={{
              animation: isStartPin ? 'cable-glow 1s ease-in-out infinite' : 'none'
            }}
          />

          {/* Renderizar informações elétricas do pino */}
          {enableElectricalSimulation && showElectricalProperties && electricalState && (
            <g>
              <rect
                x={pin.x + 8}
                y={pin.y - 10}
                width="35"
                height="20"
                fill="rgba(0,0,0,0.8)"
                rx="2"
              />
              <text
                x={pin.x + 10}
                y={pin.y + 2}
                fill="white"
                fontSize="8"
                fontFamily="monospace"
              >
                {electricalState.properties.voltage.toFixed(1)}V
              </text>
            </g>
          )}
        </g>
      );
    });
  }, [isWiringMode, startPin, wires, getPinElectricalState, getPinColor, getStrokeColor, handlePinClick, enableElectricalSimulation, showElectricalProperties, getComponentPins]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: isWiringMode ? 5 : 1, width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onContextMenu={handleRightClick}
    >
      {/* Render existing wires */}
      {wires.map(wire => renderWire(wire))}

      {/* Render current wire being drawn */}
      {currentWire && renderWire({ ...currentWire, color: '#888888' })}

      {/* Render component pins */}
      {components.map(component => renderComponentPins(component))}

      {/* Pin labels when in wiring mode - simplified without background */}
      {isWiringMode && components.map(component => {
        const pins = getComponentPins(component);
        return pins.map(pin => {
          const isStartPin = startPin?.componentId === component.id && startPin?.pin === pin.name;

          // Adjust label position for different pin types
          let labelX = pin.x;
          let labelY = pin.y - 9;
          const textAnchor = "middle";

          if (component.tag === 'led' || component.tag === 'sim-led') {
            if (pin.name === 'A' || pin.name === 'C') {
              // Both A and C pins below their respective pads
              labelX = pin.x;
              labelY = pin.y + 12;
            }
          }
          
          // Arduino analog pins labels should be below the pads
          if ((component.tag === 'arduino-uno' || component.tag === 'sim-arduino-uno') && pin.name.startsWith('A')) {
            labelY = pin.y + 12; // Position labels below analog pads
          }

          // Arduino power pins (VCC, GND) labels should also be below the pads
          if ((component.tag === 'arduino-uno' || component.tag === 'sim-arduino-uno') && (pin.name === 'VCC' || pin.name === 'GND')) {
            labelY = pin.y + 12; // Position labels below power pads
          }

          return (
            <text
              key={`${component.id}-${pin.name}-label`}
              x={labelX}
              y={labelY}
              textAnchor={textAnchor}
              fontSize="9"
              fontWeight={isStartPin ? "bold" : "normal"}
              fill={isStartPin ? "#ffff00" : "#ffffff"}
              className="pointer-events-none select-none"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontFamily: 'monospace'
              }}
            >
              {pin.name}
            </text>
          );
        });
      })}



    </svg>
  );
};

export default WiringSystem;
