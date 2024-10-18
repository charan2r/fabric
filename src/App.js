/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rnd } from 'react-rnd'; 
import './App.css';

const ItemTypes = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
};

function SidebarItem({ type, label, disabled }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { label, type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !disabled,
  }));

  return (
    <div
      ref={drag}
      className="sidebar-item"
      style={{
        opacity: isDragging || disabled ? 0.5 : 1,
        backgroundColor: disabled ? 'gray' : 'lightblue',
        padding: '10px',
        marginBottom: '10px',
        cursor: disabled ? 'not-allowed' : 'grab',
      }}
    >
      {label}
    </div>
  );
}

function CanvasArea({ onDrop, children }) {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.TEXTAREA, ItemTypes.CHECKBOX, ItemTypes.RADIO],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = document.getElementById('canvas-container').getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;
      onDrop(x, y, item.type);
    },
  }));

  return (
    <div className="canvas-container" ref={drop} id="canvas-container" style={{ position: 'relative', width: '800px', height: '600px', border: '1px solid black' }}>
      {children}
    </div>
  );
}

function DraggableInput({ type, left, top, width, height, onResizeStop, onDragStop }) {
  const inputTypes = {
    [ItemTypes.TEXT]: <input type="text" placeholder="Question" style={{ width: '100%' }} />,
    [ItemTypes.TEXTAREA]: <textarea placeholder="Answer Text" style={{ width: '100%', height: '100%' }} />,
    [ItemTypes.CHECKBOX]: <label><input type="checkbox" /> Checkbox</label>,
    [ItemTypes.RADIO]: <label><input type="radio" /> Radio Button</label>,
  };

  return (
    <Rnd
      default={{
        x: left,
        y: top,
        width: width,
        height: height,
      }}
      bounds="parent"
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
    >
      <div style={{ backgroundColor: 'white', padding: '5px', border: '1px solid black', borderRadius: '4px' }}>
        {inputTypes[type]}
      </div>
    </Rnd>
  );
}

function App() {
  const [components, setComponents] = useState([]);

  // Handles the drop of a new component
  const handleDrop = (x, y, type) => {
    const newComponent = {
      id: components.length + 1, 
      type,
      x,
      y,
      width: type === ItemTypes.TEXTAREA ? 300 : 150,
      height: type === ItemTypes.TEXTAREA ? 100 : 40,
    };
    setComponents((prevComponents) => [...prevComponents, newComponent]); 
  };

  const updateComponentPosition = (id, x, y) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, x, y } : comp))
    );
  };

  const updateComponentSize = (id, width, height) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, width, height } : comp))
    );
  };

  // Save layout as JSON
  const saveLayout = () => {
    localStorage.setItem('canvasComponents', JSON.stringify(components));
    alert('Layout saved!');
  };

  // Load layout from JSON
  const loadLayout = () => {
    const savedComponents = localStorage.getItem('canvasComponents');
    if (savedComponents) {
      setComponents(JSON.parse(savedComponents));
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="sidebar">
          <h3>Sidebar</h3>
          <SidebarItem type={ItemTypes.TEXT} label="Question" />
          <SidebarItem type={ItemTypes.TEXTAREA} label="Answer Text" />
          <SidebarItem type={ItemTypes.CHECKBOX} label="Checkbox" />
          <SidebarItem type={ItemTypes.RADIO} label="Radio Button" />
          <button onClick={saveLayout}>Save Layout</button>
          <button onClick={loadLayout}>Load Layout</button>
        </div>
        <div className="canvas-section">
          <h3>Canvas Area</h3> 
          <CanvasArea onDrop={handleDrop}>
            {components.map((comp) => (
              <DraggableInput
                key={comp.id}
                type={comp.type}
                left={comp.x}
                top={comp.y}
                width={comp.width}
                height={comp.height}
                onDragStop={(e, d) => updateComponentPosition(comp.id, d.x, d.y)}
                onResizeStop={(e, direction, ref, delta, position) =>
                  updateComponentSize(comp.id, ref.offsetWidth, ref.offsetHeight)
                }
              />
            ))}
          </CanvasArea>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
