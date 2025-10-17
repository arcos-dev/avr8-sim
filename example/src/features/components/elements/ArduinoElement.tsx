import React from 'react';

export class ArduinoElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 120px;
          height: 80px;
        }
        .arduino {
          width: 100%;
          height: 100%;
          background-color: #006699;
          border: 2px solid #004466;
          border-radius: 4px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .label {
          color: white;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
        }
        .pins {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .pin-row {
          position: absolute;
          display: flex;
          gap: 2px;
        }
        .pin-row.top {
          top: -3px;
          left: 10px;
          right: 10px;
        }
        .pin-row.bottom {
          bottom: -3px;
          left: 10px;
          right: 10px;
        }
        .pin {
          width: 3px;
          height: 6px;
          background-color: #333;
          border-radius: 1px;
        }
      </style>
      <div class="arduino">
        <div class="label">ARDUINO<br>UNO</div>
        <div class="pins">
          <div class="pin-row top">
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
          </div>
          <div class="pin-row bottom">
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
            <div class="pin"></div>
          </div>
        </div>
      </div>
    `;
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-arduino-uno': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-arduino-nano': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-arduino-mega': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-esp32-devkit-v1': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-pi-pico': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-attiny85': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-breadboard-half': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-breadboard-mini': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'sim-breadboard-full': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}