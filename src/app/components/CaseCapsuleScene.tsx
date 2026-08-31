"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import styles from "./landing.module.css";

const poses = [
  { x: -1.7, y: .35, r: -.25 },
  { x: -.6, y: .05, r: .1 },
  { x: .65, y: .32, r: -.08 },
  { x: 1.65, y: .1, r: .22 },
];

function Capsule({ stage }: { stage: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const pose = poses[stage];
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, pose.x, 4.5, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, pose.y, 4.5, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pose.r + state.pointer.x * .08, 4, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -.12 + state.pointer.y * .05, 4, delta);
  });
  return <group ref={group} position={[-1.7,.35,0]}>
    <mesh castShadow><boxGeometry args={[1.45,.82,.72]} /><meshStandardMaterial color="#f8f9fb" roughness={.3} metalness={.06} /></mesh>
    <mesh position={[0,.02,.37]}><boxGeometry args={[.12,.86,.025]} /><meshStandardMaterial color="#ffb547" emissive="#a56314" emissiveIntensity={.08} /></mesh>
    <mesh position={[-.47,.02,.38]}><circleGeometry args={[.1,32]} /><meshStandardMaterial color={stage >= 2 ? "#1e8068" : "#111318"} /></mesh>
  </group>;
}

function Scene({ stage }: { stage: number }) {
  return <>
    <ambientLight intensity={1.7} />
    <directionalLight position={[3,5,4]} intensity={2.2} castShadow />
    <Capsule stage={stage} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.65,0]} receiveShadow><planeGeometry args={[7,3]} /><shadowMaterial transparent opacity={.12} /></mesh>
  </>;
}

export default function CaseCapsuleScene({ stage }: { stage: number }) {
  return <div className={styles.canvasWrap} aria-hidden="true"><Canvas dpr={[1,1.5]} shadows camera={{ position: [0,1.2,5.8], fov: 34 }} gl={{ antialias: true, powerPreference: "high-performance" }}><Scene stage={stage} /></Canvas></div>;
}
