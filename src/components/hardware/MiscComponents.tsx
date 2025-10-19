import React from 'react';

// FIX: Removed the problematic RefWrapper component. Each component will now use a simple `div` to forward the ref.
export const Potentiometer = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="50" height="50" viewBox="0 0 50 50">
      <rect x="5" y="25" width="40" height="20" rx="4" fill="#6B7280" />
      <rect x="15" y="10" width="20" height="20" rx="10" fill="#374151" />
      <line x1="25" y1="20" x2="25" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
));

export const Dht22 = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="50" height="55" viewBox="0 0 50 55">
      <rect x="2" y="2" width="46" height="50" rx="4" fill="white" stroke="#9CA3AF" />
      <path d="M10 10 V 45 M 15 10 V 45 M 20 10 V 45 M 25 10 V 45 M 30 10 V 45 M 35 10 V 45 M 40 10 V 45" stroke="#E5E7EB" strokeWidth="2" />
    </svg>
  </div>
));

export const Lcd1602 = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="160" height="60" viewBox="0 0 160 60">
      <rect width="160" height="60" rx="4" fill="#1E40AF" />
      <rect x="10" y="10" width="140" height="40" fill="#60A5FA" />
      <text x="15" y="35" fontFamily="monospace" fill="#1E3A8A">Hello, ProtoSim!</text>
    </svg>
  </div>
));

export const Ssd1306 = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="70" height="40" viewBox="0 0 70 40">
      <rect width="70" height="40" rx="3" fill="#1F2937" />
      <rect x="5" y="5" width="60" height="30" fill="#3B82F6" />
    </svg>
  </div>
));

export const Servo = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="60" height="60" viewBox="0 0 60 60">
      <rect x="10" y="20" width="40" height="35" fill="#4B5563" />
      <circle cx="30" cy="20" r="15" fill="#6B7280" />
      <rect x="28" y="5" width="4" height="30" fill="#9CA3AF" />
      <rect x="15" y="5" width="30" height="4" fill="#9CA3AF" />
    </svg>
  </div>
));

export const MembraneKeypad = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="80" height="90" viewBox="0 0 80 90">
      <rect width="80" height="90" rx="5" fill="#D1D5DB" />
      {[0, 1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => (
          <rect key={`${row}-${col}`} x={5 + col * 18} y={5 + row * 18} width="16" height="16" rx="2" fill="#4B5563" />
        ))
      )}
    </svg>
  </div>
));

export const RgbLed = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="40" height="40" viewBox="0 0 40 40">
       <path d="M 10 20 A 10 10 0 0 1 30 20 L 30 35 L 10 35 Z" fill="white" opacity="0.5" />
       <circle cx="20" cy="20" r="8" fill="white" stroke="#222" strokeWidth="1" />
    </svg>
  </div>
));

export const SevenSegment = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="40" height="60" viewBox="0 0 40 60">
      <rect width="40" height="60" fill="#1F2937" rx="3"/>
      <g fill="#EF4444" opacity="0.3">
        <path d="M11 8 h18 v4 h-18 z" />
        <path d="M30 13 h4 v18 h-4 z" />
        <path d="M30 35 h4 v18 h-4 z" />
        <path d="M11 54 h18 v4 h-18 z" />
        <path d="M6 35 h4 v18 h-4 z" />
        <path d="M6 13 h4 v18 h-4 z" />
        <path d="M11 31 h18 v4 h-18 z" />
      </g>
      <g fill="#EF4444">
        <path d="M11 8 h18 v4 h-18 z" />
        <path d="M30 13 h4 v18 h-4 z" />
        <path d="M11 54 h18 v4 h-18 z" />
        <path d="M6 35 h4 v18 h-4 z" />
        <path d="M6 13 h4 v18 h-4 z" />
      </g>
    </svg>
  </div>
));

export const NeoPixel = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="25" height="25" viewBox="0 0 25 25">
      <rect width="25" height="25" fill="#1F2937" />
      <circle cx="12.5" cy="12.5" r="8" fill="#3B82F6" />
    </svg>
  </div>
));

export const NeoPixelRing = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="38" fill="none" stroke="#1F2937" strokeWidth="4"/>
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 2 * Math.PI;
        const cx = 40 + 30 * Math.cos(angle);
        const cy = 40 + 30 * Math.sin(angle);
        return <circle key={i} cx={cx} cy={cy} r="5" fill="#3B82F6" />;
      })}
    </svg>
  </div>
));

export const NeoPixelMatrix = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#1F2937" />
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={10 + col * 11} cy={10 + row * 11} r="4" fill="#3B82F6" />
        ))
      )}
    </svg>
  </div>
));

export const PirMotionSensor = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="50" height="60" viewBox="0 0 50 60">
      <rect x="5" y="25" width="40" height="30" rx="3" fill="#3B82F6" />
      <path d="M 5 25 C 5 10, 45 10, 45 25" fill="white" />
    </svg>
  </div>
));

export const NtcTempSensor = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref}>
    <svg width="30" height="50" viewBox="0 0 30 50">
      <line x1="10" y1="20" x2="10" y2="50" stroke="#9CA3AF" />
      <line x1="20" y1="20" x2="20" y2="50" stroke="#9CA3AF" />
      <circle cx="15" cy="15" r="8" fill="#1F2937" />
    </svg>
  </div>
));
