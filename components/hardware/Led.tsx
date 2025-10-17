import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';

export interface LedProps {
  color?: string;
}

// FIX: Rewrote the component to correctly handle forwarded refs and internal state updates.
// The previous implementation had a bug in `useImperativeHandle` that caused the simulation connection to fail.
export const Led = forwardRef<HTMLDivElement, LedProps>(({ color = '#ff0000' }, ref) => {
  const [isOn, setIsOn] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);

  // Expose the internal DOM element to the parent component through the forwarded ref.
  // This is crucial for the simulation runner to attach event dispatchers.
  useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

  // This effect runs once after the component mounts to set up the event listener.
  useEffect(() => {
    const node = internalRef.current;
    if (!node) return;

    const handleValueChange = (e: Event) => {
      setIsOn((e as CustomEvent).detail);
    };

    node.addEventListener('value-change', handleValueChange);
    return () => {
      node.removeEventListener('value-change', handleValueChange);
    };
  }, []); // The empty dependency array ensures this runs only once.

  const glowId = `led-glow-${color}-${Math.random()}`;

  return (
    <div ref={internalRef}>
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={isOn ? `url(#${glowId})` : 'none'}>
          {/* LED plastic casing */}
          <path d="M 10 20 A 10 10 0 0 1 30 20 L 30 35 L 10 35 Z" fill={color} opacity="0.4" />
          {/* LED light source */}
          <circle cx="20" cy="20" r="8" fill={isOn ? color : '#333'} stroke="#222" strokeWidth="1" />
          {/* Highlight */}
          <circle cx="22" cy="17" r="2" fill="white" opacity={isOn ? 0.9 : 0.3} />
        </g>
        {/* Pins */}
        <rect x="14" y="35" width="2" height="5" fill="#888" />
        <rect x="24" y="35" width="2" height="5" fill="#888" />
      </svg>
    </div>
  );
});
