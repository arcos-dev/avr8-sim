import React from 'react';

interface ComponentsPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({ isCollapsed, onToggle }) => {
  const componentCategories = {
    'Microcontroladores': [
      { name: 'Arduino Uno R3', tag: 'sim-arduino-uno', props: {} },
      { name: 'Arduino Nano', tag: 'sim-arduino-nano', props: {} },
      { name: 'ATtiny85', tag: 'sim-attiny85', props: {} },
    ],
    'LEDs e Displays': [
      { name: 'LED Vermelho', tag: 'sim-led', props: { color: 'red' } },
      { name: 'LED Verde', tag: 'sim-led', props: { color: 'green' } },
      { name: 'LED Azul', tag: 'sim-led', props: { color: 'blue' } },
      { name: 'LED Amarelo', tag: 'sim-led', props: { color: 'yellow' } },
      { name: 'LCD 16x2', tag: 'sim-lcd1602', props: {} },
    ],
    'Botões e Controles': [
      { name: 'Botão Push', tag: 'sim-pushbutton', props: { color: 'red' } },
      { name: 'Potenciômetro', tag: 'sim-potentiometer', props: {} },
      { name: 'Servo Motor', tag: 'sim-servo', props: {} },
    ],
    'Resistores': [
      { name: 'Resistor 220Ω', tag: 'sim-resistor', props: { value: 220 } },
      { name: 'Resistor 1kΩ', tag: 'sim-resistor', props: { value: 1000 } },
      { name: 'Resistor 10kΩ', tag: 'sim-resistor', props: { value: 10000 } },
    ],
    'Outros': [
      { name: 'Buzzer', tag: 'sim-buzzer', props: {} },
    ]
  };

  const [selectedCategory, setSelectedCategory] = React.useState<string>('LEDs e Displays');

  return (
    <div
      className={`components-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}
    >
      <div className="components-header">
        {!isCollapsed && <h2 className="components-title">Componentes</h2>}
        <button onClick={onToggle} className="panel-toggle-btn">
          {isCollapsed ? '>' : '<'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="components-content">
          {/* Seletor de Categoria */}
          <div className="category-selector">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {Object.keys(componentCategories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Lista de Componentes */}
          <div className="components-list">
            <div className="components-grid">
              {componentCategories[selectedCategory as keyof typeof componentCategories]?.map((component, index) => (
                <div
                  key={`${component.tag}-${component.name}-${index}`}
                  className="component-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('component/tag', component.tag);
                    e.dataTransfer.setData('component/props', JSON.stringify(component.props || {}));
                    e.dataTransfer.setData('component/name', component.name);
                  }}
                >
                  <div className="component-name">{component.name}</div>
                  <div className="component-tag">{component.tag}</div>
                  {Object.keys(component.props).length > 0 && (
                    <div className="component-props">
                      {Object.entries(component.props).map(([key, value]) => (
                        <span key={key} className="prop-item">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Contador de Componentes */}
          <div className="components-footer">
            {componentCategories[selectedCategory as keyof typeof componentCategories]?.length || 0} componentes em {selectedCategory}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentsPanel;
