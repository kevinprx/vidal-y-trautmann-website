import React from 'react';
import { useFurnitureStore } from '../store';
import { useTexture, Edges } from '@react-three/drei';

export default function Table() {
  const { shape, height, capacity, width, depth } = useFurnitureStore(state => state.tableConfig);
  const selectedTexture = useFurnitureStore(state => state.selectedTexture);
  
  const texture = useTexture(`/textures/${selectedTexture}.png`);
  
  const h = height / 100;
  const t = 0.04; // 4cm thick table top
  
  // Calculate size mathematically based on capacity (approx 60cm perimeter per person)
  const perimeter = capacity * 0.6;
  
  let topMesh, legsMesh;

  if (shape === 'round') {
    const radius = Math.max(0.4, perimeter / (2 * Math.PI));
    topMesh = (
      <mesh position={[0, h - t/2, 0]}>
        <cylinderGeometry args={[radius, radius, t, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    );
    legsMesh = (
      <mesh position={[0, (h-t)/2, 0]}>
        <cylinderGeometry args={[radius * 0.2, radius * 0.3, h - t, 32]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
        <Edges scale={1} threshold={15} color="#1a1a1a" />
      </mesh>
    );
  } else if (shape === 'oval') {
    const baseRadius = Math.max(0.4, perimeter / (2 * Math.PI * 1.25));
    topMesh = (
      <mesh position={[0, h - t/2, 0]} scale={[1.5, 1, 1]}>
        <cylinderGeometry args={[baseRadius, baseRadius, t, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    );
    legsMesh = (
      <mesh position={[0, (h-t)/2, 0]} scale={[1.2, 1, 0.8]}>
        <cylinderGeometry args={[baseRadius * 0.3, baseRadius * 0.4, h - t, 32]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
        <Edges scale={1} threshold={15} color="#1a1a1a" />
      </mesh>
    );
  } else {
    // Rectangular
    const minLength = (capacity / 2) * 0.6;
    const w = Math.max(width / 100, minLength);
    const d = depth / 100;
    
    topMesh = (
      <mesh position={[0, h - t/2, 0]}>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    );
    
    // 4 Corner Legs
    const legW = 0.08; 
    const dx = w/2 - legW/2 - 0.02; 
    const dz = d/2 - legW/2 - 0.02;
    legsMesh = (
      <group>
        {[
          [dx, dz], [dx, -dz], [-dx, dz], [-dx, -dz]
        ].map(([px, pz], i) => (
          <mesh key={`leg-${i}`} position={[px, (h-t)/2, pz]}>
            <boxGeometry args={[legW, h - t, legW]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
            <Edges scale={1} threshold={15} color="#1a1a1a" />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      {topMesh}
      {legsMesh}
    </group>
  );
}
