import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function BrainMesh() {
  const meshRef = useRef(null);
  const wireRef = useRef(null);
  const edgesGeo = useMemo(() => new THREE.IcosahedronGeometry(1.73, 2), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.28;
      meshRef.current.rotation.x += delta * 0.08;
    }

    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.22;
      wireRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.75}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <icosahedronGeometry args={[1.55, 24]} />
        <MeshDistortMaterial
          color="#bd9dff"
          emissive="#8a4cfc"
          emissiveIntensity={0.45}
          roughness={0.12}
          metalness={0.32}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          distort={0.26}
          speed={1.4}
          envMapIntensity={1.1}
        />
      </mesh>

      <lineSegments ref={wireRef}>
        <edgesGeometry args={[edgesGeo]} />
        <lineBasicMaterial color="#ff97b2" transparent opacity={0.4} />
      </lineSegments>
    </Float>
  );
}
