# Module 6 — 3D Bonus (Three.js / React Three Fiber)

## Overview
Add an interactive 3D element to the landing/onboarding page using **React Three Fiber** and **@react-three/drei**.
This is the visual showpiece that impresses evaluators — a floating, glowing 3D mesh users can drag and rotate.

---

## Tech Stack

| Layer | Tool |
|---|---|
| 3D Rendering | React Three Fiber (`@react-three/fiber`) |
| Helpers | `@react-three/drei` (Float, Stars, OrbitControls) |
| Base Library | Three.js (auto-installed with R3F) |
| Animation | `useFrame` hook (R3F built-in) |
| Performance | `Suspense` + lazy canvas loading |

---

## Folder Structure

```
/src
  /components
    /three
      Scene.jsx           ← main 3D scene
      BrainMesh.jsx       ← the 3D object (brain / torus / icosahedron)
      ParticleField.jsx   ← optional floating particles
  /pages
    Onboarding.jsx        ← imports Canvas + Scene
```

---

## Step 1 — Install Packages

```bash
npm install three @react-three/fiber @react-three/drei
```

Verify versions in `package.json`:
```json
{
  "three": "^0.162.0",
  "@react-three/fiber": "^8.16.0",
  "@react-three/drei": "^9.105.0"
}
```

---

## Step 2 — Brain/Orb Mesh Component

This is the main 3D object — an icosahedron (brain-like polyhedron) with a wireframe overlay
and slow rotation + floating animation.

**File:** `src/components/three/BrainMesh.jsx`

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

export default function BrainMesh() {
  const meshRef = useRef();

  // Rotate slowly every frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Float
      speed={2}             // float animation speed
      rotationIntensity={0.4}
      floatIntensity={0.8}
    >
      <group>
        {/* Main solid mesh */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.4, 1]} />
          <MeshDistortMaterial
            color="#7c3aed"
            emissive="#4c1d95"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
            distort={0.3}
            speed={2}
          />
        </mesh>

        {/* Wireframe overlay */}
        <mesh>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial
            color="#a78bfa"
            wireframe={true}
            transparent={true}
            opacity={0.25}
          />
        </mesh>

        {/* Outer glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.9, 0.015, 16, 100]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}
```

---

## Step 3 — Particle Field (Stars Background)

**File:** `src/components/three/ParticleField.jsx`

```jsx
import { Stars } from '@react-three/drei';

export default function ParticleField() {
  return (
    <Stars
      radius={80}       // sphere radius
      depth={50}        // depth of stars
      count={3000}      // number of stars
      factor={4}        // star size factor
      saturation={0}    // grayscale stars
      fade={true}       // fade at edges
      speed={0.5}       // slow drift
    />
  );
}
```

---

## Step 4 — Full 3D Scene

**File:** `src/components/three/Scene.jsx`

```jsx
import { Suspense } from 'react';
import { Canvas }   from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import BrainMesh    from './BrainMesh';
import ParticleField from './ParticleField';

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}    // transparent background
      style={{ background: 'transparent' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}  intensity={1.5} color="#a78bfa" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#7c3aed" />

      {/* Scene content */}
      <Suspense fallback={null}>
        <ParticleField />
        <BrainMesh />
        <Environment preset="city" />
      </Suspense>

      {/* Drag-to-orbit interaction */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />
    </Canvas>
  );
}
```

---

## Step 5 — Integrate into Onboarding Page

**File:** `src/pages/Onboarding.jsx` (updated with 3D)

```jsx
import { Suspense, lazy } from 'react';
import { motion }     from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Lazy-load the 3D scene so it doesn't block the page
const Scene = lazy(() => import('../components/three/Scene'));

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center min-h-screen max-w-6xl mx-auto px-6">

        {/* Left — Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x:  0  }}
          transition={{ duration: 0.7 }}
          className="flex-1 z-10 py-20 md:py-0"
        >
          <div className="inline-block bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
            AI-powered learning
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Your personal<br />
            <span className="text-purple-400">AI Tutor</span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
            Ask questions, take quizzes, generate assignments.
            Powered by cutting-edge AI and built for real learning.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['AI Chat', 'Smart Quizzes', 'PDF Assignments', 'RAG-Powered'].map(f => (
              <span key={f} className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-full border border-gray-700">
                {f}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl font-medium transition text-sm"
            >
              Start learning free
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-6 py-3.5 rounded-xl transition text-sm"
            >
              Sign in
            </button>
          </div>
        </motion.div>

        {/* Right — 3D Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1  }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex-1 h-[500px] md:h-screen relative"
        >
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Scene />
          </Suspense>

          {/* Overlay hint */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-600 text-xs">
            drag to rotate
          </p>
        </motion.div>

      </div>
    </div>
  );
}
```

---

## Step 6 — Performance Optimizations

### Reduce canvas quality on mobile

**File:** `src/components/three/Scene.jsx` (add dpr setting)

```jsx
<Canvas
  camera={{ position: [0, 0, 5], fov: 50 }}
  gl={{ antialias: true, alpha: true }}
  dpr={[1, 1.5]}   // cap pixel ratio to 1.5x (reduces GPU load on retina screens)
  style={{ background: 'transparent' }}
