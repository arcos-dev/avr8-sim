import React, { useState, useCallback, useRef, useEffect } from 'react';
import WiringSystem from '@features/components/WiringSystem';
import { Wire, DroppedComponent, CPUState } from '../../shared/types';
import { ElectricalSimulationState } from '../../shared/types/electrical';

// Garantir que os elementos sejam registrados
import '@features/components/elements/LEDElement';
import '@features/components/elements/PushbuttonElement';
import '@features/components/elements/ResistorElement';
import '@features/components/elements/ArduinoElement';
import '@features/components/elements/LCDElement';
import '@features/components/elements/ServoElement';
import '@features/components/elements/PotentiometerElement';
import '@features/components/elements/BuzzerElement';

interface SimulatorCanvasProps {
  simulationState: {
    led1: boolean;
    running: boolean;
    ports: { B: number; C: number; D: number };
    cpu: CPUState | null;
  };
  // Propriedades para simulação elétrica
  enableElectricalSimulation?: boolean;
  showSignalFlow?: boolean;
  showElectricalProperties?: boolean;
  onElectricalStateChange?: (state: ElectricalSimulationState | null) => void;
}

const SimulatorCanvas: React.FC<SimulatorCanvasProps> = ({ 
  simulationState, 
  enableElectricalSimulation = true,
  showSignalFlow = true,
  showElectricalProperties = false,
  onElectricalStateChange
}) => {
  const ledIndicatorRef = useRef<HTMLDivElement>(null);
  const [ledFadingOut, setLedFadingOut] = useState(false);
  const [prevLedState, setPrevLedState] = useState(simulationState.led1);
  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);

  // Efeito para controlar a animação realista do LED
  useEffect(() => {
    if (simulationState.led1 !== prevLedState) {
      if (simulationState.led1) {
        // LED ligando: acendimento instantâneo
        setLedFadingOut(false);
      } else {
        // LED desligando: fade realista em 200ms (100% para apagado)
        setLedFadingOut(true);
        const timer = setTimeout(() => {
          setLedFadingOut(false);
        }, 200); // 200ms para fade-out realista
        return () => clearTimeout(timer);
      }
      setPrevLedState(simulationState.led1);
    }
  }, [simulationState.led1, prevLedState]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wires, setWires] = useState<Wire[]>([]);
  const [isWiringMode, setIsWiringMode] = useState(false);
  const [configComponent, setConfigComponent] = useState<string | null>(null);
  const [selectedPin] = useState<string | null>(null);
  const [componentPins, setComponentPins] = useState<{[key: string]: string}>({});
  const [selectedConfigPin, setSelectedConfigPin] = useState<string>('D13');
  const [selectedPad, setSelectedPad] = useState<{ componentId: string; pin: string; wireId: string } | null>(null);

  // Função para gerar ID único baseado no nome do componente
  const generateUniqueId = (componentName: string, existingComponents: DroppedComponent[], componentTag: string) => {
    let baseName = componentName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Tratar LEDs especificamente para usar apenas 'led'
    if (componentTag === 'sim-led' || componentName.toLowerCase().includes('led')) {
      baseName = 'led';
    }

    // Obter todos os IDs existentes do mesmo tipo
    const regex = new RegExp(`^${baseName}(\\d+)$`);
    const existingIds = existingComponents
      .filter(comp => comp.id.startsWith(baseName))
      .map(comp => {
        const match = regex.exec(comp.id);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0)
      .sort((a, b) => a - b);

    // Encontrar o primeiro número disponível (reutilizar IDs vagos)
    let counter = 1;
    for (const existingNum of existingIds) {
      if (counter < existingNum) {
        break; // Encontrou um gap, usar este número
      }
      counter = existingNum + 1;
    }

    return `${baseName}${counter}`;
  };
  const canvasRef = useRef<HTMLButtonElement>(null);

  // Inicializar selectedConfigPin quando o modal abrir
  useEffect(() => {
    if (configComponent) {
      setSelectedConfigPin(componentPins[configComponent] || 'D13');
    }
  }, [configComponent, componentPins]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const tag = event.dataTransfer.getData('component/tag');
    const propsStr = event.dataTransfer.getData('component/props');
    const name = event.dataTransfer.getData('component/name');

    if (!tag) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let props = {};
    try {
      props = JSON.parse(propsStr || '{}');
    } catch {
        // Failed to parse component props
      }

    const uniqueId = generateUniqueId(name, droppedComponents, tag);

    const newComponent: DroppedComponent = {
      id: uniqueId,
      tag,
      props,
      name,
      x,
      y,
      selected: false
    };

    // Definir pino padrão para o componente
    setComponentPins(prev => ({ ...prev, [uniqueId]: 'D13' }));

    setDroppedComponents(prev => [...prev, newComponent]);
    // Component dropped
  }, [droppedComponents]);

  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    setSelectedComponent(componentId);
    setDroppedComponents(prev =>
      prev.map(comp => ({ ...comp, selected: comp.id === componentId }))
    );
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedComponent(null);
    setDroppedComponents(prev =>
      prev.map(comp => ({ ...comp, selected: false }))
    );
  }, []);

  const handleCanvasKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCanvasClick();
    }
  }, [handleCanvasClick]);

  const handleComponentMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const component = droppedComponents.find(c => c.id === componentId);
    if (!component) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedComponent(componentId);
    setDragOffset({
      x: event.clientX - rect.left - component.x,
      y: event.clientY - rect.top - component.y
    });
  }, [droppedComponents]);

  // Helper function to snap value to grid with smaller grid size
  const snapToGrid = useCallback((value: number, gridSize: number = 10) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  // Helper function to update component position with smooth movement
  const updateComponentPosition = useCallback((componentId: string, newX: number, newY: number, rect: DOMRect, useSnap: boolean = false) => {
    const constrainedX = Math.max(0, Math.min(newX, rect.width - 50));
    const constrainedY = Math.max(0, Math.min(newY, rect.height - 50));
    
    // Apply snap-to-grid if requested (usually on mouse up)
    const finalX = useSnap ? snapToGrid(constrainedX, 10) : constrainedX;
    const finalY = useSnap ? snapToGrid(constrainedY, 10) : constrainedY;
    
    setDroppedComponents(prev =>
      prev.map(comp =>
        comp.id === componentId
          ? { ...comp, x: finalX, y: finalY }
          : comp
      )
    );
  }, [snapToGrid]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!draggedComponent) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = event.clientX - rect.left - dragOffset.x;
    const newY = event.clientY - rect.top - dragOffset.y;

    // Movimento suave sem snap durante o arraste
    updateComponentPosition(draggedComponent, newX, newY, rect, false);
  }, [draggedComponent, dragOffset, updateComponentPosition]);

  // Helper function to apply snap-to-grid to component
  const applySnapToGrid = useCallback((componentId: string) => {
    const component = droppedComponents.find(c => c.id === componentId);
    if (!component) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Use the updateComponentPosition with snap enabled
    updateComponentPosition(componentId, component.x, component.y, rect, true);
  }, [droppedComponents, updateComponentPosition]);

  const handleMouseUp = useCallback(() => {
    if (draggedComponent) {
      // Apply snap-to-grid on mouse up for final positioning
      applySnapToGrid(draggedComponent);
    }
    setDraggedComponent(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedComponent, applySnapToGrid]);

  // Helper function to remove component and its pin configuration
  const removeSelectedComponent = useCallback((componentId: string) => {
    setDroppedComponents(prev => prev.filter(comp => comp.id !== componentId));
    // Limpar configuração de pino do componente removido
    setComponentPins(prev => {
      const newPins = { ...prev };
      delete newPins[componentId];
      return newPins;
    });
    setSelectedComponent(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedComponent) {
      removeSelectedComponent(selectedComponent);
    }
  }, [selectedComponent, removeSelectedComponent]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Wire management
  const handleWireCreate = useCallback((wire: Wire) => {
    setWires(prev => [...prev, wire]);
  }, []);

  const handleWireDelete = useCallback((wireId: string) => {
    setWires(prev => prev.filter(w => w.id !== wireId));
    // Fechar modal de pad se o fio deletado for o selecionado
    if (selectedPad?.wireId === wireId) {
      setSelectedPad(null);
    }
  }, [selectedPad]);

  // Handle pad selection
  const handlePadSelect = useCallback((componentId: string, pin: string, wireId: string) => {
    // Fechar modal de configuração se estiver aberto
    setConfigComponent(null);
    setSelectedPad({ componentId, pin, wireId });
  }, []);

  // Handle wire color change
  const handleWireColorChange = useCallback((wireId: string, newColor: string) => {
    setWires(prev => prev.map(wire => 
      wire.id === wireId ? { ...wire, color: newColor } : wire
    ));
  }, []);

  // Handle config component - fechar modal de pad se estiver aberto
  const handleConfigComponent = useCallback((componentId: string | null) => {
    setSelectedPad(null);
    setConfigComponent(componentId);
  }, []);

  const renderComponent = (component: DroppedComponent) => {
    const isDragging = draggedComponent === component.id;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: component.x,
      top: component.y,
      cursor: isDragging ? 'grabbing' : 'grab',
      border: component.selected ? '2px solid #007acc' : '2px solid transparent',
      borderRadius: '4px',
      padding: component.selected ? '2px 6px 0px 6px' : '2px',
      zIndex: (() => {
        if (isDragging) return 1000;
        return component.selected ? 10 : 1;
      })(),
      animation: component.selected && !isDragging ? 'selectionPulse 1.5s ease-in-out infinite' : 'none',
      transformOrigin: 'center'
    };

    const className = `simulator-component ${isDragging ? 'component-dragging' : ''}`.trim();

    // Determinar o valor do LED baseado no pino configurado
    const getLEDValue = () => {
      if (component.tag !== 'sim-led') return undefined;

      const assignedPin = componentPins[component.id] || 'D13';

      // Por enquanto, apenas o pino D13 está conectado ao simulationState.led1
      // Outros pinos retornarão false até que a simulação seja expandida
      if (assignedPin === 'D13') {
        return simulationState.led1;
      }

      // Para outros pinos, retornar false por enquanto
      return false;
    };

    const elementProps = {
      ...component.props,
      style: { pointerEvents: 'none' as const },
      // Para LEDs, conectar com o estado da simulação baseado no pino configurado
      ...(component.tag === 'sim-led' ? {
        value: getLEDValue()
      } : {})
    };

    return (
      <button
        key={component.id}
        className={className}
        style={{
          ...style,
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          outline: 'none'
        }}
        onClick={(e) => handleComponentClick(component.id, e)}
        onMouseDown={(e) => handleComponentMouseDown(component.id, e)}
        title={`${component.name} (${component.tag})`}
        data-component-id={component.id}
        aria-label={`${component.name} component`}
      >
        {React.createElement(component.tag, elementProps)}
      </button>
    );
  };

  return (
    <div className="simulator-canvas flex-1 relative overflow-hidden" style={{ backgroundColor: 'var(--grid-background)' }}>
      {/* Grid Background */}
      <div
        className="absolute inset-0 grid-pattern"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-border) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.3
        }}
      />

      {/* Barra de ferramentas */}
      <div className="absolute top-16 left-4 flex flex-wrap gap-2 z-20">
        <button
          onClick={() => setIsWiringMode(!isWiringMode)}
          className={`wiring-button ${
            isWiringMode ? 'wiring-button-active' : 'wiring-button-inactive'
          }`}
        >
          <span>🔗</span>
          <span>{isWiringMode ? 'Modo Fiação Ativo' : 'Ativar Fiação'}</span>
        </button>

        {wires.length > 0 && (
          <button
            onClick={() => setWires([])}
            className="clear-wires-button"
          >
            <span>🗑️</span>
            <span>Limpar Fios ({wires.length})</span>
          </button>
        )}

        {droppedComponents.length > 0 && (
          <div className="components-display-info">
            <span>📊</span>
            <span>{droppedComponents.length} componente(s)</span>
          </div>
        )}
      </div>

      <button
        ref={canvasRef}
        className="drop-zone w-full h-full relative cursor-crosshair border-0 p-0 bg-transparent"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onKeyDown={handleCanvasKeyDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        aria-label="Simulator canvas - drag components here, click or press Enter/Space to deselect"
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        {/* Wiring System */}
        <WiringSystem
          components={droppedComponents}
          wires={wires}
          onWireCreate={handleWireCreate}
          onPadSelect={handlePadSelect}
          isWiringMode={isWiringMode}
          enableElectricalSimulation={enableElectricalSimulation}
          onElectricalStateChange={onElectricalStateChange}
          showSignalFlow={showSignalFlow}
          showElectricalProperties={showElectricalProperties}
        />

        {/* Componentes dropados */}
        {droppedComponents.map(renderComponent)}

        {/* Indicador de estado da simulação */}
        {droppedComponents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="simulator-welcome-panel">
              <div className="simulator-welcome-instructions">
                <div className="flex items-center justify-center space-x-2">
                  <span>📦</span>
                  <span>Arraste componentes do painel lateral</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>🔗</span>
                  <span>Use o Modo Fiação para conectar</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>▶️</span>
                  <span>Clique em Iniciar para executar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status da simulação */}
        <div className="mode-indicator">
          Modo: {isWiringMode ? 'Fiação' : 'Visualização'}
        </div>

        {/* Informações do componente selecionado */}
        {selectedComponent && (() => {
          const selectedComp = droppedComponents.find(c => c.id === selectedComponent);
          const componentName = selectedComp ? selectedComp.name : 'Componente';
          
          return (
            <div className="component-info-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="component-info-title">
                  {componentName}
                </h3>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="component-info-close"
                >
                  ✕
                </button>
              </div>
              {selectedComp && (
                <div>
                  <div className="component-info-details">
                    <div className="flex justify-between">
                      <span className="font-medium">ID:</span>
                      <span className="font-mono text-xs">{selectedComp.id.split('-')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Pino:</span>
                      <span className="font-mono text-xs">{componentPins[selectedComp.id] || 'D13'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Posição:</span>
                      <span className="font-mono">({Math.round(selectedComp.x)}, {Math.round(selectedComp.y)})</span>
                    </div>
                  </div>
                  <div className="component-info-divider">
                    <button
                      onClick={() => handleConfigComponent(selectedComponent)}
                      className="component-config-button"
                    >
                      Configurar Pino
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="component-info-tip">
                      💡 Clique e arraste para mover • Delete para remover
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* LED demonstrativo (Pin 13) */}
        <div className="led-panel">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">💡</span>
            <div className="led-panel-title">
              LED Interno (Pin 13)
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                ref={ledIndicatorRef}
                className={(() => {
                  let ledClass = 'led-indicator-large ';
                  if (simulationState.led1) {
                    ledClass += 'led-indicator-large-on';
                  } else if (ledFadingOut) {
                    ledClass += 'led-indicator-large-fade-out';
                  } else {
                    ledClass += 'led-indicator-large-off';
                  }
                  return ledClass;
                })()}
              >
                {(simulationState.led1 || ledFadingOut) && (
                  <div className="led-indicator-inner" />
                )}
              </div>
              <div className="text-sm">
                <div className={`led-status-text ${
                  simulationState.led1 ? 'led-status-on' : 'led-status-off'
                }`}>
                  {simulationState.led1 ? 'LIGADO' : 'DESLIGADO'}
                </div>
                <div className="led-pin-label">
                  Arduino Pin 13
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contador de componentes */}
        <div className="components-counter">
          Componentes: {droppedComponents.length}
        </div>

        {selectedPin && (
          <div className="pin-indicator">
            Pino selecionado: {selectedPin}
          </div>
        )}

        {/* Instruções de fiação */}
        {isWiringMode && (
          <div className="wiring-instructions">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">🔗</span>
              <div className="text-sm font-bold">Modo Fiação Ativo</div>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="wiring-instruction-bullet"></span>
                <span>Clique em um pino para iniciar</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="wiring-instruction-bullet"></span>
                <span>Clique em outro pino para conectar</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="wiring-instruction-bullet"></span>
                <span>ESC para cancelar conexão</span>
              </div>
            </div>
          </div>
        )}

        {/* Pin Configuration Modal */}
        {configComponent && (
          <div className="pin-config-overlay">
            <div className="pin-config-modal">
              <div className="pin-config-header">
                <h3 className="pin-config-title">
                  Configurar Pino
                </h3>
                <button
                  onClick={() => setConfigComponent(null)}
                  className="pin-config-close"
                >
                  ✕
                </button>
              </div>

              <div className="pin-config-content">
                <div className="pin-config-component-info">
                  Componente: <span className="pin-config-component-name">{droppedComponents.find(c => c.id === configComponent)?.name}</span>
                </div>

                <div className="pin-config-component-info" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>ID:</span>
                    <span className="pin-config-component-name">{configComponent}</span>
                  </div>
                </div>

                <div className="pin-config-component-info" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Pino:</span>
                    <span className="pin-config-component-name">{componentPins[configComponent || ''] || 'D13'}</span>
                  </div>
                </div>

                <label className="pin-config-label" htmlFor="pin-select">
                  Selecione o pino do Arduino:
                </label>
                <select
                  id="pin-select"
                  className="pin-config-select"
                  value={selectedConfigPin}
                  onChange={(e) => setSelectedConfigPin(e.target.value)}
                >
                  <optgroup label="Pinos Digitais">
                    {['D0','D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'].map(p =>
                      <option key={p} value={p}>{p} {p === 'D13' ? '(LED Interno)' : ''}</option>
                    )}
                  </optgroup>
                  <optgroup label="Pinos Analógicos">
                    {['A0','A1','A2','A3','A4','A5'].map(p =>
                      <option key={p} value={p}>{p}</option>
                    )}
                  </optgroup>
                </select>
              </div>

              <div className="pin-config-buttons">
                <button
                  onClick={() => {
                    setConfigComponent(null);
                    setSelectedConfigPin('D13');
                  }}
                  className="pin-config-button pin-config-button-cancel"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (configComponent) {
                      setComponentPins(prev => ({ ...prev, [configComponent]: selectedConfigPin }));
                    }
                    setConfigComponent(null);
                    setSelectedConfigPin('D13');
                  }}
                  className="pin-config-button pin-config-button-confirm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pad Information Modal */}
        {selectedPad && (() => {
          const wire = wires.find(w => w.id === selectedPad.wireId);
          const selectedComponent = droppedComponents.find(c => c.id === selectedPad.componentId);
          
          if (!wire || !selectedComponent) return null;
          
          const isFromPin = wire.from.componentId === selectedPad.componentId && wire.from.pin === selectedPad.pin;
          const otherEnd = isFromPin ? wire.to : wire.from;
          const otherComponent = droppedComponents.find(c => c.id === otherEnd.componentId);
          
          return (
            <div className="pin-config-overlay">
              <div className="pin-config-modal">
                <div className="pin-config-header">
                  <h3 className="pin-config-title">
                    Informações do Pad
                  </h3>
                  <button
                    onClick={() => setSelectedPad(null)}
                    className="pin-config-close"
                  >
                    ✕
                  </button>
                </div>

                <div className="pin-config-content">
                  <div className="pin-config-component-info">
                    Componente: <span className="pin-config-component-name">{selectedComponent.name || selectedComponent.id}</span>
                  </div>

                  <div className="pin-config-component-info" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Pad:</span>
                      <span className="pin-config-component-name">{selectedPad.pin}</span>
                    </div>
                  </div>

                  <div className="pin-config-component-info" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Conectado a:</span>
                      <span className="pin-config-component-name">
                        {otherComponent?.name || otherEnd.componentId} ({otherEnd.pin})
                      </span>
                    </div>
                  </div>

                  <div className="pin-config-component-info" style={{ marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span>Cor do fio:</span>
                       <input
                         type="color"
                         value={wire.color}
                         onChange={(e) => handleWireColorChange(selectedPad.wireId, e.target.value)}
                         style={{
                           width: '30px',
                           height: '30px',
                           border: '1px solid #ccc',
                           borderRadius: '3px',
                           cursor: 'pointer'
                         }}
                       />
                     </div>
                   </div>
                </div>

                <div className="pin-config-buttons">
                  <button
                    onClick={() => setSelectedPad(null)}
                    className="pin-config-button pin-config-button-cancel"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      handleWireDelete(selectedPad.wireId);
                      setSelectedPad(null);
                    }}
                    className="pin-config-button pin-config-button-confirm"
                    style={{ backgroundColor: '#dc3545' }}
                  >
                    🗑️ Excluir Fio
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </button>
      

    </div>
  );
};

export default SimulatorCanvas;
