import React from 'react';

export class BuzzerElement extends HTMLElement {
  private _active: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['active'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'active') {
      this._active = newValue === 'true' || newValue === '1';
    }
    this.render();
  }

  get active() {
    return this._active;
  }

  set active(val: boolean) {
    this._active = val;
    this.setAttribute('active', val.toString());
  }

  render() {
    if (!this.shadowRoot) return;

    const isActive = this._active;
    const vibration = isActive ? 'vibrate 0.1s infinite' : 'none';
    const glowColor = isActive ? '#f39c12' : 'none';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 30px;
          height: 30px;
        }
        .buzzer {
          width: 100%;
          height: 100%;
          background-color: #2c3e50;
          border: 2px solid #34495e;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ${vibration};
          box-shadow: ${isActive ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}` : 'none'};
        }
        .buzzer-center {
          width: 60%;
          height: 60%;
          background-color: #34495e;
          border: 1px solid #95a5a6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .buzzer-hole {
          width: 40%;
          height: 40%;
          background-color: #1a1a1a;
          border-radius: 50%;
        }
        .sound-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: ${isActive ? '1' : '0'};
          transition: opacity 0.2s ease;
        }
        .wave {
          position: absolute;
          border: 1px solid #f39c12;
          border-radius: 50%;
          animation: ${isActive ? 'wave-expand 0.5s infinite' : 'none'};
        }
        .wave:nth-child(1) {
          width: 40px;
          height: 40px;
          margin: -20px;
          animation-delay: 0s;
        }
        .wave:nth-child(2) {
          width: 50px;
          height: 50px;
          margin: -25px;
          animation-delay: 0.1s;
        }
        .wave:nth-child(3) {
          width: 60px;
          height: 60px;
          margin: -30px;
          animation-delay: 0.2s;
        }
        @keyframes vibrate {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        @keyframes wave-expand {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      </style>
      <div class="buzzer">
        <div class="buzzer-center">
          <div class="buzzer-hole"></div>
        </div>
        <div class="sound-waves">
          <div class="wave"></div>
          <div class="wave"></div>
          <div class="wave"></div>
        </div>
      </div>
    `;
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-buzzer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pin?: string;
        volume?: string;
      };
    }
  }
}