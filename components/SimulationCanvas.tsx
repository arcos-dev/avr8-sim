import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import type {
  ComponentInstance,
  BoardType,
  Wire,
  WireOptions,
  PinIdentifier,
  WireRuntimeState,
  WireLogicalState,
  WireSignalType,
  WireDirection,
} from '../types';
import { BOARD_ELEMENTS } from '../constants';
import { AVRRunner } from '../services/simulation/runner';
import { CPUPerformance } from '../services/simulation/cpu-performance';
import { getPinMapping } from '../services/simulation/pins';
import { SimulationToolbar } from './SimulationToolbar';
import { SimulationStatusBar } from './SimulationStatusBar';
import { WokwiComponent } from './WokwiComponent';
import { useTheme } from '../contexts/ThemeContext';
import { getComponentMeta } from '../services/simulation/component-meta';
import { Wire as WireComponent } from './Wire';
import { Board } from './Board';
import { isBoardEndpoint } from '../services/simulation/wiring';

interface SimulationCanvasProps {
  components: ComponentInstance[];
  wires: Wire[];
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onAddComponent: (type: string, defaults: Record<string, any>) => void;
  onDeleteComponent: (id: string) => void;
  onAddWire: (wire: WireOptions) => void;
  onUpdateWire: (wireId: string, updates: Partial<WireOptions>) => void;
  onDeleteWire: (id: string) => void;
  onPinsLoaded: (componentId: string, pins: any[]) => void;
  board: BoardType;
  running: boolean;
  hex: string;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onSerialOutput: (char: string) => void;
  setRunner: (runner: AVRRunner | null) => void;
  simulateElectronFlow: boolean;
}

const BOARD_ID = 'board';
const BOARD_INITIAL_POS = { x: 200, y: 50 };
const ANALOG_PIN_OFFSET = 14;

const SHARED_PIN_ALIASES: Record<string, number> = {
  TX0: 1,
  RX0: 0,
};

const BOARD_PIN_ALIASES: Record<BoardType, Record<string, number>> = {
  uno: { SDA: 18, SCL: 19 },
  nano: { SDA: 18, SCL: 19 },
  mega: { SDA: 20, SCL: 21, TX1: 18, RX1: 19 },
};

interface BoardWireLink {
  wireId: string;
  boardLabel: string;
  boardIsSource: boolean;
  signal: WireSignalType;
}

type WiringState =
  | { mode: 'new'; from: PinIdentifier }
  | { mode: 'update'; wireId: string; movableEnd: 'from' | 'to'; fixedEnd: PinIdentifier };

const WIRE_MAGNITUDE_BASE: Record<WireSignalType, number> = {
  power: 1,
  ground: 0.9,
  analog: 0.75,
  pwm: 0.85,
  serial: 0.8,
  digital: 0.7,
};

function normaliseBoardLabel(label: string): string {
  const trimmed = label.trim().toUpperCase();
  const digitalMatch = trimmed.match(/^D(\d+)$/);
  if (digitalMatch) {
    return digitalMatch[1];
  }
  return trimmed;
}

function resolveBoardPinNumber(label: string, boardType: BoardType): number | null {
  const normalised = normaliseBoardLabel(label);
  if (/^\d+$/.test(normalised)) {
    return parseInt(normalised, 10);
  }
  if (/^A\d+$/.test(normalised)) {
    return ANALOG_PIN_OFFSET + parseInt(normalised.substring(1), 10);
  }
  const boardAliases = BOARD_PIN_ALIASES[boardType];
  if (boardAliases && normalised in boardAliases) {
    return boardAliases[normalised];
  }
  if (normalised in SHARED_PIN_ALIASES) {
    return SHARED_PIN_ALIASES[normalised];
  }
  return null;
}

function formatPinLabel(pinNumber: number): string {
  if (pinNumber >= ANALOG_PIN_OFFSET && pinNumber < ANALOG_PIN_OFFSET + 16) {
    return `A${pinNumber - ANALOG_PIN_OFFSET}`;
  }
  return pinNumber.toString();
}

function computeWireDirection(link: BoardWireLink, logical: WireLogicalState): WireDirection {
  if (logical === 'floating') {
    return 'none';
  }
  if (link.signal === 'analog') {
    return 'bidirectional';
  }
  if (link.signal === 'ground') {
    return link.boardIsSource ? 'reverse' : 'forward';
  }
  if (logical === 'high') {
    return link.boardIsSource ? 'forward' : 'reverse';
  }
  if (logical === 'low') {
    return link.boardIsSource ? 'reverse' : 'forward';
  }
  return 'none';
}

