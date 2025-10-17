import React from 'react';

export class PotentiometerElement extends HTMLElement {
  private _value: number = 50;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['value'];
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', this.handleClick.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick.bind(this));
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'value') {
      this._value = Math.max(0, Math.min(100, parseFloat(newValue) || 50));
    }
    this.render();
  }

  get value() {
    return this._value;
  }

  set value(val: number) {
    this._value = Math.max(0, Math.min(100, val));
    this.setAttribute('value', this._value.toString());
  }

  handleClick(event: MouseEvent) {
    const rect = this.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    
    let angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    angle = (angle + 360) % 360;
    
    // Converter ângulo para valor (0-100)
    // Assumindo que 0° = valor máximo, 180° = valor mínimo
    const value = Math.round(100 - (angle / 360) * 100);
    this.value = value;
    
    // Disparar evento personalizado
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this._value },
      bubbles: true
    }));
  }

  render() {
    if (!this.shadowRoot) return;

    const rotation = (100 - this._value) * 2.7; // 270 graus de rotação total

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 40px;
          height: 40px;
          cursor: pointer;
        }
        .potentiometer {
          width: 100%;
          height: 100%;
          background-color: #34495e;
          border: 2px solid #2c3e50;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pot-body {
          width: 80%;
          height: 80%;
          background-color: #95a5a6;
          border-radius: 50%;
          position: relative;
        }
        .pot-knob {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(${rotation}deg);
          width: 60%;
          height: 60%;
          background-color: #ecf0f1;
          border: 1px solid #bdc3c7;
          border-radius: 50%;
        }
        .pot-indicator {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 20%;
          background-color: #e74c3c;
          border-radius: 1px;
        }
        .value-display {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          color: #2c3e50;
          font-weight: bold;
        }
      </style>
      <div class="potentiometer">
        <div class="pot-body">
          <div class="pot-knob">
            <div class="pot-indicator"></div>
          </div>
        </div>
        <div class="value-display">${this._value}%</div>
      </div>
    `;
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-potentiometer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pin?: string;
        value?: string;
      };
    }
  }
}