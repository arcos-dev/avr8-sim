import React from 'react';

export class ServoElement extends HTMLElement {
  private _angle: number = 90;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['angle'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'angle') {
      this._angle = Math.max(0, Math.min(180, parseFloat(newValue) || 90));
    }
    this.render();
  }

  get angle() {
    return this._angle;
  }

  set angle(val: number) {
    this._angle = Math.max(0, Math.min(180, val));
    this.setAttribute('angle', this._angle.toString());
  }

  render() {
    if (!this.shadowRoot) return;

    const rotation = this._angle - 90; // Converter para rotação CSS (-90 a +90)

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 60px;
          height: 40px;
        }
        .servo {
          width: 100%;
          height: 100%;
          background-color: #2c3e50;
          border: 2px solid #34495e;
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .servo-body {
          width: 80%;
          height: 60%;
          background-color: #34495e;
          border-radius: 2px;
          position: relative;
        }
        .servo-horn {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 16px;
          background-color: #ecf0f1;
          border-radius: 2px;
        }
        .servo-arm {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center;
          transform: translate(-50%, -50%) rotate(${rotation}deg);
          width: 2px;
          height: 15px;
          background-color: #e74c3c;
          border-radius: 1px;
        }
        .servo-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          background-color: #95a5a6;
          border-radius: 50%;
        }
        .angle-display {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          color: #2c3e50;
          font-weight: bold;
        }
      </style>
      <div class="servo">
        <div class="servo-body">
          <div class="servo-horn"></div>
          <div class="servo-arm"></div>
          <div class="servo-center"></div>
        </div>
        <div class="angle-display">${this._angle}°</div>
      </div>
    `;
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-servo': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pin?: string;
        angle?: string;
      };
    }
  }
}