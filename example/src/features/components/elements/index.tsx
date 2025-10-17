import React, { useEffect } from 'react';

// Importar todos os elementos
import { LEDElement } from './LEDElement';
import { PushbuttonElement } from './PushbuttonElement';
import { ResistorElement } from './ResistorElement';
import { ArduinoElement } from './ArduinoElement';
import { LCDElement } from './LCDElement';
import { ServoElement } from './ServoElement';
import { PotentiometerElement } from './PotentiometerElement';
import { BuzzerElement } from './BuzzerElement';

// Exportar todos os elementos (classes)
export {
  LEDElement,
  PushbuttonElement,
  ResistorElement,
  ArduinoElement,
  LCDElement,
  ServoElement,
  PotentiometerElement,
  BuzzerElement,
};

// Componentes React wrapper para Fast Refresh
export const LED = React.memo(() => null);
export const Pushbutton = React.memo(() => null);
export const Resistor = React.memo(() => null);
export const Arduino = React.memo(() => null);
export const LCD = React.memo(() => null);
export const Servo = React.memo(() => null);
export const Potentiometer = React.memo(() => null);
export const Buzzer = React.memo(() => null);

// Configuração de registro dos elementos
const elementsToRegister = [
  // Elementos customizados do simulador
  { name: 'sim-led', class: LEDElement },
  { name: 'sim-pushbutton', class: PushbuttonElement },
  { name: 'sim-resistor', class: ResistorElement },
  { name: 'sim-arduino-uno', class: ArduinoElement },
  { name: 'sim-arduino-nano', class: ArduinoElement },
  { name: 'sim-arduino-mega', class: ArduinoElement },
  { name: 'sim-esp32-devkit-v1', class: ArduinoElement },
  { name: 'sim-pi-pico', class: ArduinoElement },
  { name: 'sim-attiny85', class: ArduinoElement },
  { name: 'sim-breadboard-half', class: ArduinoElement },
  { name: 'sim-breadboard-mini', class: ArduinoElement },
  { name: 'sim-breadboard-full', class: ArduinoElement },
  { name: 'sim-lcd1602', class: LCDElement },
  { name: 'sim-servo', class: ServoElement },
  { name: 'sim-potentiometer', class: PotentiometerElement },
  { name: 'sim-buzzer', class: BuzzerElement },
];

// Flag global para evitar registros duplicados
let elementsRegistered = false;

export const ElementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (elementsRegistered) return;

    // Garantir que todos os elementos estão registrados
    elementsToRegister.forEach(({ name, class: ElementClass }) => {
      try {
        if (!customElements.get(name)) {
          customElements.define(name, ElementClass);
          // Custom element registered
        }
      } catch {
          // Ignorar erros de registro duplicado
          // Element already registered
        }
    });

    elementsRegistered = true;
    // All custom elements registered
  }, []);

  return <>{children}</>;
};