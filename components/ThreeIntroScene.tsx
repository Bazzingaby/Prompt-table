import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, Float, Stars, Trail, Sparkles, Octahedron, Torus, Icosahedron, Line, Ring } from '@react-three/drei';
import * as THREE from 'three';

// Fix for "Property does not exist on type JSX.IntrinsicElements"
// Augmenting both global JSX and React.JSX to support different TS/React versions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      ringGeometry: any;
      meshBasicMaterial: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      planeGeometry: any;
      sphereGeometry: any;
      gridHelper: any;
      ambientLight: any;
      pointLight: any;
      fog: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      ringGeometry: any;
      meshBasicMaterial: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      planeGeometry: any;
      sphereGeometry: any;
      gridHelper: any;
      ambientLight: any;
      pointLight: any;
      fog: any;
    }
  }
}

// --- REUSABLE COMPONENTS ---

const Label = ({ text, subtext, position, color }: { text: string, subtext: string, position: [number, number, number], color: string }) => {
  return (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.3}
        color={color}
        font="https://fonts.gstatic.com/s/rajdhani/v15/L10x2TCNBvNGovwV04dK.woff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {text}
      </Text>
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.15}
        color="#cccccc"
        font="https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQztYldFc.woff"
        anchorX="center"
        anchorY="top"
        maxWidth={2}
        textAlign="center"
      >
        {subtext}
      </Text>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.52, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
         <cylinderGeometry args={[0.02, 0.02, 1]} />
         <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// --- STAGE 1: INPUT CLUSTER ---
