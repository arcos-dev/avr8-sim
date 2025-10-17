import React from 'react';
import ComponentsPanel from '@features/components/ComponentsPanel';
import SimulatorCanvas from '@features/simulator/SimulatorCanvas';
import SimulationControls from '@features/simulator/SimulationControls';
import SerialMonitor from '@features/simulator/SerialMonitor';
import InfoPanel from '@features/simulator/InfoPanel';
import Splitter from '@features/components/Splitter';

import { CPU } from 'avr8js';

interface PanelState {
  isPanelCollapsed: boolean;
  componentsPanelWidth: number;
  setComponentsPanelWidth: (width: number) => void;
  isInfoPanelCollapsed: boolean;
  infoPanelWidth: number;
  setInfoPanelWidth: (width: number) => void;
  serialMonitorHeight: number;
  setSerialMonitorHeight: (height: number) => void;
  isSerialMonitorMinimized: boolean;
  setIsSerialMonitorMinimized: (minimized: boolean) => void;
}

interface PanelSizesType {
  components: { min: number; max: number };
  info: { min: number; max: number };
  serialMonitor: { min: number; max: number; default: number; minimized: number };
}

interface DesktopLayoutProps {
  panelState: PanelState;
  PANEL_SIZES: PanelSizesType;
  handleTogglePanel: () => void;
  handleToggleInfoPanel: () => void;
  simulationState: any;
  cpu: CPU | null;
  serialOutput: string[];
  clearSerialOutput: () => void;
  handleSimulationToggle: () => void;
  handleReset: () => void;
  handleHexLoad: (hex: string) => void;
  currentHex: string;
  setCurrentHex: (hex: string) => void;
  createSimulationState: () => any;
  // Propriedades para simulação elétrica
  enableElectricalSimulation?: boolean;
  setEnableElectricalSimulation?: (enabled: boolean) => void;
  showSignalFlow?: boolean;
  setShowSignalFlow?: (show: boolean) => void;
  showElectricalProperties?: boolean;
  setShowElectricalProperties?: (show: boolean) => void;
  electricalState?: any;
  setElectricalState?: (state: any) => void;
}

interface CentralAreaProps {
  simulationState: any;
  handleSimulationToggle: () => void;
  handleReset: () => void;
  handleHexLoad: (hex: string) => void;
  currentHex: string;
  setCurrentHex: (hex: string) => void;
  createSimulationState: () => any;
  panelState: PanelState;
  PANEL_SIZES: PanelSizesType;
  serialOutput: string[];
  clearSerialOutput: () => void;
  handleToggleInfoPanel: () => void;
  cpu: CPU | null;
  // Propriedades para simulação elétrica
  enableElectricalSimulation?: boolean;
  setEnableElectricalSimulation?: (enabled: boolean) => void;
  showSignalFlow?: boolean;
  setShowSignalFlow?: (show: boolean) => void;
  showElectricalProperties?: boolean;
  setShowElectricalProperties?: (show: boolean) => void;
  electricalState?: any;
  setElectricalState?: (state: any) => void;
}

interface InfoPanelRightProps {
  panelState: PanelState;
  handleToggleInfoPanel: () => void;
  simulationState: any;
  cpu: CPU | null;
  // Propriedades para simulação elétrica
  enableElectricalSimulation?: boolean;
  setEnableElectricalSimulation?: (enabled: boolean) => void;
  showSignalFlow?: boolean;
  setShowSignalFlow?: (show: boolean) => void;
  showElectricalProperties?: boolean;
  setShowElectricalProperties?: (show: boolean) => void;
  electricalState?: any;
}

interface MobileLayoutProps {
  panelState: PanelState;
  handleTogglePanel: () => void;
  simulationState: any;
  handleSimulationToggle: () => void;
  handleReset: () => void;
  handleHexLoad: (hex: string) => void;
  currentHex: string;
  setCurrentHex: (hex: string) => void;
  createSimulationState: () => any;
}

interface MobilePanelProps {
  panelState: PanelState;
  handleToggleInfoPanel: () => void;
  simulationState: any;
  cpu: CPU | null;
  serialOutput: string[];
  clearSerialOutput: () => void;
}