>
```

### Lazy-load on mobile

```jsx
// In Onboarding.jsx — skip 3D on small screens
const isMobile = window.innerWidth < 768;

{!isMobile && (
  <Suspense fallback={null}>
    <Scene />
  </Suspense>
)}
```

### useFrame optimization

```jsx
// Use delta to keep rotation speed consistent across frame rates
useFrame((state, delta) => {
  meshRef.current.rotation.y += delta * 0.3;  // frame-rate independent
});
```

---

## Step 7 — Alternative Geometries

If you want a different 3D shape, swap `icosahedronGeometry`:

```jsx
// Option A: Torus Knot (complex, impressive)
<torusKnotGeometry args={[1, 0.35, 200, 16]} />

// Option B: Sphere with distortion
<sphereGeometry args={[1.4, 64, 64]} />

// Option C: Octahedron (geometric / crystal)
<octahedronGeometry args={[1.4, 0]} />

// Option D: Torus (ring)
<torusGeometry args={[1.2, 0.4, 32, 100]} />
```

---

## SVG Animations for Auth Pages (Suraj's Request)

Add animated SVG illustrations to Sign In / Sign Up pages:

**File:** `src/assets/auth-illustration.svg` (place inline in JSX)

```jsx
// In Signup.jsx — add next to the form
<div className="hidden md:flex flex-1 items-center justify-center">
  <motion.div
    animate={{ y: [0, -12, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer glow circle */}
      <circle cx="140" cy="140" r="120" fill="#4c1d95" fillOpacity="0.15" />
      <circle cx="140" cy="140" r="90"  fill="#5b21b6" fillOpacity="0.2"  />

      {/* Brain-like lines */}
      <path d="M100 120 Q120 100 140 120 Q160 140 180 120" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M90 140 Q110 160 140 140 Q170 120 190 140" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M100 160 Q120 180 140 160 Q160 140 180 160" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>

      {/* Center dot */}
      <circle cx="140" cy="140" r="8" fill="#a78bfa" />
      <circle cx="140" cy="140" r="4" fill="#ffffff" />

      {/* Orbit dots */}
      <circle cx="80"  cy="100" r="4" fill="#7c3aed" opacity="0.8"/>
      <circle cx="200" cy="180" r="4" fill="#7c3aed" opacity="0.8"/>
      <circle cx="60"  cy="160" r="3" fill="#a78bfa" opacity="0.6"/>
      <circle cx="220" cy="110" r="3" fill="#a78bfa" opacity="0.6"/>
    </svg>
  </motion.div>
</div>
```

---

## NPM Packages

```bash
npm install three @react-three/fiber @react-three/drei
```

---

## Checklist

- [ ] three, @react-three/fiber, @react-three/drei installed
- [ ] BrainMesh.jsx renders icosahedron with wireframe overlay
- [ ] useFrame rotates mesh smoothly (frame-rate independent)
- [ ] Float from drei adds gentle floating animation
- [ ] Stars from drei adds particle background
- [ ] OrbitControls allows drag-to-rotate interaction
- [ ] Canvas has transparent background (alpha: true)
- [ ] Scene lazy-loaded with React.lazy + Suspense
- [ ] dpr capped at 1.5x for performance
- [ ] 3D skipped on mobile (optional)
- [ ] Onboarding page has hero text left + 3D right layout
- [ ] SVG animations added to Sign In / Sign Up pages
- [ ] "drag to rotate" hint shown below canvas
