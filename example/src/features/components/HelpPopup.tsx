import React, { useState } from 'react';

interface HelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPopup: React.FC<HelpPopupProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'usage' | 'shortcuts'>('tips');

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: 'tips', label: 'Dicas de Uso', icon: '💡' },
    { id: 'usage', label: 'Como Usar', icon: '🎯' },
    { id: 'shortcuts', label: 'Atalhos', icon: '🔧' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tips':
        return (
          <div className="help-tips">
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <span className="tip-text">LED built-in no pino 13 (PB5)</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔌</span>
              <span className="tip-text">PORTB controla pinos 8-13</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📡</span>
              <span className="tip-text">Use Serial.print() para debug</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⚡</span>
              <span className="tip-text">Frequência: 16 MHz</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎛️</span>
              <span className="tip-text">PORTC controla pinos A0-A5</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔗</span>
              <span className="tip-text">PORTD controla pinos 0-7</span>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="help-instructions">
            <div className="instruction-item">
              <span className="instruction-number">1</span>
              <span className="instruction-text">Arraste componentes do painel lateral para o canvas</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">2</span>
              <span className="instruction-text">Conecte os componentes usando o modo de fiação</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">3</span>
              <span className="instruction-text">Carregue seu código HEX e inicie a simulação</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">4</span>
              <span className="instruction-text">Monitore o estado dos componentes no painel de informações</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">5</span>
              <span className="instruction-text">Use o monitor serial para debug e comunicação</span>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="help-shortcuts">
            <div className="shortcut-item">
              <span className="shortcut-key">Espaço</span>
              <span className="shortcut-desc">Iniciar/Parar simulação</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">R</span>
              <span className="shortcut-desc">Reset da simulação</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Delete</span>
              <span className="shortcut-desc">Remover componente selecionado</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Ctrl + Z</span>
              <span className="shortcut-desc">Desfazer última ação</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Escape</span>
              <span className="shortcut-desc">Cancelar seleção</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">F1</span>
              <span className="shortcut-desc">Abrir esta janela de ajuda</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="help-popup-backdrop" onClick={handleBackdropClick}>
      <div className="help-popup-container">
        {/* Header */}
        <div className="help-popup-header">
          <div className="help-popup-title-section">
            <h2 className="help-popup-title">LabElet Simulator</h2>
            <span className="help-popup-version">v0.1.0</span>
          </div>
          <button 
            className="help-popup-close-btn"
            onClick={onClose}
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="help-popup-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`help-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as 'tips' | 'usage' | 'shortcuts')}
            >
              <span className="help-tab-icon">{tab.icon}</span>
              <span className="help-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="help-popup-content">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="help-popup-footer">
          <p className="help-footer-text">
            Ambiente de Simulação para Microcontroladores
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPopup;