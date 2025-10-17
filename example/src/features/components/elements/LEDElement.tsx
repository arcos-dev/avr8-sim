import React from 'react';

export class LEDElement extends HTMLElement {
  private _value: boolean = false;
  private _color: string = 'red';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['value', 'color'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'value') {
      this._value = newValue === 'true' || newValue === '1';
    } else if (name === 'color') {
      this._color = newValue || 'red';
    }
    this.render();
  }

  get value() {
    return this._value;
  }

  set value(val: boolean) {
    this._value = val;
    this.setAttribute('value', val.toString());
  }

  get color() {
    return this._color;
  }

  set color(val: string) {
    this._color = val;
    this.setAttribute('color', val);
  }

  private fadeOutAnimation?: Animation;
  private isAnimating = false;
  private lastState = false;

  render() {
    if (!this.shadowRoot) return;

    const isOn = this._value;
    const color = this._color;

    const colorMap: { [key: string]: { on: string; off: string; border: string } } = {
      red: { on: '#ff4444', off: '#442222', border: '#330a0a' }, // Borda vermelha escura
      green: { on: '#44ff44', off: '#224422', border: '#082208' }, // Borda verde escura
      blue: { on: '#0088ff', off: '#224477', border: '#002244' }, // Borda azul escura
      yellow: { on: '#ffff44', off: '#444422', border: '#222208' }, // Borda amarela escura
      white: { on: '#ffffff', off: '#2a2a2a', border: '#1a1a1a' },
    }

    const colors = colorMap[color] || colorMap.red;

    // Create or update the LED element
    if (!this.shadowRoot.querySelector('.led')) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 20px;
            height: 20px;
          }
          .led {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid ${colors.border};
            position: relative;
            background-color: ${colors.off};
          }
          .led-core {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: ${colors.off};
            transition: none;
          }
        </style>
        <div class="led">
          <div class="led-core"></div>
        </div>
      `;
    }

    const ledCore = this.shadowRoot.querySelector('.led-core') as HTMLElement;
    if (!ledCore) return;

    // Só animar se o estado mudou
    if (isOn !== this.lastState) {
      this.lastState = isOn;
      
      // Cancel any ongoing animation
      if (this.fadeOutAnimation) {
        this.fadeOutAnimation.cancel();
        this.fadeOutAnimation = undefined;
      }

      if (isOn) {
        // LED ligando: pulso único de 0 a 100% em 25ms
        this.isAnimating = true;
        
        // Animação realista de ligamento: apagado para 100% em 25ms
         const fadeInAnimation = ledCore.animate([
           {
             backgroundColor: colors.off,
             boxShadow: 'none',
             filter: 'brightness(1)'
           },
           {
             backgroundColor: colors.on,
             boxShadow: `0 0 8px ${colors.on}, 0 0 15px ${colors.on}`,
             filter: 'brightness(1)'
           }
         ], {
           duration: 25,
           easing: 'ease-out',
           fill: 'forwards'
         });
        
        fadeInAnimation.onfinish = () => {
          this.isAnimating = false;
        }
      } else {
        // LED desligando: fade suave simulando descarga do capacitor
        if (!this.isAnimating) {
          this.isAnimating = true;
          
          // Animação realista de desligamento: 100% para apagado em 200ms
          this.fadeOutAnimation = ledCore.animate([
            {
              backgroundColor: colors.on,
              boxShadow: `0 0 8px ${colors.on}, 0 0 15px ${colors.on}`,
              filter: 'brightness(1)'
            },
            {
              backgroundColor: colors.off,
              boxShadow: 'none',
              filter: 'brightness(1)'
            }
          ], {
            duration: 200,
            easing: 'ease-in',
            fill: 'forwards'
          });

          this.fadeOutAnimation.onfinish = () => {
            this.isAnimating = false;
            this.fadeOutAnimation = undefined;
          };
        }
      }
    }
  }
}

// Declarações TypeScript para o elemento
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sim-led': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        color?: string;
        pin?: string;
        value?: boolean;
      };
    }
  }
}