import { useState, useEffect } from 'react';
import { ElementsProvider } from '@features/components/elements';
import HelpPopup from '@features/components/HelpPopup';
import { DesktopLayout, MobileLayout, MobilePanel } from '@features/components/AppComponents';
import { useSimulator } from '@shared/hooks/useSimulator';
import { BLINK_HEX } from '@shared/constants/hexPrograms';
import { CPUState } from '@shared/types';
import { CPU } from 'avr8js';
import './App.css';

// Helper function to convert CPU to CPUState
const cpuToCPUState = (cpu: CPU | null): CPUState | null => {
  if (!cpu) return null;
  return {
    pc: cpu.pc,
    cycles: cpu.cycles,
    data: cpu.data,
    SP: cpu.SP,
    clockFrequency: 16000000 // 16 MHz
  };
};

// Constantes para tamanhos dos painéis
const PANEL_SIZES = {
  components: {
    default: 320,
    min: Math.round(320 * 0.8), // 256px
    max: Math.round(320 * 1.8), // 576px
  },
  info: {
    default: 270,
    min: Math.round(270 * 0.8), // 216px
    max: 300, // 300px (limite ajustado)
  },
  serialMonitor: {
    default: 250, // Aumentado de 200 para 250
    min: 50, // Reduzido para permitir minimização mais efetiva
    max: Math.round(250 * 4), // 1000px (aumentado significativamente)
    minimized: 50, // Altura quando minimizado
  },
};

// Hook personalizado para gerenciar estado dos painéis
const usePanelState = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);
  const [componentsPanelWidth, setComponentsPanelWidth] = useState(PANEL_SIZES.components.default);
  const [infoPanelWidth, setInfoPanelWidth] = useState(PANEL_SIZES.info.default);
  const [serialMonitorHeight, setSerialMonitorHeight] = useState(PANEL_SIZES.serialMonitor.default);
  const [isSerialMonitorMinimized, setIsSerialMonitorMinimized] = useState(false);

  return {
    isPanelCollapsed,
    setIsPanelCollapsed,
    isInfoPanelCollapsed,
    setIsInfoPanelCollapsed,
    componentsPanelWidth,
    setComponentsPanelWidth,
    infoPanelWidth,
    setInfoPanelWidth,
    serialMonitorHeight,
    setSerialMonitorHeight,
    isSerialMonitorMinimized,
    setIsSerialMonitorMinimized,
  };
};

// Hook para detectar dispositivos móveis
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Hook para gerenciar tema
const useTheme = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  return { isDarkTheme, setIsDarkTheme };
};

function App() {
  const [currentHex, setCurrentHex] = useState(BLINK_HEX);
  const [isHelpPopupOpen, setIsHelpPopupOpen] = useState(false);

  // Estados para simulação elétrica
  const [enableElectricalSimulation, setEnableElectricalSimulation] = useState(true);
  const [showSignalFlow, setShowSignalFlow] = useState(true);
  const [showElectricalProperties, setShowElectricalProperties] = useState(false);
  const [electricalState, setElectricalState] = useState(null);

  const panelState = usePanelState();
  const isMobile = useMobileDetection();
  const { isDarkTheme, setIsDarkTheme } = useTheme();

  const { simulationState, start, stop, reset, cpu, serialOutput, clearSerialOutput } = useSimulator(currentHex);

  const handleTogglePanel = () => {
    panelState.setIsPanelCollapsed(!panelState.isPanelCollapsed);
  };

  const handleToggleInfoPanel = () => {
    panelState.setIsInfoPanelCollapsed(!panelState.isInfoPanelCollapsed);
  };

  const handleToggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleHexLoad = (hex: string) => {
    setCurrentHex(hex);
  };

  const handleSimulationToggle = () => {
    if (simulationState.running) {
      stop();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
    setCurrentHex(BLINK_HEX);
  };

  const createSimulationState = () => ({
    led1: simulationState.led1,
    running: simulationState.running,
    ports: cpu ? {
      B: cpu.data[0x25] || 0,
      C: cpu.data[0x28] || 0,
      D: cpu.data[0x2B] || 0
    } : { B: 0, C: 0, D: 0 },
    cpu: cpuToCPUState(cpu)
  });

  // App Container
  return (
    <ElementsProvider>
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">LabElet Simulator</h1>
              <div className="app-subtitle">
                Ambiente de Simulação para Microcontroladores
              </div>
            </div>
            <div className="header-right">
              <button
                className="help-btn"
                onClick={() => setIsHelpPopupOpen(true)}
                title="Ajuda"
              >
                ❓
              </button>
              <button
                className="theme-toggle-btn"
                onClick={handleToggleTheme}
                title={isDarkTheme ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              >
                {isDarkTheme ? '☀️' : '🌙'}
              </button>
              <div className={`status-badge ${
                simulationState.running ? 'status-running' : 'status-stopped'
              }`}>
                {simulationState.running ? 'Executando' : 'Parado'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className={`main-content ${
          isMobile ? 'mobile-layout' : 'desktop-layout'
        }`}>
          {!isMobile ? (
            <DesktopLayout
              panelState={panelState}
              PANEL_SIZES={PANEL_SIZES}
              handleTogglePanel={handleTogglePanel}
              handleToggleInfoPanel={handleToggleInfoPanel}
              simulationState={simulationState}
              cpu={cpu}
              serialOutput={serialOutput}
              clearSerialOutput={clearSerialOutput}
              handleSimulationToggle={handleSimulationToggle}
              handleReset={handleReset}
              handleHexLoad={handleHexLoad}
              currentHex={currentHex}
              setCurrentHex={setCurrentHex}
              createSimulationState={createSimulationState}
              enableElectricalSimulation={enableElectricalSimulation}
          setEnableElectricalSimulation={setEnableElectricalSimulation}
          showSignalFlow={showSignalFlow}
          setShowSignalFlow={setShowSignalFlow}
          showElectricalProperties={showElectricalProperties}
          setShowElectricalProperties={setShowElectricalProperties}
          electricalState={electricalState}
          setElectricalState={setElectricalState}
            />
          ) : (
            <MobileLayout
              panelState={panelState}
              handleTogglePanel={handleTogglePanel}
              simulationState={simulationState}
              handleSimulationToggle={handleSimulationToggle}
              handleReset={handleReset}
              handleHexLoad={handleHexLoad}
              currentHex={currentHex}
              setCurrentHex={setCurrentHex}
              createSimulationState={createSimulationState}
            />
          )}
        </div>

        {/* Mobile Bottom Panel */}
        {isMobile && (
          <MobilePanel
            panelState={panelState}
            handleToggleInfoPanel={handleToggleInfoPanel}
            simulationState={simulationState}
            cpu={cpu}
            serialOutput={serialOutput}
            clearSerialOutput={clearSerialOutput}
          />
        )}

        {/* Help Popup */}
        <HelpPopup
          isOpen={isHelpPopupOpen}
          onClose={() => setIsHelpPopupOpen(false)}
        />
      </div>
    </ElementsProvider>
  );
}

export default App;
