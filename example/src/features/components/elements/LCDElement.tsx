import React from 'react';

export class LCDElement extends HTMLElement {
  private _text: string = '';
  private _backlight: boolean = true;
  private _cursor: boolean = false;
  private _blink: boolean = false;
  private _characters: Uint8Array = new Uint8Array(32);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Inicializar com espaços em branco
    this._characters.fill(32); // 32 = código ASCII para espaço
  }

  static get observedAttributes() {
    return ['text', 'backlight', 'cursor', 'blink'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'text') {
      this._text = newValue || '';
      this.updateCharacters();
    } else if (name === 'backlight') {
      this._backlight = newValue === 'true' || newValue === '1';
    } else if (name === 'cursor') {
      this._cursor = newValue === 'true' || newValue === '1';
    } else if (name === 'blink') {
      this._blink = newValue === 'true' || newValue === '1';
    }
    this.render();
  }

  get characters() {
    return this._characters;
  }

  set characters(value: Uint8Array) {
    this._characters = value;
    this.render();
  }

  get backlight() {
    return this._backlight;
  }

  set backlight(value: boolean) {
    this._backlight = value;
    this.setAttribute('backlight', value.toString());
  }

  get cursor() {
    return this._cursor;
  }

  set cursor(value: boolean) {
    this._cursor = value;
    this.setAttribute('cursor', value.toString());
  }

  get blink() {
    return this._blink;
  }

  set blink(value: boolean) {
    this._blink = value;
    this.setAttribute('blink', value.toString());
  }

  private updateCharacters() {
    // Limpar array
    this._characters.fill(32);
    
    // Converter texto para códigos ASCII
    for (let i = 0; i < Math.min(this._text.length, 32); i++) {
      this._characters[i] = this._text.charCodeAt(i);
    }
  }

  render() {
    if (!this.shadowRoot) return;

    try {
      const backgroundColor = this._backlight ? '#4a90e2' : '#1a1a1a';
      const textColor = this._backlight ? '#000' : '#4a90e2';
      
      // Converter caracteres para texto
      let displayText = '';
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
          const index = row * 16 + col;
          const charCode = this._characters[index];
          displayText += String.fromCharCode(charCode);
        }
        if (row === 0) displayText += '\n';
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 160px;
            height: 60px;
          }
          .lcd {
            width: 100%;
            height: 100%;
            background-color: ${backgroundColor};
            border: 3px solid #333;
            border-radius: 4px;
            padding: 8px;
            box-sizing: border-box;
            font-family: 'Courier New', monospace;
            font-size: 8px;
            color: ${textColor};
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .row {
            height: 50%;
            display: flex;
            align-items: center;
            white-space: pre;
            letter-spacing: 1px;
          }
          .cursor {
            animation: ${this._blink ? 'blink 1s infinite' : 'none'};
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        </style>
        <div class="lcd">
          <div class="row">${displayText.substring(0, 16)}</div>
          <div class="row">${displayText.substring(17, 33)}</div>
        </div>
      `;
    } catch {
        // Error rendering LCD
      // Renderizar um display básico em caso de erro
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 160px;
            height: 60px;
          }
          .lcd {
            width: 100%;
            height: 100%;
            background-color: #4a90e2;
            border: 3px solid #333;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            color: #000;
          }
        </style>
        <div class="lcd">LCD 16x2</div>
      `;
    }
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-lcd1602': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        pins?: string;
        i2c?: string;
        address?: string;
      };
    }
  }
}