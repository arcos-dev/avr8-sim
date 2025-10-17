import React, { useState } from 'react';
import { CPU } from 'avr8js';

interface InfoPanelProps {
  simulationState: {
    led1: boolean;
    running: boolean;
    frequency: number;
    performancePercentage: number;
  };
  cpu: CPU | null;
  compact?: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ simulationState, cpu, compact = false }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'cpu' | 'io'>('status');

  const formatHex = (value: number | undefined, digits: number = 2) => {
    const safeValue = value ?? 0;
    return '0x' + safeValue.toString(16).toUpperCase().padStart(digits, '0');
  };

  const formatBinary = (value: number | undefined, bits: number = 8) => {
    const safeValue = value ?? 0;
    return '0b' + safeValue.toString(2).padStart(bits, '0');
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: '📊' },
    { id: 'cpu', label: 'CPU', icon: '🔧' },
    { id: 'io', label: 'I/O', icon: '🔌' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <div className="tab-content">
            <div className="info-row">
              <span className="info-label">Estado:</span>
              <span className="info-value" style={{
                color: simulationState.running ? 'var(--status-running-color, #22c55e)' : 'var(--status-stopped-color, #ef4444)',
                backgroundColor: 'transparent'
              }}>
                {simulationState.running ? 'Executando' : 'Parado'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Frequência:</span>
              <span className="info-value">
                {(simulationState.frequency / 1000000).toFixed(1)} MHz
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Performance:</span>
              <span className="info-value performance">
                {simulationState.performancePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">LED (Pin 13):</span>
              <div className="led-status">
                <div className={`led-indicator ${
                  simulationState.led1 ? 'led-on' : 'led-off'
                }`}></div>
                <span className={`led-text ${simulationState.led1 ? 'led-on-text' : 'led-off-text'}`}>
                  {simulationState.led1 ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'cpu':
        return (
          <div className="tab-content">
            {cpu ? (
              <>
                <div className="info-row">
                  <span className="info-label">PC:</span>
                  <span className="info-value mono">
                    {formatHex(cpu.pc, 4)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">SP:</span>
                  <span className="info-value mono">
                    {formatHex(cpu.SP, 4)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cycles:</span>
                  <span className="info-value mono cycles">
                    {(cpu.cycles ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="registers-section">
                  <h6 className="subsection-title">Registradores (R0-R7)</h6>
                  <div className="registers-grid">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(reg => (
                      <div key={reg} className="register-item">
                        <span className="register-label">R{reg}:</span>
                        <span className="register-value mono">
                          {formatHex(cpu.data?.[reg])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data">CPU não inicializada</div>
            )}
          </div>
        );

      case 'io':
        return (
          <div className="tab-content">
            {cpu ? (
              <>
                <div className="port-row">
                  <span className="info-label">PORTB:</span>
                  <div className="port-values">
                    <span className="info-value mono">
                      {formatHex(cpu.data?.[0x25])}
                    </span>
                    <span className="info-value mono binary">
                      {formatBinary(cpu.data?.[0x25])}
                    </span>
                  </div>
                </div>
                <div className="port-row">
                  <span className="info-label">PORTC:</span>
                  <div className="port-values">
                    <span className="info-value mono">
                      {formatHex(cpu.data?.[0x28])}
                    </span>
                    <span className="info-value mono binary">
                      {formatBinary(cpu.data?.[0x28])}
                    </span>
                  </div>
                </div>
                <div className="port-row">
                  <span className="info-label">PORTD:</span>
                  <div className="port-values">
                    <span className="info-value mono">
                      {formatHex(cpu.data?.[0x2B])}
                    </span>
                    <span className="info-value mono binary">
                      {formatBinary(cpu.data?.[0x2B])}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data">CPU não inicializada</div>
            )}
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className={`info-panel-container ${compact ? 'compact' : 'normal'}`}>
      {/* Tabs */}
      <div className="info-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as 'status' | 'cpu' | 'io')}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            {!compact && <span className="tab-label">{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="info-panel-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default InfoPanel;