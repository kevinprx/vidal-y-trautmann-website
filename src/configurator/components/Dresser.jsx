import React from 'react';
import { useFurnitureStore } from '../store';
import { useTexture, Edges } from '@react-three/drei';

export default function Dresser() {
  const { width, height, depth, numDrawers, hasShoeBox } = useFurnitureStore(state => state.dresserConfig);
  const selectedTexture = useFurnitureStore(state => state.selectedTexture);
  
  const texture = useTexture(`/textures/${selectedTexture}.png`);
  
  const gap = 0.002; 
  const w = width / 100;
  const h = height / 100;
  const d = depth / 100;
  const t = 0.018; 
  
  // Calculate spaces
  let shoeBoxHeight = 0;
  if (hasShoeBox) {
    shoeBoxHeight = h * 0.3;
  }
  
  const drawersAreaHeight = h - shoeBoxHeight;
  const drawerHeight = (drawersAreaHeight - t * 2 - (numDrawers + 1) * gap) / Math.max(1, numDrawers);
  
  return (
    <group position={[0, 0, 0]}>
      {/* Outer Frame */}
      {/* Top */}
      <mesh position={[0, h - t/2, 0]}>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, t/2, 0]}>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
      {/* Left Side */}
      <mesh position={[-w/2 + t/2, h/2, 0]}>
        <boxGeometry args={[t, h - t*2, d]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
      {/* Right Side */}
      <mesh position={[w/2 - t/2, h/2, 0]}>
        <boxGeometry args={[t, h - t*2, d]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>

      {/* Shoe box area door if active */}
      {hasShoeBox && (
        <mesh position={[0, shoeBoxHeight/2 + t, d/2 - t/2]}>
          <boxGeometry args={[w - t*2 - gap*2, shoeBoxHeight - gap*2, t]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
          <Edges scale={1} threshold={15} color="#1a1a1a" />
        </mesh>
      )}

      {/* Drawers using .map() */}
      {Array.from({ length: numDrawers }).map((_, index) => {
        // Calculate Y position from bottom up
        const yPos = shoeBoxHeight + t + gap + (drawerHeight/2) + (index * (drawerHeight + gap));
        return (
          <mesh key={`drawer-${index}`} position={[0, yPos, d/2 - t/2]}>
            <boxGeometry args={[w - t*2 - gap*2, drawerHeight, t]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
            <Edges scale={1} threshold={15} color="#1a1a1a" />
          </mesh>
        );
      })}
    </group>
  );
}
