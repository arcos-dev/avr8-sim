import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SimulatorCanvas from '../SimulatorCanvas';

// Mock dos elementos modulares
jest.mock('../../components/elements', () => ({
  // Mock implementation
  ElementsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="elements">{children}</div>,
}));

// Mock do WiringSystem
jest.mock('../components/WiringSystem', () => ({
  __esModule: true,
  default: () => <div data-testid="wiring-system" />,
}));

// Mock do WiringSystem
jest.mock('@features/components/WiringSystem', () => {
  return function WiringSystem() {
    return <div data-testid="wiring-system" />;
  };
});

describe('SimulatorCanvas', () => {
  const defaultSimulationState = {
    led1: false,
    running: false,
    ports: { B: 0, C: 0, D: 0 },
    cpu: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <SimulatorCanvas
        simulationState={defaultSimulationState}
      />
    );

    expect(screen.getByText('LabElet Simulator')).toBeInTheDocument();
  });

  it('should display LED OFF state correctly', () => {
    render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, led1: false }}
      />
    );

    const ledStatus = screen.getByText('OFF');
    expect(ledStatus).toBeInTheDocument();

    // Check if LED has the correct OFF styling
    const ledElement = screen.getByText('LED Builtin (Pin 13)').parentElement;
    const ledIndicator = ledElement?.querySelector('div[class*="bg-gray-600"]');
    expect(ledIndicator).toBeInTheDocument();
  });

  it('should display LED ON state correctly', () => {
    render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, led1: true }}
      />
    );

    const ledStatus = screen.getByText('ON');
    expect(ledStatus).toBeInTheDocument();

    // Check if LED has the correct ON styling
    const ledElement = screen.getByText('LED Builtin (Pin 13)').parentElement;
    const ledIndicator = ledElement?.querySelector('div[class*="bg-yellow-400"]');
    expect(ledIndicator).toBeInTheDocument();
  });

  it('should display simulation running status', () => {
    render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, running: true }}
      />
    );

    expect(screen.getByText('Status: 🟢 Executando')).toBeInTheDocument();
  });

  it('should display simulation stopped status', () => {
    render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, running: false }}
      />
    );

    expect(screen.getByText('Status: 🔴 Parado')).toBeInTheDocument();
  });

  it('should show welcome message when no components and not running', () => {
    render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, running: false }}
      />
    );

    expect(screen.getByText('Arraste componentes do painel lateral para começar')).toBeInTheDocument();
    expect(screen.getByText('Use o Modo Fiação para conectar componentes')).toBeInTheDocument();
  });

  it('should toggle wiring mode when button is clicked', () => {
    render(
      <SimulatorCanvas
        simulationState={defaultSimulationState}
      />
    );

    const wiringButton = screen.getByText('Modo Fiação');
    expect(wiringButton).toBeInTheDocument();

    fireEvent.click(wiringButton);

    expect(screen.getByText('Sair do Modo Fiação')).toBeInTheDocument();
    expect(screen.getByText('Modo Fiação Ativo')).toBeInTheDocument();
  });

  it('should display component counter', () => {
    render(
      <SimulatorCanvas
        simulationState={defaultSimulationState}
      />
    );

    expect(screen.getByText('Componentes: 0')).toBeInTheDocument();
  });

  it('should handle drag over events', () => {
    render(
      <SimulatorCanvas
        simulationState={defaultSimulationState}
      />
    );

    const canvas = screen.getByText('LabElet Simulator').closest('div');

    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    });

    fireEvent(canvas!, dragOverEvent);

    expect(dragOverEvent.defaultPrevented).toBe(true);
  });

  it('should render WiringSystem component', () => {
    render(
      <SimulatorCanvas
        simulationState={defaultSimulationState}
      />
    );

    expect(screen.getByTestId('wiring-system')).toBeInTheDocument();
  });

  it('should update LED visual state when simulationState.led1 changes', () => {
    const { rerender } = render(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, led1: false }}
      />
    );

    expect(screen.getByText('OFF')).toBeInTheDocument();

    rerender(
      <SimulatorCanvas
        simulationState={{ ...defaultSimulationState, led1: true }}
      />
    );

    expect(screen.getByText('ON')).toBeInTheDocument();
  });
});
