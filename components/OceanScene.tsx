"use client";

import { Float, MeshDistortMaterial, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function IntelligenceCore() {
  const group = useRef<Group>(null);
  const shell = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.08;
    }
    if (shell.current) {
      easing.damp3(shell.current.scale, [1.08 + Math.sin(state.clock.elapsedTime) * 0.04, 1.08, 1.08], 0.2, delta);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={shell}>
        <sphereGeometry args={[1.45, 96, 96]} />
        <MeshDistortMaterial color="#0de7ff" distort={0.28} speed={1.8} roughness={0.12} metalness={0.45} transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[Math.PI / 2.35, 0, 0]}>
        <torusGeometry args={[2.05, 0.01, 12, 180]} />
        <meshBasicMaterial color="#7dfcff" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 1.75, 0.6, 0.2]}>
        <torusGeometry args={[2.55, 0.008, 12, 180]} />
        <meshBasicMaterial color="#7c8cff" transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[0.75, 0.2, 1.4]}>
        <torusGeometry args={[3.05, 0.006, 12, 180]} />
        <meshBasicMaterial color="#16f4bd" transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

function DataIslands() {
  const islands = [
    [-3.6, -0.7, -0.6],
    [3.4, 0.85, -1.2],
    [-2.1, 1.85, -1.8],
    [2.0, -1.6, -0.8],
  ] as const;

  return (
    <>
      {islands.map((position, index) => (
        <Float key={position.join(":")} speed={1.4 + index * 0.2} rotationIntensity={0.38} floatIntensity={0.7}>
          <mesh position={position} rotation={[0.55, index * 0.6, 0.2]}>
            <boxGeometry args={[0.95, 0.08, 0.58]} />
            <meshStandardMaterial color={index % 2 === 0 ? "#41f3ff" : "#11d7b4"} emissive="#08384a" metalness={0.62} roughness={0.25} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function OceanScene() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 44 }} dpr={[1, 1.6]}>
      <color attach="background" args={["#020712"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 5]} intensity={18} color="#41f3ff" />
      <pointLight position={[-4, -2, 3]} intensity={8} color="#8178ff" />
      <Stars radius={80} depth={35} count={900} factor={4} fade speed={0.4} />
      <Sparkles count={90} scale={7} size={2.4} speed={0.45} color="#7dfcff" />
      <IntelligenceCore />
      <DataIslands />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.22} />
    </Canvas>
  );
}