function computeWireMagnitude(link: BoardWireLink, logical: WireLogicalState): number {
  if (logical === 'floating') {
    return 0;
  }
  const base = WIRE_MAGNITUDE_BASE[link.signal] ?? 0.6;
  if (link.signal === 'analog') {
    return base;
  }
  if (link.signal === 'ground') {
    return logical === 'low' ? base : base * 0.5;
  }
  if (logical === 'low') {
    return base * 0.35;
  }
  return base;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
  components, 
  wires,
  onUpdateComponent, 
  onAddComponent, 
  onDeleteComponent,
  onAddWire,
  onUpdateWire,
  onDeleteWire,
  onPinsLoaded,
  board, 
  running, 
  hex,
  selectedComponentId,
  onSelectComponent,
  onSerialOutput,
  setRunner,
  simulateElectronFlow
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 50, y: 50, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingComponent, setDraggingComponent] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const runnerRef = useRef<AVRRunner | null>(null);
  const componentRefs = useRef<{[id: string]: HTMLElement & {wokwiComponentType?: string}}>({});
  const [simulationTime, setSimulationTime] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(0);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();

  const [wiringState, setWiringState] = useState<WiringState | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [wireStates, setWireStates] = useState<Record<string, WireRuntimeState>>({});
  const portListenerCleanupRef = useRef<(() => void)[]>([]);

  const updateTransform = useCallback(() => {
    if (canvasRef.current) {
      const { x, y, scale } = transformRef.current;
      canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }, []);

  useLayoutEffect(() => {
    updateTransform();
  }, [updateTransform]);
  
  const handleResetView = useCallback(() => {
    transformRef.current = { x: 50, y: 50, scale: 1 };
    updateTransform();
    setMouseCoords(prev => ({...prev}));
  }, [updateTransform]);

  const handleFitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const allElements = [
        ...components,
        { id: BOARD_ID, type: BOARD_ELEMENTS[board], ...BOARD_INITIAL_POS }
    ];

    if (allElements.length === 0) return handleResetView();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    allElements.forEach(item => {
        const meta = getComponentMeta(item.type);
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + meta.width);
        maxY = Math.max(maxY, item.y + meta.height);
    });

    if (!isFinite(minX)) return handleResetView();
    
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    
    if (bboxWidth <= 0 || bboxHeight <= 0) return handleResetView();
    
    const PADDING = 60;
    const scaleX = (container.clientWidth - PADDING * 2) / bboxWidth;
    const scaleY = (container.clientHeight - PADDING * 2) / bboxHeight;
    const newScale = Math.min(scaleX, scaleY, 2);
    
    const newX = -minX * newScale + (container.clientWidth - bboxWidth * newScale) / 2;
    const newY = -minY * newScale + (container.clientHeight - bboxHeight * newScale) / 2;
    
    transformRef.current = { x: newX, y: newY, scale: Math.max(0.1, newScale) };
    updateTransform();
    setMouseCoords(prev => ({...prev}));
  }, [components, board, handleResetView, updateTransform]);

  const allComponentData = useMemo(
    () => [
      ...components,
      { id: BOARD_ID, type: BOARD_ELEMENTS[board], ...BOARD_INITIAL_POS },
    ],
    [components, board]
  );

  const componentDataMap = useMemo(
    () => new Map(allComponentData.map((c) => [c.id, c])),
    [allComponentData]
  );

  const componentMetaMap = useMemo(
    () => new Map(allComponentData.map((c) => [c.id, getComponentMeta(c.type)])),
    [allComponentData]
  );

  const boardWireLinks = useMemo<BoardWireLink[]>(() => {
    return wires
      .filter((wire) => isBoardEndpoint(wire.from) || isBoardEndpoint(wire.to))
      .map((wire) => {
        const boardIsSource = isBoardEndpoint(wire.from);
        const boardEndpoint = boardIsSource ? wire.from : wire.to;
        return {
          wireId: wire.id,
          boardLabel: normaliseBoardLabel(boardEndpoint.pinName),
          boardIsSource,
          signal: wire.signal,
        };
      });
  }, [wires]);

  const boardPinToLinks = useMemo(() => {
    const map = new Map<string, BoardWireLink[]>();
    boardWireLinks.forEach((link) => {
      const entry = map.get(link.boardLabel);
      if (entry) {
        entry.push(link);
      } else {
        map.set(link.boardLabel, [link]);
      }
    });
    return map;
  }, [boardWireLinks]);

  const handleZoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const { x, y, scale } = transformRef.current;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    
    const newX = centerX - (centerX - x) * (newScale / scale);
    const newY = centerY - (centerY - y) * (newScale / scale);

    transformRef.current = { x: newX, y: newY, scale: newScale };
    updateTransform();
    setMouseCoords(prev => ({...prev}));
  }, [updateTransform]);

  useEffect(() => {
    setWireStates(prev => {
      const next: Record<string, WireRuntimeState> = {};
      wires.forEach(wire => {
        next[wire.id] = prev[wire.id] ?? { id: wire.id, logical: 'floating', direction: 'none', magnitude: 0 };
      });
      return next;
    });
  }, [wires]);

  const applyBoardSignal = useCallback((boardLabel: string, logical: WireLogicalState) => {
    const key = normaliseBoardLabel(boardLabel);
    const links = boardPinToLinks.get(key);
    if (!links || links.length === 0) {
      return;
    }

    setWireStates(prev => {
      let changed = false;
      const next: Record<string, WireRuntimeState> = { ...prev };

      links.forEach(link => {
        const direction = computeWireDirection(link, logical);
        const magnitude = computeWireMagnitude(link, logical);
        const newState: WireRuntimeState = {
          id: link.wireId,
          logical,
          direction,
          magnitude,
        };
        const previous = prev[link.wireId];
        if (
          !previous ||
          previous.logical !== newState.logical ||
          previous.direction !== newState.direction ||
          Math.abs(previous.magnitude - newState.magnitude) > 0.02
        ) {
          next[link.wireId] = newState;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [boardPinToLinks]);

  const startSimulation = useCallback(() => {
    if (!hex) return;
    
    portListenerCleanupRef.current.forEach(cleanup => cleanup());
    portListenerCleanupRef.current = [];

    const runner = new AVRRunner(hex);
    runnerRef.current = runner;
    setRunner(runner);
    const cpuPerf = new CPUPerformance(runner.cpu, runner.frequency);
    
    const boardElement = componentRefs.current[BOARD_ID] as HTMLElement & {led13?: boolean};
    const pinMapping = getPinMapping(board);
    if (!pinMapping) return;

    (runner as any).pinMapping = pinMapping;
    runner.usart.onByteTransmit = (value: number) => onSerialOutput(String.fromCharCode(value));

    if (boardElement && pinMapping[13]) {
        const { port, pin } = pinMapping[13];
        const ledListener = (state: number) => {
           boardElement.led13 = (state & (1 << pin)) !== 0;
        };
        runner[port].addListener(ledListener);
        portListenerCleanupRef.current.push(() => {
          if (typeof runner[port].removeListener === 'function') {
            runner[port].removeListener(ledListener);
          }
        });
    }

    setWireStates(() => {
      const next: Record<string, WireRuntimeState> = {};
      wires.forEach(wire => {
        next[wire.id] = { id: wire.id, logical: 'floating', direction: 'none', magnitude: 0 };
      });
      return next;
    });

    const connectionsByComponent: Record<string, Record<string, string>> = {};
    const boardPinLabels = new Map<number, Set<string>>();
    wires.forEach(wire => {
        const { from, to } = wire;
        const fromIsBoard = isBoardEndpoint(from);
        const toIsBoard = isBoardEndpoint(to);

        if (!(fromIsBoard || toIsBoard)) {
            return;
        }

        const boardSide = fromIsBoard ? from : to;
        const componentSide = fromIsBoard ? to : from;

        const componentId = componentSide.componentId;
        const componentPin = componentSide.pinName;
        const arduinoPin = boardSide.pinName;

        if (!componentId) {
            return;
        }

        if (!connectionsByComponent[componentId]) {
            connectionsByComponent[componentId] = {};
        }
        
        const arduinoPinNumber = resolveBoardPinNumber(arduinoPin, board);

        if (typeof arduinoPinNumber === 'number' && !Number.isNaN(arduinoPinNumber)) {
          connectionsByComponent[componentId][componentPin] = String(arduinoPinNumber);
          const labelKey = normaliseBoardLabel(boardSide.pinName);
          if (!boardPinLabels.has(arduinoPinNumber)) {
            boardPinLabels.set(arduinoPinNumber, new Set());
          }
          boardPinLabels.get(arduinoPinNumber)!.add(labelKey);
        }
    });

    components.forEach(component => {
        const componentElement = componentRefs.current[component.id];
        const connections = connectionsByComponent[component.id];
        if (componentElement && connections) {
          runner.connectComponent(componentElement, connections, component.type);
        }
    });

    const portTargets: Record<string, Array<{ bit: number; label: string }>> = {};
    Object.entries(pinMapping).forEach(([pinNumberStr, mapping]) => {
        const pinNumber = parseInt(pinNumberStr, 10);
        if (Number.isNaN(pinNumber)) {
          return;
        }
        const labels = boardPinLabels.get(pinNumber);
        if (!labels || labels.size === 0) {
          return;
        }
        if (!portTargets[mapping.port]) {
          portTargets[mapping.port] = [];
        }
        labels.forEach((label) => {
          if (boardPinToLinks.has(label)) {
            portTargets[mapping.port].push({ bit: mapping.pin, label });
          }
        });
    });

    (['portB', 'portC', 'portD'] as const).forEach(portKey => {
      const targets = portTargets[portKey];
      if (!targets || typeof runner[portKey].addListener !== 'function') {
        return;
      }
      const listener = (value: number) => {
        targets.forEach(({ bit, label }) => {
          const logical: WireLogicalState = (value & (1 << bit)) !== 0 ? 'high' : 'low';
          applyBoardSignal(label, logical);
        });
      };
      runner[portKey].addListener(listener);
      portListenerCleanupRef.current.push(() => {
        if (typeof runner[portKey].removeListener === 'function') {
          runner[portKey].removeListener(listener);
        }
      });
    });

    const frame = () => {
      if (!runnerRef.current) return;
      runner.execute((cpu) => {
        setSimulationTime(cpu.cycles / runner.frequency);
        const speed = cpuPerf.update();
        setSimulationSpeed(speed);
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

  }, [hex, board, components, onSerialOutput, setRunner, wires, boardPinToLinks, applyBoardSignal]);

  const stopSimulation = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      runnerRef.current = null;
    }
    portListenerCleanupRef.current.forEach(cleanup => cleanup());
    portListenerCleanupRef.current = [];
    setRunner(null);
    setSimulationTime(0);
    setSimulationSpeed(0);
    setWireStates(() => {
      const next: Record<string, WireRuntimeState> = {};
      wires.forEach(wire => {
        next[wire.id] = { id: wire.id, logical: 'floating', direction: 'none', magnitude: 0 };
      });
      return next;
    });
  }, [setRunner, wires]);

  useEffect(() => {
    if (running) {
      startSimulation();
    } else {
      stopSimulation();
    }
    return () => stopSimulation();
  }, [running, hex, startSimulation, stopSimulation]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedComponentId) onDeleteComponent(selectedComponentId);
            if (selectedWireId) onDeleteWire(selectedWireId);
        }
        if (e.key === 'Escape') {
            setWiringState(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedWireId, onDeleteComponent, onDeleteWire]);

  const handleSelectWire = (id: string) => {
      setSelectedWireId(id);
      onSelectComponent(null);
  };

  const handleSelectComponent = (id: string | null) => {
      onSelectComponent(id);
      setSelectedWireId(null);
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
    handleZoom(delta, e.clientX, e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const isCanvas = e.target === e.currentTarget;
    if (isCanvas) {
      setIsPanning(true);
      handleSelectComponent(null);
    }
    if (isCanvas && wiringState) {
        setWiringState(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const parent = containerRef.current!;
    const { x, y, scale } = transformRef.current;
    const rect = parent.getBoundingClientRect();
    const coords = {
        x: (e.clientX - rect.left - x) / scale,
        y: (e.clientY - rect.top - y) / scale,
    }
    setMouseCoords(coords);

    if (isPanning) {
      transformRef.current.x += e.movementX;
      transformRef.current.y += e.movementY;
      updateTransform();
    }
    if (draggingComponent) {
      const { id, offsetX, offsetY } = draggingComponent;
      onUpdateComponent(id, { x: coords.x - offsetX, y: coords.y - offsetY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingComponent(null);
    setWiringState(prev => (prev && prev.mode === 'update' ? null : prev));
  };
  
  const handleComponentMouseDown = (e: React.MouseEvent, component: ComponentInstance) => {
      e.stopPropagation();
      handleSelectComponent(component.id);

      const parent = containerRef.current!;
      const { x: transformX, y: transformY, scale } = transformRef.current;
      const rect = parent.getBoundingClientRect();
      const worldMouseX = (e.clientX - rect.left - transformX) / scale;
      const worldMouseY = (e.clientY - rect.top - transformY) / scale;
      const offsetX = worldMouseX - component.x;
      const offsetY = worldMouseY - component.y;

      setDraggingComponent({ id: component.id, offsetX, offsetY });
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const { type, defaults } = JSON.parse(data);
    const parent = containerRef.current!;
    const { x, y, scale } = transformRef.current;
    const { width: componentWidth, height: componentHeight } = getComponentMeta(type);
    const rect = parent.getBoundingClientRect();
    const dropX = (e.clientX - rect.left - x) / scale - (componentWidth / 2);
    const dropY = (e.clientY - rect.top - y) / scale - (componentHeight / 2);
    
    onAddComponent(type, { ...defaults, x: dropX, y: dropY });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const registerComponentRef = useCallback((id: string, el: HTMLElement | null) => {
      if (el) {
          componentRefs.current[id] = el as HTMLElement & {wokwiComponentType?: string};
      } else {
          delete componentRefs.current[id];
      }
  }, []);

  useEffect(() => {
    setWireStates(prev => {
      const next: Record<string, WireRuntimeState> = {};
      wires.forEach(wire => {
        next[wire.id] = prev[wire.id] ?? { id: wire.id, logical: 'floating', direction: 'none', magnitude: 0 };
      });
      return next;
    });
  }, [wires]);

  const getPinPosition = useCallback((pinId: PinIdentifier) => {
      const component = componentDataMap.get(pinId.componentId);
      const meta = componentMetaMap.get(pinId.componentId);
      if (!component || !meta) return null;
      
      const pinInfo = meta.pins.find(p => p.name === pinId.pinName);
      if (!pinInfo) return null;

      return { x: component.x + pinInfo.x, y: component.y + pinInfo.y };
  }, [componentDataMap, componentMetaMap]);

  const finalizeConnection = useCallback((target: PinIdentifier) => {
    if (!wiringState) {
      return;
    }

    if (wiringState.mode === 'new') {
      if (wiringState.from.componentId === target.componentId && wiringState.from.pinName === target.pinName) {
        return;
      }
      const fromPos = getPinPosition(wiringState.from);
      const toPos = getPinPosition(target);
      const length = fromPos && toPos ? Math.hypot(toPos.x - fromPos.x, toPos.y - fromPos.y) : undefined;
      onAddWire({
        from: wiringState.from,
        to: target,
        metadata: typeof length === 'number' ? { length } : undefined,
      });
      setWiringState(null);
      return;
    }

    if (wiringState.mode === 'update') {
      const fixedEnd = wiringState.fixedEnd;
      if (fixedEnd.componentId === target.componentId && fixedEnd.pinName === target.pinName) {
        setWiringState(null);
        return;
      }
      const newFrom = wiringState.movableEnd === 'from' ? target : fixedEnd;
      const newTo = wiringState.movableEnd === 'to' ? target : fixedEnd;
      const fromPos = getPinPosition(newFrom);
      const toPos = getPinPosition(newTo);
      const length = fromPos && toPos ? Math.hypot(toPos.x - fromPos.x, toPos.y - fromPos.y) : undefined;
      onUpdateWire(wiringState.wireId, {
        from: newFrom,
        to: newTo,
        metadata: typeof length === 'number' ? { length } : undefined,
      });
      setWiringState(null);
    }
  }, [wiringState, getPinPosition, onAddWire, onUpdateWire]);

  const handlePinMouseDown = useCallback((componentId: string, pinName: string) => {
    const target = { componentId, pinName };
    if (wiringState) {
      finalizeConnection(target);
      return;
    }
    const startPos = getPinPosition(target);
    if (startPos) {
      setMouseCoords(startPos);
    }
    setWiringState({ mode: 'new', from: target });
  }, [wiringState, finalizeConnection, getPinPosition]);

  const handlePinMouseUp = useCallback((componentId: string, pinName: string) => {
    if (wiringState?.mode === 'update') {
      finalizeConnection({ componentId, pinName });
    }
  }, [wiringState, finalizeConnection]);

  const handleWireHandleMouseDown = useCallback((wireId: string, endpoint: 'from' | 'to') => {
    const wire = wires.find(w => w.id === wireId);
    if (!wire) {
      return;
    }
    const fixedEnd = endpoint === 'from' ? wire.to : wire.from;
    const anchor = endpoint === 'from' ? wire.from : wire.to;
    const anchorPos = getPinPosition(anchor);
    if (anchorPos) {
      setMouseCoords(anchorPos);
    }
    setWiringState({
      mode: 'update',
      wireId,
      movableEnd: endpoint,
      fixedEnd,
    });
    setSelectedWireId(wireId);
  }, [wires, getPinPosition]);

  const gridDotColor = theme === 'dark' ? '#3E3E42' : '#8884';
  
  return (
    <div 
        ref={containerRef}
        className={`flex-1 bg-gray-200 dark:bg-gray-900 overflow-hidden relative h-full w-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
            backgroundImage: `radial-gradient(circle, ${gridDotColor} 1px, transparent 1px)`,
            backgroundSize: `${20 * transformRef.current.scale}px ${20 * transformRef.current.scale}px`,
            backgroundPosition: `${transformRef.current.x}px ${transformRef.current.y}px`
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
      <SimulationToolbar 
        onZoomIn={() => handleZoom(1.2, containerRef.current!.clientWidth / 2, containerRef.current!.clientHeight / 2)}
        onZoomOut={() => handleZoom(1 / 1.2, containerRef.current!.clientWidth / 2, containerRef.current!.clientHeight / 2)}
        onFit={handleFitToView}
        onReset={handleResetView}
      />
      <div ref={canvasRef} className="absolute" style={{ transformOrigin: 'top left' }}>
        <svg className="absolute w-full h-full" style={{ width: 10000, height: 10000, top: -5000, left: -5000 }} pointerEvents="none">
            {wires.map(wire => {
                const fromPos = getPinPosition(wire.from);
                const toPos = getPinPosition(wire.to);
                if (!fromPos || !toPos) return null;
                return (
                    <WireComponent
                        key={wire.id}
                        id={wire.id}
                        from={fromPos}
                        to={toPos}
                        isSelected={wire.id === selectedWireId}
                        color={wire.color}
                        signal={wire.signal}
                        runtimeState={wireStates[wire.id]}
                        simulateElectronFlow={simulateElectronFlow}
                        onClick={handleSelectWire}
                        onHandleMouseDown={handleWireHandleMouseDown}
                    />
                );
            })}
            {wiringState && (
                 (() => {
                    const previewStart = wiringState.mode === 'new' ? wiringState.from : wiringState.fixedEnd;
                    const startPos = getPinPosition(previewStart);
                    if (!startPos) return null;
                    const toPos = mouseCoords;

                    const dx = toPos.x - startPos.x;
                    const dy = toPos.y - startPos.y;
                    
                    const midX = startPos.x + dx / 2;
                    const midY = startPos.y + dy / 2;
                    
                    const sag = Math.sqrt(dx * dx + dy * dy) * 0.2;
                    
                    const pathData = `M ${startPos.x} ${startPos.y} Q ${midX} ${midY + sag} ${toPos.x} ${toPos.y}`;

                    return <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5,5" pointerEvents="none" />;
                })()
            )}
        </svg>

        <div style={{ position: 'absolute', top: BOARD_INITIAL_POS.y, left: BOARD_INITIAL_POS.x }}>
            <Board 
                boardType={board}
                ref={(el: HTMLElement | null) => registerComponentRef(BOARD_ID, el)}
                onPinMouseDown={handlePinMouseDown}
                onPinMouseUp={handlePinMouseUp}
            />
        </div>
        {components.map(comp => (
          <WokwiComponent
            key={comp.id}
            component={comp}
            isSelected={comp.id === selectedComponentId}
            onMouseDown={handleComponentMouseDown}
            onPinsLoaded={onPinsLoaded}
            registerRef={registerComponentRef}
            onPinMouseDown={handlePinMouseDown}
            onPinMouseUp={handlePinMouseUp}
          />
        ))}
      </div>
      <SimulationStatusBar 
        simulationTime={simulationTime}
        simulationSpeed={simulationSpeed}
        zoom={transformRef.current.scale}
        coords={mouseCoords}
      />
    </div>
  );
};







