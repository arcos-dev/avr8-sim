import { Wire, WireMetadata, WireOptions, WireSignalType, PinIdentifier } from '../../types';

const SIGNAL_COLOR_MAP: Record<WireSignalType, string> = {
  digital: '#6b7280',
  analog: '#10b981',
  power: '#ef4444',
  ground: '#111827',
  serial: '#8b5cf6',
  pwm: '#f59e0b',
};

const BOARD_COMPONENT_ID = 'board';

const SIGNAL_INFERENCE_RULES: Array<{
  test: (pin: string) => boolean;
  signal: WireSignalType;
}> = [
  {
    test: (pin) => pin.includes('GND') || pin.includes('GROUND'),
    signal: 'ground',
  },
  {
    test: (pin) =>
      pin.includes('5V') ||
      pin.includes('VIN') ||
      pin.includes('VCC') ||
      pin.includes('3V') ||
      pin.includes('3.3V'),
    signal: 'power',
  },
  {
    test: (pin) => /^A\d+$/i.test(pin) || pin.startsWith('AN'),
    signal: 'analog',
  },
  {
    test: (pin) =>
      pin.startsWith('SCL') ||
      pin.startsWith('SDA') ||
      pin.includes('RX') ||
      pin.includes('TX'),
    signal: 'serial',
  },
  {
    test: (pin) => pin.includes('PWM') || pin === 'SIG',
    signal: 'pwm',
  },
];

function normalisePinName(pin: string): string {
  return pin.trim().toUpperCase();
}

export function inferSignalType(options: WireOptions): WireSignalType {
  if (options.signal) {
    return options.signal;
  }
  const candidates = [options.from.pinName, options.to.pinName].map(normalisePinName);
  for (const { test, signal } of SIGNAL_INFERENCE_RULES) {
    if (candidates.some(test)) {
      return signal;
    }
  }
  return 'digital';
}

export function getSignalColor(signal: WireSignalType): string {
  return SIGNAL_COLOR_MAP[signal] ?? SIGNAL_COLOR_MAP.digital;
}

function swapEndpoints(options: WireOptions): WireOptions {
  return {
    ...options,
    from: options.to,
    to: options.from,
  };
}

export function standardizeWire(options: WireOptions): WireOptions {
  const normalised: WireOptions = {
    from: options.from,
    to: options.to,
    signal: options.signal,
    color: options.color,
    metadata: options.metadata ? { ...options.metadata } : undefined,
  };

  const { from, to } = normalised;
  const fromIsBoard = from.componentId === BOARD_COMPONENT_ID;
  const toIsBoard = to.componentId === BOARD_COMPONENT_ID;

  if (!fromIsBoard && toIsBoard) {
    return standardizeWire(swapEndpoints(normalised));
  }

  return normalised;
}

function generateWireId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `wire-${crypto.randomUUID()}`;
  }
  return `wire-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildMetadata(options: WireOptions, createdAt: number): WireMetadata {
  const metadata: WireMetadata = {
    createdAt: options.metadata?.createdAt ?? createdAt,
    updatedAt: createdAt,
  };

  if (options.metadata?.label) {
    metadata.label = options.metadata.label;
  }

  if (typeof options.metadata?.length === 'number') {
    metadata.length = options.metadata.length;
  }

  return metadata;
}

export function createWire(options: WireOptions): Wire {
  const standardised = standardizeWire(options);
  const signal = inferSignalType(standardised);
  const color = standardised.color ?? getSignalColor(signal);
  const timestamp = Date.now();

  return {
    id: generateWireId(),
    from: standardised.from,
    to: standardised.to,
    signal,
    color,
    metadata: buildMetadata(standardised, timestamp),
  };
}

export function updateWire(
  wire: Wire,
  updates: Partial<Pick<Wire, 'signal' | 'color' | 'metadata' | 'from' | 'to'>>
): Wire {
  const merged: WireOptions = {
    from: updates.from ?? wire.from,
    to: updates.to ?? wire.to,
    signal: updates.signal ?? wire.signal,
    color: updates.color ?? wire.color,
    metadata: {
      ...wire.metadata,
      ...updates.metadata,
    },
  };

  const standardised = standardizeWire(merged);
  const shouldInferSignal = updates.signal === undefined && (updates.from !== undefined || updates.to !== undefined);
  const signal = updates.signal ?? (shouldInferSignal ? inferSignalType(standardised) : standardised.signal ?? wire.signal);
  const color =
    updates.color ??
    (shouldInferSignal ? getSignalColor(signal) : standardised.color ?? wire.color);
  const metadata: WireMetadata = {
    ...wire.metadata,
    ...standardised.metadata,
    updatedAt: Date.now(),
  };

  return {
    ...wire,
    from: standardised.from,
    to: standardised.to,
    signal,
    color,
    metadata,
  };
}

export function isBoardEndpoint(pin: PinIdentifier): boolean {
  return pin.componentId === BOARD_COMPONENT_ID;
}

