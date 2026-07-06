import React from 'react';
import { useFurnitureStore } from '../store';
import { useTexture, Edges } from '@react-three/drei';

export default function Closet() {
  const { width, height, depth, numLargeDoors, numSmallDoors } = useFurnitureStore(state => state.closetConfig);
  const selectedTexture = useFurnitureStore(state => state.selectedTexture);
  
  const texture = useTexture(`/textures/${selectedTexture}.png`);
  
  const gap = 0.002;
  const w = width / 100;
  const h = height / 100;
  const d = depth / 100;
  const t = 0.018; 
  
  // Determine heights
  let smallDoorHeight = 0;
  if (numSmallDoors > 0) {
    smallDoorHeight = h * 0.25; // Reserve 25% for small doors
  }
  
  const largeDoorHeight = h - smallDoorHeight - t * 2 - (numSmallDoors > 0 ? gap * 3 : gap * 2);
  const largeDoorWidth = (w - t * 2 - (numLargeDoors + 1) * gap) / Math.max(1, numLargeDoors);
  const smallDoorWidth = numSmallDoors > 0 ? (w - t * 2 - (numSmallDoors + 1) * gap) / numSmallDoors : 0;
  
  return (
    <group position={[0, 0, 0]}>
      {/* Outer Frame */}
      <mesh position={[0, h - t/2, 0]}><boxGeometry args={[w, t, d]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh>
      <mesh position={[0, t/2, 0]}><boxGeometry args={[w, t, d]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh>
      <mesh position={[-w/2 + t/2, h/2, 0]}><boxGeometry args={[t, h - t*2, d]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh>
      <mesh position={[w/2 - t/2, h/2, 0]}><boxGeometry args={[t, h - t*2, d]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh>

      {/* Large Doors using .map() across width */}
      {Array.from({ length: numLargeDoors }).map((_, index) => {
        const xPos = -w/2 + t + gap + (largeDoorWidth/2) + (index * (largeDoorWidth + gap));
        const yPos = smallDoorHeight > 0 
          ? smallDoorHeight + t + gap*2 + (largeDoorHeight/2)
          : t + gap + (largeDoorHeight/2);
          
        return (
          <mesh key={`large-${index}`} position={[xPos, yPos, d/2 - t/2]}>
            <boxGeometry args={[largeDoorWidth, largeDoorHeight, t]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
            <Edges scale={1} threshold={15} color="#1a1a1a" />
          </mesh>
        );
      })}

      {/* Small lower doors using .map() across width */}
      {numSmallDoors > 0 && Array.from({ length: numSmallDoors }).map((_, index) => {
        const xPos = -w/2 + t + gap + (smallDoorWidth/2) + (index * (smallDoorWidth + gap));
        const yPos = t + gap + (smallDoorHeight - gap*2)/2;
        return (
          <mesh key={`small-${index}`} position={[xPos, yPos, d/2 - t/2]}>
            <boxGeometry args={[smallDoorWidth, smallDoorHeight - gap*2, t]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
            <Edges scale={1} threshold={15} color="#1a1a1a" />
          </mesh>
        );
      })}
    </group>
  );
}
