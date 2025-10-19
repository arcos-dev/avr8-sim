
import React from 'react';
import type { ComponentInstance, PinConnectionMap, PinConnectionTarget } from '../types';

interface PropertiesPanelProps {
  component: ComponentInstance;
  pins: any[] | null;
  connections: PinConnectionMap;
  onUpdate: (id: string, updates: Partial<ComponentInstance>) => void;
  onDelete: (id: string) => void;
  onRemoveConnection: (componentId: string, pinName: string, target: PinConnectionTarget) => void;
}

const IGNORED_PROPS = ['id', 'type', 'x', 'y'];

const NAMED_COLOR_MAP: Record<string, string> = {
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  violet: '#ee82ee',
  indigo: '#4b0082',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  grey: '#808080',
};

const HEX_6_REGEX = /^#([0-9a-f]{6})$/i;
const HEX_3_REGEX = /^#([0-9a-f]{3})$/i;

function normalizeColorValue(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return '#ffffff';
  }

  const trimmed = value.trim();

  if (HEX_6_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const shortMatch = trimmed.match(HEX_3_REGEX);
  if (shortMatch) {
    const expanded = shortMatch[1]
      .split('')
      .map((char) => char + char)
      .join('');
    return `#${expanded.toLowerCase()}`;
  }

  const mapped = NAMED_COLOR_MAP[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  return '#ffffff';
}

const formatConnectionTarget = (target: PinConnectionTarget): string => {
  const label = target.componentId === 'board' ? 'Board' : target.componentId;
  return `${label}:${target.pinName}`;
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ component, pins, connections, onUpdate, onDelete, onRemoveConnection }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'color') {
      finalValue = normalizeColorValue(value);
    }

    onUpdate(component.id, { [name]: finalValue });
  };

  const renderInputFor = (key: string, value: any) => {
    const inputClasses = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500";

    if (key === 'color') {
        const safeValue = normalizeColorValue(value);
        return (
            <input
                type="color"
                name={key}
                value={safeValue}
                onChange={handleInputChange}
                className="w-full h-8 p-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
            />
        );
    }

    if (typeof value === 'number') {
        return (
            <input
                type="number"
                name={key}
                value={value}
                onChange={handleInputChange}
                className={inputClasses}
            />
        );
    }

    return (
        <input
            type="text"
            name={key}
            value={value}
            onChange={handleInputChange}
            className={inputClasses}
        />
    );
  };

  const genericProps = Object.entries(component).filter(([key]) => !IGNORED_PROPS.includes(key));

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 h-full text-sm select-none">
      <div className="space-y-4">
        <div>
            <h3 className="font-bold text-base mb-2 capitalize">{component.type.replace('-', ' ')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {component.id}</p>
        </div>

        {genericProps.length > 0 && (
            <div>
                 <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Properties</h4>
                 <div className="space-y-2">
                    {genericProps.map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 items-center gap-2">
                        <label htmlFor={key} className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                            {key}
                        </label>
                        {renderInputFor(key, value)}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {pins && pins.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Pin Connections</h4>
          <div className="space-y-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
            {pins.map(pin => (
              <div key={pin.name} className="grid grid-cols-2 items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{pin.name}</span>
                <div className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-1">
                  {connections[pin.name] && connections[pin.name].length > 0 ? (
                    connections[pin.name].map((target, index) => (
                      <span
                        key={`${target.componentId}-${target.pinName}-${index}`}
                        className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-[11px] font-medium"
                      >
                        <span className="px-1.5 py-0.5">{formatConnectionTarget(target)}</span>
                        <button
                          type="button"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onRemoveConnection(component.id, pin.name, target);
                          }}
                          className="px-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-50"
                          aria-label={`Remove connection ${formatConnectionTarget(target)}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="italic opacity-70">Not Connected</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onDelete(component.id)}
        className="mt-6 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
      >
        Delete Component
      </button>
    </div>
  );
};
