"use client";

import { Float, MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide } from "three";
import type { Group, Mesh } from "three";

function OceanSurface() {
  const surface = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (surface.current) {
      surface.current.position.y = Math.sin(time * 0.8) * 0.05;
      surface.current.rotation.z = Math.sin(time * 0.32) * 0.015;
    }
    if (glow.current) {
      glow.current.position.x = Math.sin(time * 0.28) * 0.28;
      glow.current.position.z = Math.cos(time * 0.22) * 0.16;
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      <mesh ref={surface} rotation={[-Math.PI / 2.22, 0, 0]} position={[0, -0.25, 0]}>
        <planeGeometry args={[8.5, 5.4, 160, 96]} />
        <MeshDistortMaterial
          color="#12d8e8"
          distort={0.42}
          speed={1.85}
          roughness={0.18}
          metalness={0.12}
          transparent
          opacity={0.62}
          side={DoubleSide}
        />
      </mesh>
      <mesh ref={glow} rotation={[-Math.PI / 2.24, 0, 0]} position={[0, -0.18, 0.18]}>
        <planeGeometry args={[7.6, 4.7, 80, 48]} />
        <MeshDistortMaterial
          color="#7dfff2"
          distort={0.28}
          speed={1.15}
          roughness={0.1}
          metalness={0}
          transparent
          opacity={0.16}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SunShafts() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = Math.sin(state.clock.elapsedTime * 0.24) * 0.25;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
    }
  });

  return (
    <group ref={group} position={[0, 1.2, -1.4]}>
      {[-2.7, -1.35, 0, 1.35, 2.7].map((x, index) => (
        <mesh key={x} position={[x, 0, index * 0.12]} rotation={[0.18, 0, index % 2 ? -0.16 : 0.16]}>
          <planeGeometry args={[0.48, 5.7]} />
          <meshBasicMaterial color="#bafcff" transparent opacity={0.08} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function ReefGarden() {
  const reef = useRef<Group>(null);

  useFrame((state) => {
    if (reef.current) {
      reef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
  });

  const coral = [
    [-3.2, -2.05, -0.6, 0.55],
    [-2.45, -2.15, -0.25, 0.75],
    [-1.55, -2.1, -0.75, 0.62],
    [-0.7, -2.2, -0.15, 0.9],
    [0.35, -2.12, -0.65, 0.7],
    [1.35, -2.18, -0.35, 0.86],
    [2.25, -2.08, -0.8, 0.64],
    [3.05, -2.18, -0.2, 0.78],
  ] as const;

  return (
    <group ref={reef}>
      <mesh position={[0, -2.55, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 1.15, 40, 12]} />
        <MeshDistortMaterial color="#06344a" distort={0.22} speed={0.8} roughness={0.68} transparent opacity={0.9} />
      </mesh>
      {coral.map(([x, y, z, h], index) => (
        <Float key={`${x}:${z}`} speed={0.75 + index * 0.04} rotationIntensity={0.08} floatIntensity={0.08}>
          <mesh position={[x, y + h / 2, z]} rotation={[0, index * 0.45, index % 2 ? 0.12 : -0.12]}>
            <coneGeometry args={[0.12 + (index % 3) * 0.04, h, 6]} />
            <meshStandardMaterial
              color={index % 2 ? "#11d7b4" : "#2ee9ff"}
              emissive={index % 2 ? "#064438" : "#043a52"}
              roughness={0.5}
              metalness={0.08}
              transparent
              opacity={0.88}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function BubbleField() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (group.current) {
      group.current.children.forEach((child, index) => {
        child.position.y += 0.004 + (index % 4) * 0.0015;
        child.position.x += Math.sin(time * 0.7 + index) * 0.0008;
        if (child.position.y > 2.6) child.position.y = -2.2;
      });
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: 34 }).map((_, index) => {
        const x = ((index * 1.37) % 7) - 3.5;
        const y = ((index * 0.73) % 4.6) - 2.2;
        const z = -1.1 + ((index * 0.41) % 1.8);
        const size = 0.025 + (index % 4) * 0.012;
        return (
          <mesh key={index} position={[x, y, z]}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshBasicMaterial color="#d8ffff" transparent opacity={0.36} />
          </mesh>
        );
      })}
    </group>
  );
}

function CurrentLines() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.18;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22) * 0.025;
    }
  });

  return (
    <group ref={group} position={[0, -0.55, -0.95]}>
      {[-1.55, -0.8, 0, 0.8, 1.55].map((y, index) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, index % 2 ? 0.035 : -0.035]}>
          <planeGeometry args={[7.3 - index * 0.22, 0.012]} />
          <meshBasicMaterial color={index % 2 ? "#7dfff2" : "#41f3ff"} transparent opacity={0.28} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function OceanScene() {
  return (
    <Canvas camera={{ position: [0, 0.35, 6.2], fov: 45 }} dpr={[1, 1.6]}>
      <color attach="background" args={["#031827"]} />
      <fog attach="fog" args={["#031827", 5.4, 10]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 5, 3]} intensity={2.8} color="#c7ffff" />
      <pointLight position={[-3, 1.5, 2.8]} intensity={12} color="#41f3ff" />
      <pointLight position={[3.5, -1.8, 2.5]} intensity={7} color="#11d7b4" />
      <SunShafts />
      <OceanSurface />
      <CurrentLines />
      <BubbleField />
      <Sparkles count={70} scale={[7.5, 4.8, 2.6]} size={1.7} speed={0.24} color="#b9ffff" />
      <ReefGarden />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.12} maxPolarAngle={Math.PI / 1.95} minPolarAngle={Math.PI / 2.5} />
    </Canvas>
  );
}
