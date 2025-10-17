import React, { useState, useRef } from 'react';
import { BLINK_HEX, HELLO_WORLD_HEX, COUNTER_HEX } from '@shared/constants/hexPrograms';
// Enhanced simulator with proper AVR8JS implementation

interface SimulationControlsProps {
  simulationState: {
    led1: boolean;
    running: boolean;
    frequency: number;
  };
  onToggleSimulation: () => void;
  onReset: () => void;
  onHexLoad: (hex: string) => void;
  currentHex: string;
  onHexChange: (hex: string) => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationState,
  onToggleSimulation,
  onReset,
  onHexLoad,
  currentHex,
  onHexChange
}) => {
  const [showHexEditor, setShowHexEditor] = useState(false);
  const [selectedExample, setSelectedExample] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const examplePrograms = [
    { name: 'Blink LED', hex: BLINK_HEX, description: 'Pisca o LED built-in' },
    { name: 'Hello World', hex: HELLO_WORLD_HEX, description: 'Exibe mensagem no serial' },
    { name: 'Contador', hex: COUNTER_HEX, description: 'Contador simples' },
  ];

  const handleExampleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedExample(selectedValue);
    if (selectedValue) {
      const program = examplePrograms.find(p => p.name === selectedValue);
      if (program) {
        onHexLoad(program.hex);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.hex') && !fileName.endsWith('.elf')) {
      alert('Apenas arquivos .hex e .elf são suportados!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onHexLoad(content);
        // File loaded successfully
      }
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="simulation-controls">
      <div className="controls-container">
        {/* Controles Principais */}
        <div className="controls-main">
          {/* Seletor de Exemplos */}
          <div className="examples-section">
            <label htmlFor="example-select" className="examples-label">Exemplos:</label>
            <select
              id="example-select"
              value={selectedExample}
              onChange={handleExampleChange}
              className="example-select"
            >
              <option value="">Nenhum Selecionado</option>
              {examplePrograms.map((program) => (
                <option key={program.name} value={program.name} title={program.description}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div className="controls-buttons">
            <button
              onClick={onToggleSimulation}
              className={`control-button ${simulationState.running ? 'stop-button' : 'start-button'}`}
            >
              <span>{simulationState.running ? '⏸' : '▶'}</span>
              <span>{simulationState.running ? 'Parar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={onReset}
              className="control-button reset-button"
            >
              <span>🔄</span>
              <span>Reset</span>
            </button>

            <button
              onClick={() => setShowHexEditor(!showHexEditor)}
              className={`control-button ${showHexEditor ? 'hex-button-active' : 'hex-button'}`}
            >
              <span>📝</span>
              <span>Editor HEX</span>
            </button>

            <button
              onClick={handleUploadClick}
              className="control-button upload-button"
              title="Carregar arquivo .hex ou .elf"
            >
              <span>📁</span>
              <span>Carregar Arquivo</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".hex,.elf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="status-indicators">
            {/* LED Status */}
            <div className="led-status">
              <div className={`led-indicator ${simulationState.led1 ? 'led-on' : 'led-off'}`}></div>
              <span className="led-label">
                LED Pin 13:{' '}
                <span className={`led-state ${simulationState.led1 ? 'state-on' : 'state-off'}`}>
                  {simulationState.led1 ? 'ON' : 'OFF'}
                </span>
              </span>
            </div>

            {/* Frequency */}
            <div className="frequency-display">
              <span className="frequency-value">
                {(simulationState.frequency / 1000000).toFixed(1)} MHz
              </span>
            </div>
          </div>
        </div>



        {/* Editor HEX */}
        {showHexEditor && (
          <div className="hex-editor">
            <div className="hex-editor-header">
              <h4 className="hex-editor-title">Editor de Código HEX</h4>
              <div className="hex-editor-buttons">
                <button
                  onClick={() => onHexChange(currentHex)}
                  className="hex-apply-button"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setShowHexEditor(false)}
                  className="hex-close-button"
                >
                  Fechar
                </button>
              </div>
            </div>
            <textarea
              value={currentHex}
              onChange={(e) => onHexChange(e.target.value)}
              className="hex-textarea"
              placeholder="Cole o código HEX aqui..."
              spellCheck={false}
            />
            <div className="hex-tip">
              💡 Dica: Cole o código HEX gerado pelo Arduino IDE ou outros compiladores AVR
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationControls;
