import React from 'react';

export class ResistorElement extends HTMLElement {
  private _value: number = 1000;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['value'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'value') {
      this._value = parseFloat(newValue) || 1000;
    }
    this.render();
  }

  get value() {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
    this.setAttribute('value', val.toString());
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 60px;
          height: 20px;
        }
        .resistor {
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, 
            #8B4513 0%, #8B4513 15%,
            #D2691E 15%, #D2691E 85%,
            #8B4513 85%, #8B4513 100%
          );
          border: 1px solid #654321;
          border-radius: 3px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resistor::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 2px;
          background-color: #C0C0C0;
        }
        .resistor::after {
          content: '';
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 2px;
          background-color: #C0C0C0;
        }
        .value {
          font-size: 8px;
          color: white;
          font-weight: bold;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
      </style>
      <div class="resistor">
        <span class="value">${this.formatValue(this._value)}</span>
      </div>
    `;
  }

  private formatValue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'MΩ';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'kΩ';
    } else {
      return value + 'Ω';
    }
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-resistor': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
      };
    }
  }
}