const InputCluster = () => {
  const group = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.2;
    }
  });

  const elements = [
    { id: "CoT", color: "#06b6d4", pos: [-0.5, 0.5, 0] },
    { id: "Fs", color: "#a855f7", pos: [0.5, 0.2, 0.3] },
    { id: "Xml", color: "#4ade80", pos: [-0.2, -0.5, -0.2] },
  ];

  return (
    <group position={[-4, 0, 0]}>
      <Label text="1. SELECT" subtext="Choose techniques from the table" position={[0, 1.5, 0]} color="#06b6d4" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group ref={group}>
          {elements.map((el, i) => (
            <group key={i} position={el.pos as [number, number, number]}>
               <RoundedBox args={[0.8, 0.8, 0.1]} radius={0.05} smoothness={4}>
                  <meshStandardMaterial color="#050510" emissive={el.color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
               </RoundedBox>
               <Text position={[0, 0, 0.06]} fontSize={0.3} color="white" font="https://fonts.gstatic.com/s/rajdhani/v15/L10x2TCNBvNGovwV04dK.woff">
                 {el.id}
               </Text>
            </group>
          ))}
          {/* Connecting lines between blocks */}
          <Line points={[[-0.5, 0.5, 0], [0.5, 0.2, 0.3]]} color="#06b6d4" transparent opacity={0.2} lineWidth={1} />
          <Line points={[[0.5, 0.2, 0.3], [-0.2, -0.5, -0.2]]} color="#06b6d4" transparent opacity={0.2} lineWidth={1} />
        </group>
      </Float>
      {/* Platform */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
         <ringGeometry args={[1.5, 1.6, 32]} />
         <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// --- STAGE 2: PROCESSING CORE ---
const ProcessingCore = () => {
  const outerRing = useRef<THREE.Mesh>(null);
  const innerCore = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (outerRing.current) {
        outerRing.current.rotation.x = clock.elapsedTime * 0.5;
        outerRing.current.rotation.y = clock.elapsedTime * 0.3;
    }
    if (innerCore.current) {
        innerCore.current.rotation.y = -clock.elapsedTime;
        innerCore.current.rotation.z = clock.elapsedTime * 0.5;
        const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
        innerCore.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Label text="2. FUSE" subtext="AI synthesizes logic & context" position={[0, 2, 0]} color="#a855f7" />
      
      {/* Reactor Rings */}
      <group>
        <Torus ref={outerRing} args={[1.5, 0.05, 16, 100]}>
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} toneMapped={false} />
        </Torus>
        <Torus args={[1.8, 0.02, 16, 100]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1} transparent opacity={0.3} />
        </Torus>
      </group>

      {/* The Core */}
      <Float speed={5} rotationIntensity={2} floatIntensity={0}>
        <Octahedron ref={innerCore} args={[0.8, 0]}>
           <meshStandardMaterial color="white" wireframe />
        </Octahedron>
        <Octahedron args={[0.7, 0]}>
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} transparent opacity={0.8} />
        </Octahedron>
      </Float>

      {/* Energy Particles */}
      <Sparkles count={40} scale={4} size={4} speed={0.4} opacity={0.5} color="#d8b4fe" />

      {/* Platform */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
         <ringGeometry args={[2, 2.1, 32]} />
         <meshBasicMaterial color="#a855f7" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// --- STAGE 3: OUTPUT ---
const OutputStation = () => {
  const crystal = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (crystal.current) {
        crystal.current.rotation.y = clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[4, 0, 0]}>
      <Label text="3. DEPLOY" subtext="Copy optimized prompt or asset" position={[0, 1.5, 0]} color="#4ade80" />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
            {/* The "Document" / Crystal */}
            <Icosahedron ref={crystal} args={[0.8, 0]}>
                <meshPhysicalMaterial 
                    color="#4ade80" 
                    roughness={0} 
                    metalness={0.5} 
                    transmission={0.6} 
                    thickness={2}
                    emissive="#4ade80"
                    emissiveIntensity={0.2}
                />
            </Icosahedron>
            {/* Holographic Projection */}
            <mesh position={[0, 1.2, 0]} rotation={[0,0,0]}>
                 <planeGeometry args={[1.5, 1]} />
                 <meshBasicMaterial color="#4ade80" transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, 1.2, 0.01]} fontSize={0.1} color="#4ade80">
                // SYSTEM READY
            </Text>
        </group>
      </Float>

      {/* Particles emitting */}
      <Sparkles count={20} scale={2} size={2} speed={0.2} opacity={0.5} color="#4ade80" position={[0,0,0]} />

      {/* Platform */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
         <ringGeometry args={[1.5, 1.6, 32]} />
         <meshBasicMaterial color="#4ade80" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// --- DATA STREAMS ---
const DataStream = () => {
    // Flow from Input to Core
    // Curve: Start (-4, 0, 0) -> Control (-2, 1, 0) -> End (0, 0, 0)
    // Flow from Core to Output
    // Curve: Start (0, 0, 0) -> Control (2, -1, 0) -> End (4, 0, 0)
    
    return (
        <group>
            {/* Left Stream */}
            <Trail width={0.2} length={6} color="#06b6d4" attenuation={(t) => t}>
                <MovingParticle start={[-4, 0, 0]} end={[0, 0, 0]} speed={1} />
            </Trail>
            
            {/* Right Stream */}
             <Trail width={0.2} length={6} color="#a855f7" attenuation={(t) => t}>
                <MovingParticle start={[0, 0, 0]} end={[4, 0, 0]} speed={1} delay={1.5} />
            </Trail>
        </group>
    )
}

const MovingParticle = ({ start, end, speed, delay = 0 }: { start: number[], end: number[], speed: number, delay?: number }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = (clock.elapsedTime + delay) * speed % 2; // Loop every 2s
        if (t > 1) {
            ref.current.scale.set(0,0,0);
        } else {
            // Simple Lerp
            ref.current.scale.set(1,1,1);
            ref.current.position.x = THREE.MathUtils.lerp(start[0], end[0], t);
            ref.current.position.y = THREE.MathUtils.lerp(start[1], end[1], t) + Math.sin(t * Math.PI) * 1; // Arc
            ref.current.position.z = THREE.MathUtils.lerp(start[2], end[2], t);
        }
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="white" />
        </mesh>
    )
}

// --- BACKGROUND ENVIRONMENT ---
const LabEnvironment = () => {
    return (
        <group>
             {/* Floor Grid */}
            <gridHelper args={[40, 40, 0x334155, 0x1e293b]} position={[0, -2.5, 0]} />
            
            {/* Floating ambient particles */}
            <Sparkles count={200} scale={20} size={2} speed={0.2} opacity={0.2} color="#64748b" />
            
            {/* Distant Stars */}
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        </group>
    )
}

// --- MAIN SCENE ---
const ThreeIntroScene: React.FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[-4, 2, 2]} intensity={1} color="#06b6d4" distance={10} />
      <pointLight position={[0, 3, 0]} intensity={2} color="#a855f7" distance={10} />
      <pointLight position={[4, 2, 2]} intensity={1} color="#4ade80" distance={10} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#050510', 8, 25]} />

      {/* Content */}
      <LabEnvironment />
      
      <group position={[0, 0.5, 0]}>
        <InputCluster />
        <ProcessingCore />
        <OutputStation />
        <DataStream />
      </group>

      {/* Camera Rig */}
      <Rig />
    </Canvas>
  );
};

function Rig() {
  const { camera, mouse } = useThree()
  useFrame(() => {
    // Parallax effect
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05
    camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default ThreeIntroScene;