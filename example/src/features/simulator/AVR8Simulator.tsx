import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadHex } from '@shared/utils/hexLoader';
import { CPU, avrInstruction, AVRTimer, timer0Config } from 'avr8js';

interface AVR8SimulatorProps {
  hexCode: string;
  components: Component[];
  diagramJson?: string;
  onSimulationUpdate: (state: SimulationState) => void;
}

interface SimulationState {
  pins: Record<string, boolean>;
  serialOutput: string;
}



interface Connection {
  from: string;
  to: string;
}

interface Component {
  id: string;
  type: string;
  attrs?: Record<string, unknown>;
  position?: { x: number; y: number };
}

interface DiagramData {
  version: string;
  author: string;
  editor: string;
  parts: Record<string, {
    type: string;
    id: string;
    top: number;
    left: number;
    attrs?: Record<string, unknown>;
    rotate?: number;
  }>;
  connections: Connection[];
  dependencies: Record<string, string>;
}

export const AVR8Simulator: React.FC<AVR8SimulatorProps> = ({
  hexCode,
  components,
  diagramJson,
  onSimulationUpdate
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x speed multiplier
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [pins, setPins] = useState<Record<string, boolean>>({}); // Pin states
  const [serialOutput, setSerialOutput] = useState<string>('');
  
  const avrRef = useRef<{ cpu: CPU; timer: AVRTimer } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);
  
  // Map Arduino pin names to AVR ports/pins
  const mapArduinoPinToAVR = (pin: string): { port: string, pin: number } | null => {
    // Arduino Uno pin mapping to ATmega328P
    const pinMap: Record<string, { port: string, pin: number }> = {
      // Digital pins
      'D0': { port: 'D', pin: 0 }, // RX
      'D1': { port: 'D', pin: 1 }, // TX
      'D2': { port: 'D', pin: 2 },
      'D3': { port: 'D', pin: 3 },
      'D4': { port: 'D', pin: 4 },
      'D5': { port: 'D', pin: 5 },
      'D6': { port: 'D', pin: 6 },
      'D7': { port: 'D', pin: 7 },
      'D8': { port: 'B', pin: 0 },
      'D9': { port: 'B', pin: 1 },
      'D10': { port: 'B', pin: 2 },
      'D11': { port: 'B', pin: 3 },
      'D12': { port: 'B', pin: 4 },
      'D13': { port: 'B', pin: 5 },
      // Analog pins
      'A0': { port: 'C', pin: 0 },
      'A1': { port: 'C', pin: 1 },
      'A2': { port: 'C', pin: 2 },
      'A3': { port: 'C', pin: 3 },
      'A4': { port: 'C', pin: 4 }, // SDA (I2C Data)
      'A5': { port: 'C', pin: 5 }, // SCL (I2C Clock)
      // I2C aliases
      'SDA': { port: 'C', pin: 4 }, // A4
      'SCL': { port: 'C', pin: 5 }, // A5
      // Power pins
      'VCC': { port: 'POWER', pin: 1 },
      '5V': { port: 'POWER', pin: 1 },
      'GND': { port: 'POWER', pin: 0 },
    };
    
    return pinMap[pin] || null;
  };

  // Helper function to check if component is Arduino
  const isArduinoComponent = useCallback((component: Component): boolean => {
    return component.type === 'arduino-uno' || component.type === 'sim-arduino-uno';
  }, []);

  // Helper function to handle Arduino to component connections
  const handleArduinoConnection = useCallback((
    fromPin: string,
    _toComponent: Component,
    _componentName: string
  ): void => {
    const pinMapping = mapArduinoPinToAVR(fromPin);
    if (pinMapping) {
      // Configure I2C if SDA or SCL
      if (fromPin === 'SDA' || fromPin === 'SCL') {
        // I2C communication setup
      }
    }
  }, []);

  // Helper function to handle power connections
  const handlePowerConnections = useCallback((fromPin: string, toPin: string): void => {
    if ((fromPin === 'VCC' || fromPin === '5V') && (toPin === 'VCC' || toPin === 'VDD')) {
      // Power connection established
    }
    if (fromPin === 'GND' && (toPin === 'GND' || toPin === 'VSS')) {
      // Ground connection established
    }
  }, []);

  // Connect two components
  const connectComponents = useCallback((
    fromComponent: Component,
    fromPin: string,
    toComponent: Component,
    toPin: string,
    _cpu: CPU | null
  ) => {
    // Arduino to LED connection
    if (isArduinoComponent(fromComponent) && (toComponent.type === 'led' || toComponent.type === 'sim-led')) {
      handleArduinoConnection(fromPin, toComponent, 'LED');
    }
    
    // Arduino to LCD I2C connection
    if (isArduinoComponent(fromComponent) && (toComponent.type === 'lcd1602' || toComponent.type === 'sim-lcd1602')) {
      handleArduinoConnection(fromPin, toComponent, 'LCD');
    }
    
    // Arduino to SSD1306 OLED connection
    if (isArduinoComponent(fromComponent) && (toComponent.type === 'ssd1306' || toComponent.type === 'sim-ssd1306')) {
      handleArduinoConnection(fromPin, toComponent, 'SSD1306');
    }
    
    // Power connections
    handlePowerConnections(fromPin, toPin);
  }, [handleArduinoConnection, handlePowerConnections, isArduinoComponent]);

  // Connect components based on diagram.json
  const connectComponentsFromDiagram = useCallback((diagram: DiagramData, _cpu: CPU) => {
    // Map component IDs to their elements
    const componentMap = new Map();
    components.forEach(comp => {
      if (comp.id) {
        componentMap.set(comp.id, comp);
      }
    });
    
    // Process connections
    if (diagram.connections) {
      diagram.connections.forEach(connection => {
        // Parse connection endpoints
        const [fromId, fromPin] = connection.from.split('.');
        const [toId, toPin] = connection.to.split('.');
        
        const fromComponent = componentMap.get(fromId);
        const toComponent = componentMap.get(toId);
        
        if (fromComponent && toComponent) {
          // Connect components based on their types
          connectComponents(fromComponent, fromPin, toComponent, toPin, null);
        }
      });
    }
  }, [components, connectComponents]);

  // Load diagram.json and setup connections
  const loadDiagram = useCallback((diagramData: DiagramData) => {
    try {
      // Parse diagram.json structure
      const { parts, connections } = diagramData;
      
      // Map components from diagram
      Object.values(parts).map((part) => ({
        id: part.id,
        type: part.type,
        attrs: part.attrs,
        position: { x: part.left || 0, y: part.top || 0 }
      }));
      

      
      // Store connections for later use
      setDiagram({ ...diagramData, connections });
    } catch (error) {
      console.error('Error loading diagram:', error);
    }
  }, []);

  // Run simulation loop
  const runSimulation = useCallback((timestamp: number) => {
    if (!avrRef.current || !isRunning) return;
    
    const { cpu } = avrRef.current;
    
    // Calculate time delta and run appropriate number of cycles
    const elapsed = timestamp - (lastStepTimeRef.current || timestamp);
    lastStepTimeRef.current = timestamp;
    
    // Run simulation steps based on elapsed time and speed
    const cyclesPerMs = 16000; // 16 MHz / 1000 = 16000 cycles per ms
    const cyclesToRun = elapsed * cyclesPerMs * speed;
    
    try {
      // Simplified simulation loop
      for (let i = 0; i < cyclesToRun; i++) {
        avrInstruction(cpu);
        cpu.tick();
      }
      
      // Update pin states for UI (simplified)
      const newPinStates: Record<string, boolean> = {};
      
      // Simulate some pin changes for demo
      ['B', 'C', 'D'].forEach((portName) => {
        for (let i = 0; i < 8; i++) {
          // Simplified pin state simulation
          newPinStates[`${portName}${i}`] = Math.random() > 0.5;
        }
      });
      
      setPins(newPinStates);
      
      // Call update callback if provided
      if (onSimulationUpdate) {
        onSimulationUpdate({
          pins: newPinStates,
          serialOutput,
          // Add more state as needed
        });
      }
    } catch (e) {
      console.error('Simulation error:', e);
      setIsRunning(false);
      return;
    }
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(runSimulation);
  }, [isRunning, speed, serialOutput, onSimulationUpdate]);
  
  // Parse diagram.json if provided
  useEffect(() => {
    if (diagramJson) {
      try {
        const parsed = JSON.parse(diagramJson);
        setDiagram(parsed);
        loadDiagram(parsed);
  
      } catch (e) {
        console.error('Failed to parse diagram.json:', e);
      }
    }
  }, [diagramJson, loadDiagram]);

  // Initialize AVR8 simulator
  useEffect(() => {
    if (!hexCode) return;
    
    (async () => {
      try {
        const programBytes = loadHex(hexCode);
        
        // Convert Uint8Array to Uint16Array (little-endian)
        const program = new Uint16Array(Math.ceil(programBytes.length / 2));
        for (let i = 0; i < programBytes.length; i += 2) {
          const lowByte = programBytes[i] || 0;
          const highByte = programBytes[i + 1] || 0;
          program[i / 2] = (highByte << 8) | lowByte;
        }
        
        const cpu = new CPU(program);
        const timer = new AVRTimer(cpu, timer0Config);
        
        // Set up write hooks for ports
        cpu.writeHooks[0x25] = (value: number) => {
          setPins(prev => ({ ...prev, B: (value & 1) === 1 }));
        }; // PORTB
        
        cpu.writeHooks[0x28] = (value: number) => {
          setPins(prev => ({ ...prev, C: (value & 1) === 1 }));
        }; // PORTC
        
        cpu.writeHooks[0x2B] = (value: number) => {
          setPins(prev => ({ ...prev, D: (value & 1) === 1 }));
        }; // PORTD
        
        // Set DDR for all ports to output
        cpu.data[0x24] = 0xFF; // DDRB
        cpu.data[0x27] = 0xFF; // DDRC
        cpu.data[0x2A] = 0xFF; // DDRD
        
        avrRef.current = { cpu, timer };
        
        if (diagram) {
          connectComponentsFromDiagram(diagram, cpu);
        }
        
      } catch (e) {
        console.error('Failed to initialize AVR8 simulator:', e);
      }
    })();
    
    return () => {
      // Cleanup simulation
      avrRef.current = null;
    };
  }, [hexCode, diagram, connectComponentsFromDiagram]);

  // Run simulation
  useEffect(() => {
    if (isRunning && avrRef.current) {
      const animate = () => {
        if (!avrRef.current) return;
        
        // Execute CPU instructions
        for (let i = 0; i < 1000; i++) {
          avrInstruction(avrRef.current.cpu);
          avrRef.current.cpu.tick();
        }
        
        // Update states
        onSimulationUpdate({
          pins,
          serialOutput
        });
        
        if (isRunning) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isRunning, pins, serialOutput, onSimulationUpdate]);



  // Start/stop simulation
  useEffect(() => {
    if (isRunning) {
      lastStepTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(runSimulation);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, speed, runSimulation]);

  // Reset simulation
  const resetSimulation = () => {
    if (avrRef.current) {
      // Reset CPU state
      avrRef.current.cpu.reset();
      // Clear serial output
      setSerialOutput('');
      // Reset pin states
      setPins({});
    }
  };

  return (
    <div className="avr8-simulator">
      <div className="simulator-controls">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`control-button ${isRunning ? 'stop' : 'play'}`}
        >
          {isRunning ? 'Stop' : 'Play'}
        </button>
        
        <button 
          onClick={resetSimulation}
          className="control-button reset"
          disabled={isRunning}
        >
          Reset
        </button>
        
        <div className="speed-control">
          <label>Speed:</label>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={isRunning}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
      
      {serialOutput && (
        <div className="serial-monitor">
          <h3>Serial Output</h3>
          <pre>{serialOutput}</pre>
        </div>
      )}
    </div>
  );
};