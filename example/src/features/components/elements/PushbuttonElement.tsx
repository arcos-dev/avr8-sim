import React from 'react';

export class PushbuttonElement extends HTMLElement {
  private _pressed: boolean = false;
  private _color: string = 'red';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['pressed', 'color'];
  }

  connectedCallback() {
    this.render();
    this.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  handleMouseDown() {
    this._pressed = true;
    this.setAttribute('pressed', 'true');
    this.render();
  }

  handleMouseUp() {
    this._pressed = false;
    this.setAttribute('pressed', 'false');
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'pressed') {
      this._pressed = newValue === 'true' || newValue === '1';
    } else if (name === 'color') {
      this._color = newValue || 'red';
    }
    this.render();
  }

  get pressed() {
    return this._pressed;
  }

  set pressed(val: boolean) {
    this._pressed = val;
    this.setAttribute('pressed', val.toString());
  }

  render() {
    if (!this.shadowRoot) return;

    const isPressed = this._pressed;
    const color = this._color;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 40px;
          height: 40px;
          cursor: pointer;
          user-select: none;
        }
        .button {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          border: 3px solid #333;
          transform: ${isPressed ? 'scale(0.95)' : 'scale(1)'};
          box-shadow: ${isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'};
          transition: all 0.1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .button::after {
          content: '';
          width: 8px;
          height: 8px;
          background-color: rgba(255,255,255,0.3);
          border-radius: 50%;
          position: absolute;
          top: 8px;
          left: 12px;
        }
      </style>
      <div class="button"></div>
    `;
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-pushbutton': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pressed?: boolean | string;
        color?: string;
      };
    }
  }
}