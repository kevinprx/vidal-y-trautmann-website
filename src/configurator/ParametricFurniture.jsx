import React from 'react';
import { useFurnitureStore } from './store';
import Dresser from './components/Dresser';
import Closet from './components/Closet';
import Table from './components/Table';

export default function ParametricFurniture() {
  const selectedModel = useFurnitureStore((state) => state.selectedModel);

  return (
    <group>
      {selectedModel === 'dresser' && <Dresser />}
      {selectedModel === 'closet' && <Closet />}
      {selectedModel === 'table' && <Table />}
    </group>
  );
}