// Componente para o layout desktop
export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  panelState,
  PANEL_SIZES,
  handleTogglePanel,
  handleToggleInfoPanel,
  simulationState,
  cpu,
  serialOutput,
  clearSerialOutput,
  handleSimulationToggle,
  handleReset,
  handleHexLoad,
  currentHex,
  setCurrentHex,
  createSimulationState,
  enableElectricalSimulation,
  setEnableElectricalSimulation,
  showSignalFlow,
  setShowSignalFlow,
  showElectricalProperties,
  setShowElectricalProperties,
  electricalState,
  setElectricalState
}) => (
  <>
    {/* Components Panel */}
    <div 
      className={`components-panel ${
        panelState.isPanelCollapsed ? 'collapsed' : 'expanded'
      }`}
      style={{ width: panelState.isPanelCollapsed ? '40px' : `${panelState.componentsPanelWidth}px` }}
    >
      <ComponentsPanel
        isCollapsed={panelState.isPanelCollapsed}
        onToggle={handleTogglePanel}
      />
    </div>

    {/* Splitter between Components Panel and Central Area */}
    {!panelState.isPanelCollapsed && (
      <Splitter
        direction="horizontal"
        initialSize={panelState.componentsPanelWidth}
        minSize={PANEL_SIZES.components.min}
        maxSize={PANEL_SIZES.components.max}
        onResize={panelState.setComponentsPanelWidth}
        className="components-splitter"
      />
    )}

    <CentralArea
      simulationState={simulationState}
      handleSimulationToggle={handleSimulationToggle}
      handleReset={handleReset}
      handleHexLoad={handleHexLoad}
      currentHex={currentHex}
      setCurrentHex={setCurrentHex}
      createSimulationState={createSimulationState}
      panelState={panelState}
      PANEL_SIZES={PANEL_SIZES}
      serialOutput={serialOutput}
      clearSerialOutput={clearSerialOutput}
      handleToggleInfoPanel={handleToggleInfoPanel}
      cpu={cpu}
      enableElectricalSimulation={enableElectricalSimulation}
      setEnableElectricalSimulation={setEnableElectricalSimulation}
      showSignalFlow={showSignalFlow}
      setShowSignalFlow={setShowSignalFlow}
      showElectricalProperties={showElectricalProperties}
      setShowElectricalProperties={setShowElectricalProperties}
      electricalState={electricalState}
      setElectricalState={setElectricalState}
    />
  </>
);

// Componente para a área central
export const CentralArea: React.FC<CentralAreaProps> = ({
  simulationState,
  handleSimulationToggle,
  handleReset,
  handleHexLoad,
  currentHex,
  setCurrentHex,
  createSimulationState,
  panelState,
  PANEL_SIZES,
  serialOutput,
  clearSerialOutput,
  handleToggleInfoPanel,
  cpu,
  enableElectricalSimulation,
  setEnableElectricalSimulation,
  showSignalFlow,
  setShowSignalFlow,
  showElectricalProperties,
  setShowElectricalProperties,
  electricalState,
  setElectricalState
}) => (
  <div className="flex-1 flex flex-col min-w-0">
    {/* Simulation Controls */}
    <SimulationControls
      simulationState={simulationState}
      onToggleSimulation={handleSimulationToggle}
      onReset={handleReset}
      onHexLoad={handleHexLoad}
      currentHex={currentHex}
      onHexChange={setCurrentHex}
    />

    {/* Simulator Canvas and Serial Monitor with Right Info Panel */}
    <div className="flex-1 flex overflow-hidden">
      {/* Left side: Simulator Canvas and Serial Monitor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1">
          <SimulatorCanvas 
            simulationState={createSimulationState()}
            enableElectricalSimulation={enableElectricalSimulation}
            showSignalFlow={showSignalFlow}
            showElectricalProperties={showElectricalProperties}
            onElectricalStateChange={setElectricalState}
          />
        </div>

        {/* Splitter between Simulator and Serial Monitor */}
        <Splitter
          direction="vertical"
          initialSize={panelState.serialMonitorHeight}
          minSize={PANEL_SIZES.serialMonitor.min}
          maxSize={PANEL_SIZES.serialMonitor.max}
          onResize={panelState.setSerialMonitorHeight}
          className="serial-splitter"
          isBottomPanel={true}
          dynamicMinSize={panelState.isSerialMonitorMinimized ? PANEL_SIZES.serialMonitor.minimized : PANEL_SIZES.serialMonitor.min}
        />

        {/* Bottom Serial Monitor */}
        <div 
          className="bottom-serial-panel"
          style={{ 
            height: `${panelState.serialMonitorHeight}px`
          }}
        >
          <SerialMonitor
            output={serialOutput}
            onClear={clearSerialOutput}
            compact={false}
            onMinimizedChange={(isMinimized) => {
              panelState.setIsSerialMonitorMinimized(isMinimized);
              if (isMinimized) {
                panelState.setSerialMonitorHeight(PANEL_SIZES.serialMonitor.minimized);
              } else {
                panelState.setSerialMonitorHeight(PANEL_SIZES.serialMonitor.default);
              }
            }}
          />
        </div>
      </div>

      {/* Splitter between Central Area and Info Panel */}
      {!panelState.isInfoPanelCollapsed && (
        <Splitter
          direction="horizontal"
          initialSize={panelState.infoPanelWidth}
          minSize={PANEL_SIZES.info.min}
          maxSize={PANEL_SIZES.info.max}
          onResize={panelState.setInfoPanelWidth}
          className="info-splitter"
          isRightPanel={true}
        />
      )}

      {/* Info Panel Right */}
      <InfoPanelRight
        panelState={panelState}
        handleToggleInfoPanel={handleToggleInfoPanel}
        simulationState={simulationState}
        cpu={cpu}
        enableElectricalSimulation={enableElectricalSimulation}
        setEnableElectricalSimulation={setEnableElectricalSimulation}
        showSignalFlow={showSignalFlow}
        setShowSignalFlow={setShowSignalFlow}
        showElectricalProperties={showElectricalProperties}
        setShowElectricalProperties={setShowElectricalProperties}
        electricalState={electricalState}
      />
    </div>
  </div>
);

