import { create } from 'zustand';

export const useFurnitureStore = create((set) => ({
  selectedModel: 'dresser', // 'dresser', 'closet', 'table'
  selectedTexture: 'blanco', // 'blanco', 'roble', 'nogal', 'grafito'

  dresserConfig: {
    width: 100,
    height: 90,
    depth: 40,
    numDrawers: 4,
    hasShoeBox: false
  },

  closetConfig: {
    width: 150,
    height: 200,
    depth: 60,
    numLargeDoors: 3,
    numSmallDoors: 3
  },

  tableConfig: {
    shape: 'rectangular', // 'rectangular', 'round', 'oval'
    height: 75,
    capacity: 4,
    width: 120, 
    depth: 80   
  },

  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedTexture: (texture) => set({ selectedTexture: texture }),
  
  updateDresser: (updates) => set((state) => ({
    dresserConfig: { ...state.dresserConfig, ...updates }
  })),

  updateCloset: (updates) => set((state) => ({
    closetConfig: { ...state.closetConfig, ...updates }
  })),

  updateTable: (updates) => set((state) => ({
    tableConfig: { ...state.tableConfig, ...updates }
  }))
}));
