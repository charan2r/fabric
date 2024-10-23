/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { fabric } from 'fabric';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rnd } from 'react-rnd';
import './App.css';
import TextComponent from './components/TextComponent';
import CheckBoxComponent from './components/CheckBoxComponent';

const ItemTypes = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  NEW_TEXT: 'newText',
  NEW_CHECKBOX: 'newCheckbox',
};

// Page size dimensions
const pageSizes = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
};

// Sidebar component
function SidebarItem({ type, label }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { label, type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="sidebar-item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: 'lightblue',
        padding: '10px',
        marginBottom: '10px',
        cursor: 'grab',
      }}
    >
      {label}
    </div>
  );
}

// Canvas area for draggable components
function CanvasArea({ onDrop, children, pageSize }) {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.TEXTAREA, ItemTypes.CHECKBOX, ItemTypes.RADIO, ItemTypes.NEW_TEXT, ItemTypes.NEW_CHECKBOX],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const x = offset.x;
      const y = offset.y;
      onDrop(x, y, item.type);
    },
  }));

  return (
    <div
      className="canvas-area"
      ref={drop}
      style={{
        width: `${pageSizes[pageSize].width}px`,
        height: `${pageSizes[pageSize].height}px`,
        backgroundColor: '#fafafa',
        border: '2px solid #007bff',
        borderRadius: '10px',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}

// Draggable input component
function DraggableInput({ type, left, top, width, height, onResizeStop, onDragStop }) {
  const [question, setQuestion] = useState('Question');
  const [options, setOptions] = useState([{ id: 1, text: 'Option 1' }]);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const addOption = () => {
    setOptions([...options, { id: options.length + 1, text: `Option ${options.length + 1}` }]);
  };

  const handleOptionChange = (index, text) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = text;
    setOptions(updatedOptions);
  };

  const inputTypes = {
    [ItemTypes.TEXT]: <input type="text" value="Non-editable Question" readOnly style={{ width: '100%' }} />,
    [ItemTypes.TEXTAREA]: <textarea value="Non-editable Answer Text" readOnly style={{ width: '100%', height: '100%' }} />,
    [ItemTypes.CHECKBOX]: <label><input type="checkbox" disabled /> Checkbox</label>,
    [ItemTypes.RADIO]: <label><input type="radio" disabled /> Radio Button</label>,
    [ItemTypes.NEW_TEXT]: (
      <div>
        <TextComponent />
        <input
          type="text"
          value={question}
          onChange={handleQuestionChange}
          style={{ width: '100%', marginBottom: '20px', fontSize: '1.2em', marginTop: '10px' }}
        />
        {options.map((option, index) => (
          <input
            key={option.id}
            type="text"
            value={option.text}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            style={{ width: '90%', marginBottom: '10px' }}
            placeholder={`Option ${index + 1}`}
          />
        ))}
        <button
          onClick={addOption}
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Add Option
        </button>
      </div>
    ),
    [ItemTypes.NEW_CHECKBOX]: <CheckBoxComponent />,
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
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
    >
      <div style={{ backgroundColor: 'white', padding: '5px', border: '1px solid black', borderRadius: '4px' }}>
        {inputTypes[type]}
      </div>
    </Rnd>
  );
}

function App() {
  const [components, setComponents] = useState([]);
  const [pageSize, setPageSize] = useState('A4');
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const scale = pageSizes[pageSize].width / pageSizes['A4'].width; 
    setScaleFactor(scale);
  }, [pageSize]);

  const handleDrop = (x, y, type) => {
    const newComponent = {
      id: components.length + 1,
      type,
      x: x / scaleFactor,
      y: y / scaleFactor,
      width: type === ItemTypes.TEXTAREA ? 300 : 150,
      height: type === ItemTypes.TEXTAREA ? 100 : 40,
    };
    setComponents((prevComponents) => [...prevComponents, newComponent]);
  };

  const updateComponentPosition = (id, x, y) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, x: x / scaleFactor, y: y / scaleFactor } : comp))
    );
  };

  const updateComponentSize = (id, width, height) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, width: width / scaleFactor, height: height / scaleFactor } : comp))
    );
  };

  const saveLayout = () => {
    localStorage.setItem('canvasComponents', JSON.stringify(components));
    alert('Layout saved!');
  };

  const loadLayout = () => {
    const savedComponents = localStorage.getItem('canvasComponents');
    if (savedComponents) {
      setComponents(JSON.parse(savedComponents));
    }
  };

  const handlePrint = (pageSize) => {
    const canvasContent = document.querySelector('.canvas-area').innerHTML;
  
    const pageDimensions = {
      A4: { width: 595, height: 842 },
      A3: { width: 842, height: 1191 },
    };
  
    const { width, height } = pageDimensions[pageSize] || pageDimensions.A4;
  
    const printWindow = window.open('', '', `width=${width},height=${height}`); 
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Layout</title>
          <style>
            
            @page {
              size: ${pageSize}; 
              margin: 0;
            }
  
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
            }
  
            .canvas-area {
              width: ${width}px;
              height: ${height}px;
              display: block;
              page-break-after: always;
            }
  
            
          </style>
        </head>
        <body>
          <div class="canvas-area">
            ${canvasContent}
          </div>
        </body>
      </html>
    `);
  
    printWindow.document.close(); 
    printWindow.focus(); 
  
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close(); 
    }, 500);
  };
  
  
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="sidebar">
          <h3>Sidebar</h3>
          <SidebarItem type={ItemTypes.TEXT} label="Question" />
          <SidebarItem type={ItemTypes.TEXTAREA} label="Answer Text" />
          <SidebarItem type={ItemTypes.RADIO} label="Radio Button" />
          <SidebarItem type={ItemTypes.NEW_TEXT} label="New Text" />
          <SidebarItem type={ItemTypes.NEW_CHECKBOX} label="New Checkbox" />

          <div className="page-size-selector">
            <label htmlFor="pageSize">Page Size: </label>
            <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              {Object.keys(pageSizes).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <button onClick={saveLayout}>Save Layout</button>
          <button onClick={loadLayout}>Load Layout</button>
          <button onClick={() => handlePrint(pageSize)}>Print Layout</button>

        </div>

        <CanvasArea onDrop={handleDrop} pageSize={pageSize}>
          {components.map((comp) => (
            <DraggableInput
              key={comp.id}
              type={comp.type}
              left={comp.x * scaleFactor}
              top={comp.y * scaleFactor}
              width={comp.width * scaleFactor}
              height={comp.height * scaleFactor}
              onDragStop={(e, d) => updateComponentPosition(comp.id, d.x, d.y)}
              onResizeStop={(e, direction, ref, delta, position) =>
                updateComponentSize(comp.id, ref.offsetWidth, ref.offsetHeight)
              }
            />
          ))}
        </CanvasArea>
      </div>
    </DndProvider>
  );
}

export default App;