// Componente para o painel de informações à direita
export const InfoPanelRight: React.FC<InfoPanelRightProps> = ({
  panelState,
  handleToggleInfoPanel,
  simulationState,
  cpu,
  enableElectricalSimulation,
  setEnableElectricalSimulation,
  showSignalFlow,
  setShowSignalFlow,
  showElectricalProperties,
  setShowElectricalProperties,
  electricalState
}) => (
  <div 
    className={`info-panel-right ${
      panelState.isInfoPanelCollapsed ? 'collapsed' : 'expanded'
    }`}
    style={{ width: panelState.isInfoPanelCollapsed ? '40px' : `${panelState.infoPanelWidth}px` }}
  >
    <div className="info-panel-header">
      {!panelState.isInfoPanelCollapsed && (
        <h3 className="panel-title">Informações</h3>
      )}
      <button
        onClick={handleToggleInfoPanel}
        className="panel-toggle-btn"
      >
        {panelState.isInfoPanelCollapsed ? '◀' : '▶'}
      </button>
    </div>

    {!panelState.isInfoPanelCollapsed && (
      <div className="info-panels-container">
        {/* Painel de Informações */}
        <div className="info-panel-content">
          <InfoPanel
            simulationState={simulationState}
            cpu={cpu}
          />
        </div>

        {/* Divisória entre painéis */}
        <div style={{ borderTop: '1px solid var(--panel-border)' }}></div>

        {/* Sub-painel de Simulação Elétrica */}
         <div className="info-panel-content" style={{ paddingLeft: '22px', paddingRight: '22px' }}>
           <div className="info-panel-header" style={{ padding: '8px 12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '12px' }}>
             <h3 className="panel-title">⚡ Simulação Elétrica</h3>
           </div>
           
           <div className="tab-content">
            {/* Controles */}
            <div className="register-item">
              <span className="register-label">Simulação:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={enableElectricalSimulation || false}
                  onChange={(e) => setEnableElectricalSimulation?.(e.target.checked)}
                  style={{ margin: 0, transform: 'scale(0.8)' }}
                />
                <span className="register-value" style={{
                   color: enableElectricalSimulation ? 'var(--status-running-color, #22c55e)' : 'var(--status-stopped-color, #ef4444)',
                   backgroundColor: 'transparent'
                 }}>
                   {enableElectricalSimulation ? 'Ativa' : 'Inativa'}
                 </span>
              </div>
            </div>
            
            <div className="register-item">
              <span className="register-label">Fluxo de Sinal:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={showSignalFlow || false}
                  onChange={(e) => setShowSignalFlow?.(e.target.checked)}
                  disabled={!enableElectricalSimulation}
                  style={{ margin: 0, transform: 'scale(0.8)' }}
                />
                <span className="register-value" style={{
                   color: showSignalFlow && enableElectricalSimulation ? 'var(--status-running-color, #22c55e)' : 'var(--status-stopped-color, #ef4444)',
                   backgroundColor: 'transparent'
                 }}>
                   {showSignalFlow && enableElectricalSimulation ? 'Visível' : 'Oculto'}
                 </span>
              </div>
            </div>
            
            <div className="register-item">
              <span className="register-label">Propriedades:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={showElectricalProperties || false}
                  onChange={(e) => setShowElectricalProperties?.(e.target.checked)}
                  disabled={!enableElectricalSimulation}
                  style={{ margin: 0, transform: 'scale(0.8)' }}
                />
                <span className="register-value" style={{
                   color: showElectricalProperties && enableElectricalSimulation ? 'var(--status-running-color, #22c55e)' : 'var(--status-stopped-color, #ef4444)',
                   backgroundColor: 'transparent'
                 }}>
                   {showElectricalProperties && enableElectricalSimulation ? 'Visíveis' : 'Ocultas'}
                 </span>
              </div>
            </div>

            {/* Status da simulação elétrica */}
            {enableElectricalSimulation && electricalState && (
              <>
                <div className="register-item">
                  <span className="register-label">Status:</span>
                  <span className="register-value" style={{
                     color: electricalState.isRunning ? 'var(--status-running-color, #22c55e)' : 'var(--status-stopped-color, #ef4444)',
                     backgroundColor: 'transparent'
                   }}>
                     {electricalState.isRunning ? 'Executando' : 'Parado'}
                   </span>
                </div>
                
                <div className="register-item">
                  <span className="register-label">Componentes:</span>
                  <span className="register-value">{electricalState.componentCount || 0}</span>
                </div>
                
                <div className="register-item">
                  <span className="register-label">Fios:</span>
                  <span className="register-value">{electricalState.wireCount || 0}</span>
                </div>
                
                {electricalState.monitor && (
                  <>
                    <div className="register-item">
                      <span className="register-label">Corrente Total:</span>
                      <span className="register-value mono">
                        {(electricalState.monitor.realTimeData?.totalCurrent || 0).toFixed(3)}A
                      </span>
                    </div>
                    
                    <div className="register-item">
                      <span className="register-label">Potência Total:</span>
                      <span className="register-value mono">
                        {(electricalState.monitor.realTimeData?.totalPower || 0).toFixed(3)}W
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);

// Componente para o layout mobile
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  panelState,
  handleTogglePanel,
  simulationState,
  handleSimulationToggle,
  handleReset,
  handleHexLoad,
  currentHex,
  setCurrentHex,
  createSimulationState
}) => (
  <>
    <ComponentsPanel
      isCollapsed={panelState.isPanelCollapsed}
      onToggle={handleTogglePanel}
    />
    <div className="flex-1 flex flex-col min-w-0">
      <SimulationControls
        simulationState={simulationState}
        onToggleSimulation={handleSimulationToggle}
        onReset={handleReset}
        onHexLoad={handleHexLoad}
        currentHex={currentHex}
        onHexChange={setCurrentHex}
      />
      <div className="flex-1">
        <SimulatorCanvas simulationState={createSimulationState()} />
      </div>
    </div>
  </>
);

// Componente para o painel mobile
export const MobilePanel: React.FC<MobilePanelProps> = ({
  panelState,
  handleToggleInfoPanel,
  simulationState,
  cpu,
  serialOutput,
  clearSerialOutput
}) => (
  <div className="mobile-panel">
    <div className="mobile-panel-header">
      <button
        onClick={handleToggleInfoPanel}
        className="mobile-panel-toggle-btn"
      >
        {panelState.isInfoPanelCollapsed ? '▲ Mostrar Informações' : '▼ Ocultar Informações'}
      </button>
    </div>
    {!panelState.isInfoPanelCollapsed && (
      <div className="mobile-grid">
        <InfoPanel
          simulationState={simulationState}
          cpu={cpu}
          compact
        />
        <SerialMonitor
          output={serialOutput}
          onClear={clearSerialOutput}
          compact
        />
      </div>
    )}
  </div>
);