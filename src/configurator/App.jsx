import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { useFurnitureStore } from './store';
import ParametricFurniture from './ParametricFurniture';

// Helper component for numeric input with stepper buttons
const NumberInput = ({ value, min, max, step = 1, onChange }) => {
  const handleDec = () => {
    if (value > min) onChange(Math.max(min, value - step));
  };
  const handleInc = () => {
    if (value < max) onChange(Math.min(max, value + step));
  };
  const handleChange = (e) => {
    let val = Number(e.target.value);
    if (!isNaN(val)) {
      // Clamp value
      val = Math.max(min, Math.min(max, val));
      onChange(val);
    }
  };

  return (
    <div className="numeric-stepper">
      <button onClick={handleDec}>-</button>
      <input type="number" min={min} max={max} step={step} value={value} onChange={handleChange} />
      <button onClick={handleInc}>+</button>
    </div>
  );
};

export default function App() {
  const {
    selectedModel,
    setSelectedModel,
    selectedTexture,
    setSelectedTexture,
    dresserConfig,
    closetConfig,
    tableConfig,
    updateDresser,
    updateCloset,
    updateTable
  } = useFurnitureStore();

  const handleExport = () => {
    let activeConfig;
    if (selectedModel === 'dresser') activeConfig = dresserConfig;
    if (selectedModel === 'closet') activeConfig = closetConfig;
    if (selectedModel === 'table') activeConfig = tableConfig;
    
    const exportData = {
      model: selectedModel,
      texture: selectedTexture,
      config: activeConfig
    };
    console.log("Configuración del modelo:", JSON.stringify(exportData, null, 2));
    alert("Diseño solicitado. Revisa la consola para ver el JSON exportado.");
  };

  const textures = [
    { id: 'blanco', name: 'Blanco', bg: "url('/textures/blanco.png')" },
    { id: 'roble', name: 'Roble', bg: "url('/textures/roble.png')" },
    { id: 'nogal', name: 'Nogal', bg: "url('/textures/nogal.png')" },
    { id: 'grafito', name: 'Gris Grafito', bg: "url('/textures/grafito.png')" }
  ];

  return (
    <div className="configurator-layout">
      {/* Sidebar Controls */}
      <div className="controls-panel">
        <div className="header-logo">
          <h2>Configurador 3D</h2>
          <p>Parametriza tu diseño</p>
        </div>
        
        {/* Model Selector */}
        <div className="model-selector">
          <button 
            className={`model-btn ${selectedModel === 'dresser' ? 'active' : ''}`}
            onClick={() => setSelectedModel('dresser')}
          >
            Cómoda
          </button>
          <button 
            className={`model-btn ${selectedModel === 'closet' ? 'active' : ''}`}
            onClick={() => setSelectedModel('closet')}
          >
            Clóset
          </button>
          <button 
            className={`model-btn ${selectedModel === 'table' ? 'active' : ''}`}
            onClick={() => setSelectedModel('table')}
          >
            Mesa
          </button>
        </div>

        {/* Texture Selector */}
        <div className="control-group">
          <label>Acabado (Melamina):</label>
          <div className="texture-selector">
            {textures.map(tex => (
              <div 
                key={tex.id}
                title={tex.name}
                className={`texture-swatch ${selectedTexture === tex.id ? 'active' : ''}`}
                style={{ backgroundImage: tex.bg }}
                onClick={() => setSelectedTexture(tex.id)}
              />
            ))}
          </div>
        </div>

        <hr className="divider" />

        {/* Dynamic Controls based on selectedModel */}
        {selectedModel === 'dresser' && (
          <>
            <div className="control-group">
              <label>Ancho (cm):</label>
              <NumberInput min={60} max={200} value={dresserConfig.width} onChange={val => updateDresser({ width: val })} />
            </div>
            <div className="control-group">
              <label>Alto (cm):</label>
              <NumberInput min={60} max={150} value={dresserConfig.height} onChange={val => updateDresser({ height: val })} />
            </div>
            <div className="control-group">
              <label>Profundidad (cm):</label>
              <NumberInput min={30} max={80} value={dresserConfig.depth} onChange={val => updateDresser({ depth: val })} />
            </div>
            <div className="control-group">
              <label>Cajones:</label>
              <NumberInput min={1} max={8} value={dresserConfig.numDrawers} onChange={val => updateDresser({ numDrawers: val })} />
            </div>
            <div className="control-group toggle-group">
              <label>
                <input type="checkbox" checked={dresserConfig.hasShoeBox}
                  onChange={(e) => updateDresser({ hasShoeBox: e.target.checked })} />
                Incluir Zapatera inferior
              </label>
            </div>
          </>
        )}

        {selectedModel === 'closet' && (
          <>
            <div className="control-group">
              <label>Ancho (cm):</label>
              <NumberInput min={100} max={400} value={closetConfig.width} onChange={val => updateCloset({ width: val })} />
            </div>
            <div className="control-group">
              <label>Alto (cm):</label>
              <NumberInput min={180} max={280} value={closetConfig.height} onChange={val => updateCloset({ height: val })} />
            </div>
            <div className="control-group">
              <label>Profundidad (cm):</label>
              <NumberInput min={40} max={100} value={closetConfig.depth} onChange={val => updateCloset({ depth: val })} />
            </div>
            <div className="control-group">
              <label>Puertas Grandes:</label>
              <NumberInput min={1} max={6} value={closetConfig.numLargeDoors} onChange={val => updateCloset({ numLargeDoors: val })} />
            </div>
            <div className="control-group">
              <label>Puertas Pequeñas (Base):</label>
              <NumberInput min={0} max={6} value={closetConfig.numSmallDoors} onChange={val => updateCloset({ numSmallDoors: val })} />
            </div>
          </>
        )}

        {selectedModel === 'table' && (
          <>
            <div className="control-group">
              <label>Forma de Mesa:</label>
              <div className="model-selector">
                <button 
                  className={`model-btn ${tableConfig.shape === 'rectangular' ? 'active' : ''}`}
                  onClick={() => updateTable({ shape: 'rectangular' })}
                >
                  Rectangular
                </button>
                <button 
                  className={`model-btn ${tableConfig.shape === 'round' ? 'active' : ''}`}
                  onClick={() => updateTable({ shape: 'round' })}
                >
                  Redonda
                </button>
                <button 
                  className={`model-btn ${tableConfig.shape === 'oval' ? 'active' : ''}`}
                  onClick={() => updateTable({ shape: 'oval' })}
                >
                  Ovalada
                </button>
              </div>
            </div>
            
            <div className="control-group">
              <label>Capacidad (personas):</label>
              <NumberInput min={2} max={12} step={2} value={tableConfig.capacity} onChange={val => updateTable({ capacity: val })} />
            </div>

            <div className="control-group">
              <label>Alto (cm):</label>
              <NumberInput min={40} max={110} value={tableConfig.height} onChange={val => updateTable({ height: val })} />
            </div>
            
            {tableConfig.shape === 'rectangular' && (
              <>
                <div className="control-group">
                  <label>Ancho (cm):</label>
                  <NumberInput min={80} max={300} value={tableConfig.width} onChange={val => updateTable({ width: val })} />
                </div>
                <div className="control-group">
                  <label>Profundidad (cm):</label>
                  <NumberInput min={60} max={150} value={tableConfig.depth} onChange={val => updateTable({ depth: val })} />
                </div>
              </>
            )}
          </>
        )}

        <button className="btn-export" onClick={handleExport}>
          Solicitar Diseño
        </button>
        
        <a href="/" className="back-link">← Volver al Inicio</a>
      </div>

      {/* 3D Canvas Area */}
      <div className="canvas-area">
        <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
          <color attach="background" args={['#0d110f']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <Suspense fallback={null}>
            <ParametricFurniture />
          </Suspense>
          
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={5} blur={2} far={4} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} />
        </Canvas>
      </div>
    </div>
  );
}
