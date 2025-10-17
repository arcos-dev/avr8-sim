import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SplitterProps {
  direction: 'horizontal' | 'vertical';
  initialSize: number;
  minSize: number;
  maxSize: number;
  onResize: (size: number) => void;
  className?: string;
  isRightPanel?: boolean; // Para corrigir direção do arrasto
  isBottomPanel?: boolean; // Para corrigir direção do arrasto vertical
  dynamicMinSize?: number; // Tamanho mínimo dinâmico (para monitor serial minimizado)
}

const Splitter: React.FC<SplitterProps> = ({
  direction,
  initialSize,
  minSize,
  maxSize,
  onResize,
  className = '',
  isRightPanel = false,
  isBottomPanel = false,
  dynamicMinSize
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentSize, setCurrentSize] = useState(initialSize);
  
  // Sincronizar currentSize com initialSize quando ele mudar
  useEffect(() => {
    setCurrentSize(initialSize);
  }, [initialSize]);
  const splitterRef = useRef<HTMLButtonElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = currentSize;
  }, [direction, currentSize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    let delta = currentPos - startPosRef.current;
    
    // Para painéis inferiores (monitor serial), inverter o delta
    // Quando arrasta para cima (delta negativo), queremos aumentar a altura (delta positivo)
    if (isBottomPanel && direction === 'vertical') {
      delta = -delta;
    }
    
    // Para painéis à direita (painel de informações), inverter o delta
    // Quando arrasta para a esquerda (delta negativo), queremos aumentar a largura (delta positivo)
    if (isRightPanel && direction === 'horizontal') {
      delta = -delta;
    }
    
    const effectiveMinSize = dynamicMinSize !== undefined ? dynamicMinSize : minSize;
    const newSize = Math.max(effectiveMinSize, Math.min(maxSize, startSizeRef.current + delta));
    
    setCurrentSize(newSize);
    onResize(newSize);
  }, [isDragging, direction, minSize, maxSize, onResize, isBottomPanel, isRightPanel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const splitterStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: 'var(--panel-border)',
    cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
    zIndex: 1000,
    userSelect: 'none',
    // Reset button default styles
    border: 'none',
    padding: 0,
    margin: 0,
    outline: 'none',
    borderRadius: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    ...(direction === 'horizontal' ? {
      width: '4px',
      height: '100%',
    } : {
      width: '100%',
      height: '4px',
    })
  };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: isDragging ? 'var(--button-background)' : 'transparent',
    transition: isDragging ? 'none' : 'background-color 0.2s ease',
    cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
    zIndex: 1001,
    ...(direction === 'horizontal' ? {
      width: '8px',
      height: '100%',
      left: '-2px',
      top: '0',
    } : {
      width: '100%',
      height: '8px',
      left: '0',
      top: '-2px',
    })
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const step = 10;
    let newSize: number;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        newSize = Math.max(minSize, currentSize - step);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        newSize = Math.min(maxSize, currentSize + step);
        break;
      default:
        return;
    }

    event.preventDefault();
    setCurrentSize(newSize);
    onResize(newSize);
  }, [currentSize, minSize, maxSize, onResize]);

  return (
    <button
      ref={splitterRef}
      className={`splitter ${className}`}
      style={splitterStyle}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      aria-label={`Redimensionar painel - ${direction === 'horizontal' ? 'horizontal' : 'vertical'}`}
      type="button"
    >
      <div style={handleStyle} />
    </button>
  );
};

export default Splitter;