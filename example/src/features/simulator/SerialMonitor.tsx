import React, { useRef, useEffect, useState } from 'react';

interface SerialMonitorProps {
  output: string[];
  onClear: () => void;
  compact?: boolean;
  onMinimizedChange?: (isMinimized: boolean) => void;
}

const SerialMonitor: React.FC<SerialMonitorProps> = ({ output, onClear, compact = false, onMinimizedChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novo output é adicionado
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className={`serial-monitor ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="serial-header">
        <div className="serial-title-section">
          <div className="serial-status-indicator"></div>
          <h4 className="serial-title">
            Monitor Serial
          </h4>
        </div>
        <div className="serial-controls">
          {!isMinimized && (
            <span className="serial-line-count">
              {output.length} linhas
            </span>
          )}
          <button
            onClick={() => {
              const newMinimized = !isMinimized;
              setIsMinimized(newMinimized);
              onMinimizedChange?.(newMinimized);
            }}
            className="serial-minimize-button"
            title={isMinimized ? "Restaurar" : "Minimizar"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          {!isMinimized && (
            <button
              onClick={onClear}
              className="serial-clear-button"
              title="Limpar output"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      {!isMinimized && (
        <>
          <div
            ref={outputRef}
            className="serial-output"
            style={{ minHeight: compact ? '120px' : '200px', height: compact ? 'auto' : '200px' }}
          >
            {output.length === 0 ? (
              <div className="serial-empty">
                Aguardando dados da porta serial...
              </div>
            ) : (
              output.map((line, index) => (
                <div key={`${line}-${index}`} className="serial-line">
                  <span className="serial-line-number">
                    [{String(index + 1).padStart(3, '0')}]
                  </span>
                  <span className="serial-line-content">{line}</span>
                </div>
              ))
            )}
          </div>

          {/* Footer com informações */}
          <div className="serial-footer">
            <div className="serial-footer-content">
              <span>Baud Rate: 9600</span>
              <span>Encoding: ASCII</span>
            </div>
          </div>
        </>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="serial-minimized">
          <span className="serial-minimized-info">
            {output.length} linhas • Baud: 9600
          </span>
        </div>
      )}
    </div>
  );
};

export default SerialMonitor;
