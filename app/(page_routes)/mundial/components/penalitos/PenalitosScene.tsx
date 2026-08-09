"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { PenalitosDirection } from "../../types";
import {
  BALL_START,
  BALL_TARGET_Y,
  DIR_X,
  GK_IDLE,
  easeInOutQuad,
  easeOutBack,
  easeOutCubic,
} from "./constants";

export type PenalitosScenePhase = "idle" | "animating" | "result";

type Props = {
  phase: PenalitosScenePhase;
  shooterChoice: PenalitosDirection | null;
  goalkeeperChoice: PenalitosDirection | null;
  outcome: "goal" | "save" | null;
  animStartMs: number | null;
  nowMs: number;
};

const GOAL_WIDTH = 3.4;
const GOAL_HEIGHT = 1.9;
const GOAL_DEPTH = 0.85;
const NET_Z_BASE = -GOAL_DEPTH + 0.02;

// Animation timeline (fractions of the 2000ms sequence)
const T_RUN_END = 0.3; // shooter run-up
const T_CONTACT = 0.33; // boot meets ball
const T_FLIGHT_END = 0.6; // ball reaches goal mouth (goal)
const T_SAVE_IMPACT = 0.56; // ball meets gloves (save)
const T_DIVE_START = 0.36;
const T_DIVE_END = 0.58;

const RUN_FROM = { x: 1.7, z: BALL_START.z + 1.6 };
const RUN_TO = { x: 0.22, z: BALL_START.z + 0.42 };

// Over-the-shoulder broadcast camera
const CAM = { x: -0.45, y: 2.2, z: 9.3 };
const CAM_LOOK = { x: 0.1, y: 0.92, z: 0.3 };

const TRAIL_N = 8;

// ------------------------------------------------------------------
// Canvas texture factories (night-broadcast look, no external assets)
// ------------------------------------------------------------------
function makeGrassTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#0d6b31" : "#0a5a29";
    ctx.fillRect(i * 64, 0, 64, 512);
  }
  for (let i = 0; i < 5000; i++) {
    const l = Math.random();
    ctx.fillStyle = l > 0.5
      ? `rgba(255,255,255,${(l - 0.5) * 0.05})`
      : `rgba(0,0,0,${l * 0.08})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  return tex;
}

function makeCrowdTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, 512, 192);
  for (let y = 6; y < 188; y += 6) {
    for (let x = 2; x < 510; x += 4) {
      const r = Math.random();
      if (r < 0.8) {
        const h = Math.floor(Math.random() * 360);
        ctx.fillStyle =
          r < 0.03
            ? `hsl(${h},15%,${30 + Math.random() * 20}%)`
            : `hsl(${h},${10 + Math.random() * 18}%,${7 + Math.random() * 13}%)`;
        ctx.fillRect(x + Math.random() * 2, y + Math.random() * 2, 2, 3);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNetTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(235,243,255,0.95)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 64; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(64, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,252,240,1)");
  g.addColorStop(0.25, "rgba(220,235,255,0.55)");
  g.addColorStop(1, "rgba(180,210,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#01030a");
  g.addColorStop(0.6, "#071528");
  g.addColorStop(0.85, "#0e2742");
  g.addColorStop(1, "#123252");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeAdTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#041c38");
  g.addColorStop(1, "#062a52");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 64);
  ctx.fillStyle = "rgba(65,230,255,0.35)";
  ctx.fillRect(0, 0, 1024, 3);
  ctx.fillRect(0, 61, 1024, 3);
  const text = "PENALITOS  ⚽  LA VIEJA  ⚽  GOOOL  ⚽  ";
  ctx.font = "700 34px Arial, sans-serif";
  const w = ctx.measureText(text).width;
  ctx.setTransform(1024 / w, 0, 0, 1, 0, 0);
  ctx.shadowColor = "#41e6ff";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#4be9ff";
  ctx.fillText(text, 0, 44);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function makeBallTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, 256, 256);
  const pentagon = (cx: number, cy: number, r: number, rot: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = "#16181d";
  pentagon(128, 128, 34, -Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    pentagon(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96, 26, a);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ------------------------------------------------------------------
// Stadium dressing
// ------------------------------------------------------------------
function Stadium() {
  const crowdTex = useMemo(() => makeCrowdTexture(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const skyTex = useMemo(() => makeSkyTexture(), []);

  return (
    <group>
      {/* Night sky */}
      <mesh position={[0, 9, -20]}>
        <planeGeometry args={[90, 30]} />
        <meshBasicMaterial map={skyTex} fog={false} />
      </mesh>

      {/* Rear stand */}
      <mesh position={[0, 4.3, -10.5]} rotation={[-0.22, 0, 0]}>
        <planeGeometry args={[42, 10]} />
        <meshBasicMaterial map={crowdTex} color="#96a2b4" />
      </mesh>
      {/* Side stands */}
      <mesh position={[-15, 3.6, -2.5]} rotation={[-0.12, 0.78, 0]}>
        <planeGeometry args={[22, 8]} />
        <meshBasicMaterial map={crowdTex} color="#7d8899" />
      </mesh>
      <mesh position={[15, 3.6, -2.5]} rotation={[-0.12, -0.78, 0]}>
        <planeGeometry args={[22, 8]} />
        <meshBasicMaterial map={crowdTex} color="#7d8899" />
      </mesh>

      {/* Dark wall between pitch and stands */}
      <mesh position={[0, 0.7, -2.65]}>
        <boxGeometry args={[44, 1.5, 0.12]} />
        <meshStandardMaterial color="#080d16" roughness={1} />
      </mesh>

      {/* Floodlight glows */}
      <sprite position={[-9, 7.6, -9.5]} scale={[5, 5, 1]}>
        <spriteMaterial
          map={glowTex}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite position={[9, 7.6, -9.5]} scale={[5, 5, 1]}>
        <spriteMaterial
          map={glowTex}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

// Random paparazzi flashes in the stands
function CrowdFlashes() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const n = 150;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 1.9 + Math.random() * 4.8;
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = -8.6 - (y - 1.9) * 0.3 - Math.random() * 0.5;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(() => {
    const attr = pointsRef.current?.geometry.getAttribute("color") as
      | THREE.BufferAttribute
      | undefined;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] *= 0.86;
      arr[i + 1] *= 0.86;
      arr[i + 2] *= 0.86;
    }
    if (Math.random() < 0.35) {
      const i = Math.floor(Math.random() * (arr.length / 3)) * 3;
      arr[i] = 1.6;
      arr[i + 1] = 1.6;
      arr[i + 2] = 1.8;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

// Scrolling LED ad boards behind the goal line
function AdBoards() {
  const tex = useMemo(() => makeAdTexture(), []);
  const texRef = useRef(tex);
  useFrame((_, delta) => {
    const currentTexture = texRef.current;
    currentTexture.offset.x = (currentTexture.offset.x + delta * 0.045) % 1;
  });
  const board = (
    <meshBasicMaterial map={tex} toneMapped={false} />
  );
  return (
    <group>
      <mesh position={[0, 0.32, -2.05]}>
        <boxGeometry args={[13.5, 0.6, 0.1]} />
        {board}
      </mesh>
      <mesh position={[-9.2, 0.32, -1.1] } rotation={[0, 0.5, 0]}>
        <boxGeometry args={[6, 0.6, 0.1]} />
        {board}
      </mesh>
      <mesh position={[9.2, 0.32, -1.1]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[6, 0.6, 0.1]} />
        {board}
      </mesh>
    </group>
  );
}

function Pitch() {
  const grassTex = useMemo(() => makeGrassTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]} receiveShadow>
      <planeGeometry args={[28, 22]} />
      <meshStandardMaterial map={grassTex} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function PitchMarkings() {
  return (
    <group>
      {/* Goal line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -0.42]}>
        <planeGeometry args={[9.4, 0.06]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.8} />
      </mesh>
      {/* Six-yard box */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.013, 2.14]}>
        <planeGeometry args={[8.3, 0.055]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-4.15, 0.013, 0.86]}>
        <planeGeometry args={[0.055, 2.62]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[4.15, 0.013, 0.86]}>
        <planeGeometry args={[0.055, 2.62]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.7} />
      </mesh>
      {/* Penalty spot */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, BALL_START.z]}>
        <circleGeometry args={[0.08, 20]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Goal frame + net
// ------------------------------------------------------------------
function Goal({ netRef }: { netRef: React.RefObject<THREE.Mesh | null> }) {
  const postMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        metalness: 0.15,
        roughness: 0.3,
      }),
    [],
  );
  const netTex = useMemo(() => makeNetTexture(), []);
  const netMat = useMemo(() => {
    const t = netTex.clone();
    t.repeat.set(11, 6);
    t.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [netTex]);
  const sideNetMat = useMemo(() => {
    const t = netTex.clone();
    t.repeat.set(3, 6);
    t.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [netTex]);
  const roofNetMat = useMemo(() => {
    const t = netTex.clone();
    t.repeat.set(11, 3);
    t.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [netTex]);

  const stanchionLen = Math.sqrt(GOAL_HEIGHT ** 2 + GOAL_DEPTH ** 2);
  const stanchionTilt = Math.atan2(GOAL_DEPTH, GOAL_HEIGHT);

  return (
    <group position={[0, 0, -0.42]}>
      {/* Posts */}
      <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]} material={postMat} castShadow>
        <cylinderGeometry args={[0.055, 0.055, GOAL_HEIGHT, 16]} />
      </mesh>
      <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]} material={postMat} castShadow>
        <cylinderGeometry args={[0.055, 0.055, GOAL_HEIGHT, 16]} />
      </mesh>
      {/* Crossbar */}
      <mesh
        position={[0, GOAL_HEIGHT, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={postMat}
        castShadow
      >
        <cylinderGeometry args={[0.055, 0.055, GOAL_WIDTH + 0.11, 16]} />
      </mesh>
      {/* Back stanchions */}
      <mesh
        position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -GOAL_DEPTH / 2]}
        rotation={[stanchionTilt, 0, 0]}
        material={postMat}
      >
        <cylinderGeometry args={[0.035, 0.035, stanchionLen, 10]} />
      </mesh>
      <mesh
        position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -GOAL_DEPTH / 2]}
        rotation={[stanchionTilt, 0, 0]}
        material={postMat}
      >
        <cylinderGeometry args={[0.035, 0.035, stanchionLen, 10]} />
      </mesh>
      {/* Ground bar */}
      <mesh
        position={[0, 0.035, -GOAL_DEPTH]}
        rotation={[0, 0, Math.PI / 2]}
        material={postMat}
      >
        <cylinderGeometry args={[0.03, 0.03, GOAL_WIDTH, 10]} />
      </mesh>

      {/* Back net (bulges on goal) */}
      <mesh
        ref={netRef}
        position={[0, GOAL_HEIGHT / 2 - 0.03, NET_Z_BASE]}
        material={netMat}
      >
        <planeGeometry args={[GOAL_WIDTH - 0.08, GOAL_HEIGHT - 0.08, 12, 8]} />
      </mesh>
      {/* Side nets */}
      <mesh
        position={[-GOAL_WIDTH / 2 + 0.03, GOAL_HEIGHT / 2 - 0.03, -GOAL_DEPTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
        material={sideNetMat}
      >
        <planeGeometry args={[GOAL_DEPTH, GOAL_HEIGHT - 0.08]} />
      </mesh>
      <mesh
        position={[GOAL_WIDTH / 2 - 0.03, GOAL_HEIGHT / 2 - 0.03, -GOAL_DEPTH / 2]}
        rotation={[0, -Math.PI / 2, 0]}
        material={sideNetMat}
      >
        <planeGeometry args={[GOAL_DEPTH, GOAL_HEIGHT - 0.08]} />
      </mesh>
      {/* Roof net */}
      <mesh
        position={[0, GOAL_HEIGHT - 0.05, -GOAL_DEPTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={roofNetMat}
      >
        <planeGeometry args={[GOAL_WIDTH - 0.08, GOAL_DEPTH]} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// Articulated players
// ------------------------------------------------------------------
type AthleteRefs = {
  root: React.RefObject<THREE.Group | null>;
  armL: React.RefObject<THREE.Group | null>;
  armR: React.RefObject<THREE.Group | null>;
  legL: React.RefObject<THREE.Group | null>;
  legR: React.RefObject<THREE.Group | null>;
};

function useAthleteRefs(): AthleteRefs {
  return {
    root: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
  };
}

type AthleteKit = {
  jersey: string;
  shorts: string;
  socks: string;
  skin: string;
  hair: string;
  boots: string;
  gloves?: string;
};

function Athlete({ refs, kit }: { refs: AthleteRefs; kit: AthleteKit }) {
  const mats = useMemo(
    () => ({
      jersey: new THREE.MeshStandardMaterial({ color: kit.jersey, roughness: 0.65 }),
      shorts: new THREE.MeshStandardMaterial({ color: kit.shorts, roughness: 0.75 }),
      socks: new THREE.MeshStandardMaterial({ color: kit.socks, roughness: 0.8 }),
      skin: new THREE.MeshStandardMaterial({ color: kit.skin, roughness: 0.85 }),
      hair: new THREE.MeshStandardMaterial({ color: kit.hair, roughness: 0.9 }),
      boots: new THREE.MeshStandardMaterial({ color: kit.boots, roughness: 0.45 }),
      gloves: new THREE.MeshStandardMaterial({
        color: kit.gloves ?? kit.skin,
        roughness: 0.5,
      }),
    }),
    [kit],
  );

  const arm = (side: 1 | -1, ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[side * 0.28, 1.34, 0]}>
      <mesh position={[0, -0.2, 0]} material={mats.jersey} castShadow>
        <capsuleGeometry args={[0.062, 0.18, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} material={mats.skin} castShadow>
        <capsuleGeometry args={[0.052, 0.13, 4, 10]} />
      </mesh>
      {kit.gloves && (
        <mesh position={[0, -0.56, 0]} material={mats.gloves} castShadow>
          <sphereGeometry args={[0.08, 12, 12]} />
        </mesh>
      )}
    </group>
  );

  const leg = (side: 1 | -1, ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[side * 0.11, 0.74, 0]}>
      <mesh position={[0, -0.17, 0]} material={mats.skin} castShadow>
        <capsuleGeometry args={[0.075, 0.16, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.44, 0]} material={mats.socks} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.66, 0.05]} material={mats.boots} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.24]} />
      </mesh>
    </group>
  );

  return (
    <group ref={refs.root}>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} material={mats.jersey} castShadow>
        <capsuleGeometry args={[0.21, 0.4, 6, 14]} />
      </mesh>
      {/* Shorts */}
      <mesh position={[0, 0.8, 0]} material={mats.shorts} castShadow>
        <capsuleGeometry args={[0.19, 0.14, 6, 12]} />
      </mesh>
      {/* Head + hair */}
      <mesh position={[0, 1.56, 0]} material={mats.skin} castShadow>
        <sphereGeometry args={[0.14, 20, 20]} />
      </mesh>
      <mesh position={[0, 1.61, -0.02]} material={mats.hair}>
        <sphereGeometry args={[0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
      {arm(-1, refs.armL)}
      {arm(1, refs.armR)}
      {leg(-1, refs.legL)}
      {leg(1, refs.legR)}
    </group>
  );
}

// ------------------------------------------------------------------
// Ball + FX
// ------------------------------------------------------------------
function SoccerBall({ meshRef }: { meshRef: React.RefObject<THREE.Mesh | null> }) {
  const texture = useMemo(() => makeBallTexture(), []);
  return (
    <mesh ref={meshRef} position={[BALL_START.x, BALL_START.y, BALL_START.z]} castShadow>
      <sphereGeometry args={[0.11, 28, 28]} />
      <meshStandardMaterial map={texture} roughness={0.3} metalness={0.05} />
    </mesh>
  );
}

function GoalEffects({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef} visible={false}>
      <Sparkles count={60} scale={[2.8, 2, 1.2]} size={4} speed={2.6} color="#9dff34" />
      <Sparkles count={30} scale={[2, 1.4, 0.8]} size={2.5} speed={1.8} color="#ffe38f" />
      <pointLight color="#b4ff4d" intensity={5} distance={5} decay={2} />
    </group>
  );
}

function SaveEffects({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef} visible={false}>
      <Sparkles count={24} scale={[1.3, 0.9, 0.9]} size={3} speed={3} color="#7cc8ff" />
      <pointLight color="#7cc8ff" intensity={2.5} distance={3.5} decay={2} />
    </group>
  );
}

// ------------------------------------------------------------------
// Scene
// ------------------------------------------------------------------
const setRot = (
  g: React.RefObject<THREE.Group | null>,
  x: number,
  y: number,
  z: number,
) => {
  g.current?.rotation.set(x, y, z);
};

export function PenalitosScene({
  phase,
  shooterChoice,
  goalkeeperChoice,
  outcome,
  animStartMs,
  nowMs,
}: Props) {
  const ballRef = useRef<THREE.Mesh>(null);
  const netRef = useRef<THREE.Mesh>(null);
  const goalFxRef = useRef<THREE.Group>(null);
  const saveFxRef = useRef<THREE.Group>(null);
  const gk = useAthleteRefs();
  const shooter = useAthleteRefs();

  const cameraShake = useRef(0);
  const kickShakeFired = useRef(false);
  const showGoalFx = useRef(false);
  const showSaveFx = useRef(false);
  const fxPos = useRef(new THREE.Vector3());
  const idleT = useRef(0);
  const lookX = useRef(0);

  // 60fps clock: nowMs only updates every ~200ms, interpolate between ticks
  const clockBase = useRef({ nowMs, perf: 0 });
  useEffect(() => {
    clockBase.current = { nowMs, perf: performance.now() };
  }, [nowMs]);

  // Ball trail
  const trailMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const trailPts = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_N }, () => new THREE.Vector3()),
  );
  const wasFlying = useRef(false);

  const isPlaying = phase === "animating" || phase === "result";

  useEffect(() => {
    if (phase === "idle") {
      cameraShake.current = 0;
      kickShakeFired.current = false;
      showGoalFx.current = false;
      showSaveFx.current = false;
      wasFlying.current = false;
      lookX.current = 0;
      if (goalFxRef.current) goalFxRef.current.visible = false;
      if (saveFxRef.current) saveFxRef.current.visible = false;
      if (netRef.current) {
        netRef.current.position.z = NET_Z_BASE;
        netRef.current.scale.set(1, 1, 1);
      }
    }
  }, [phase, shooterChoice, goalkeeperChoice]);

  useFrame((state, delta) => {
    idleT.current += delta;
    const time = idleT.current;
    const ball = ballRef.current;
    if (!ball || !gk.root.current || !shooter.root.current) return;

    const cam = state.camera;
    const hideTrail = () => {
      for (const m of trailMeshes.current) if (m) m.visible = false;
      wasFlying.current = false;
    };

    // ---------- Idle ----------
    if (!isPlaying || !shooterChoice) {
      // Ball on the spot
      ball.position.set(BALL_START.x, BALL_START.y, BALL_START.z);
      ball.rotation.y = time * 0.3;

      // Keeper: crouched ready stance, swaying
      gk.root.current.position.set(
        GK_IDLE.x + Math.sin(time * 1.3) * 0.08,
        GK_IDLE.y - 0.05 + Math.sin(time * 2.4) * 0.02,
        GK_IDLE.z,
      );
      gk.root.current.rotation.set(0.2, 0, Math.sin(time * 1.3) * 0.05);
      setRot(gk.armL, 0.4, 0, -0.85 + Math.sin(time * 2.4) * 0.05);
      setRot(gk.armR, 0.4, 0, 0.85 - Math.sin(time * 2.4) * 0.05);
      setRot(gk.legL, 0, 0, -0.14);
      setRot(gk.legR, 0, 0, 0.14);

      // Shooter: waiting at the start of the run-up
      shooter.root.current.position.set(RUN_FROM.x, Math.sin(time * 2.1) * 0.012, RUN_FROM.z);
      shooter.root.current.rotation.set(-0.04, Math.PI, 0);
      setRot(shooter.armL, 0.12, 0, -0.12);
      setRot(shooter.armR, 0.12, 0, 0.12);
      setRot(shooter.legL, 0.06, 0, -0.04);
      setRot(shooter.legR, -0.06, 0, 0.04);

      hideTrail();

      // Slow broadcast drift
      cam.position.set(
        CAM.x + Math.sin(time * 0.22) * 0.28,
        CAM.y + Math.sin(time * 0.35) * 0.05,
        CAM.z,
      );
      cam.lookAt(CAM_LOOK.x, CAM_LOOK.y, CAM_LOOK.z);
      return;
    }

    // ---------- Penalty sequence ----------
    const smoothNow =
      clockBase.current.perf === 0
        ? nowMs
        : clockBase.current.nowMs + (performance.now() - clockBase.current.perf);
    const elapsed = animStartMs ? Math.max(0, smoothNow - animStartMs) : 0;
    const t = Math.min(1, elapsed / 2000);

    const targetX = DIR_X[shooterChoice];
    const targetY = BALL_TARGET_Y[shooterChoice];
    const targetZ = -0.3;

    const gkDirX = goalkeeperChoice ? DIR_X[goalkeeperChoice] * 0.8 : 0;
    const gkIsCenter = goalkeeperChoice === "center" || !goalkeeperChoice;
    const gkDiveY = gkIsCenter ? 0.55 : 0.42;
    const gkDiveZ = 0.35;
    const gkRoll = gkIsCenter ? 0 : -1.15 * Math.sign(gkDirX);

    // --- Shooter ---
    const sRoot = shooter.root.current;
    if (t < T_RUN_END) {
      const p = t / T_RUN_END;
      const pr = p * p * (3 - 2 * p);
      const cyc = p * Math.PI * 2 * 2.2;
      sRoot.position.set(
        THREE.MathUtils.lerp(RUN_FROM.x, RUN_TO.x, pr),
        Math.abs(Math.sin(cyc)) * 0.04,
        THREE.MathUtils.lerp(RUN_FROM.z, RUN_TO.z, pr),
      );
      sRoot.rotation.set(-0.14, Math.PI, 0);
      setRot(shooter.legL, Math.sin(cyc) * 0.75, 0, 0);
      setRot(shooter.legR, -Math.sin(cyc) * 0.75, 0, 0);
      setRot(shooter.armL, -Math.sin(cyc) * 0.55, 0, -0.15);
      setRot(shooter.armR, Math.sin(cyc) * 0.55, 0, 0.15);
    } else {
      sRoot.position.set(RUN_TO.x, 0, RUN_TO.z);
      // Wind-back then strike with the right leg
      let swing: number;
      if (t < 0.315) {
        swing = easeOutCubic((t - T_RUN_END) / 0.015) * 0.9;
      } else if (t < 0.345) {
        swing = THREE.MathUtils.lerp(0.9, -1.2, easeOutCubic((t - 0.315) / 0.03));
      } else {
        swing = THREE.MathUtils.lerp(-1.2, -0.45, Math.min(1, (t - 0.345) / 0.3));
      }
      sRoot.rotation.set(-0.12 + Math.min(0.12, Math.max(0, (t - 0.3) * 0.8)), Math.PI, 0.04);
      setRot(shooter.legR, swing, 0, 0);
      setRot(shooter.legL, 0.1, 0, -0.05);
      setRot(shooter.armL, -0.7, 0, -0.5);
      setRot(shooter.armR, 0.5, 0, 0.35);
    }

    // --- Goalkeeper ---
    const gRoot = gk.root.current;
    if (t < T_DIVE_START) {
      gRoot.position.set(GK_IDLE.x, GK_IDLE.y - 0.06, GK_IDLE.z);
      gRoot.rotation.set(0.22, 0, Math.sin(time * 5) * 0.03);
      setRot(gk.armL, 0.4, 0, -0.9);
      setRot(gk.armR, 0.4, 0, 0.9);
      setRot(gk.legL, 0, 0, -0.14);
      setRot(gk.legR, 0, 0, 0.14);
    } else {
      const dRaw = Math.min(1, (t - T_DIVE_START) / (T_DIVE_END - T_DIVE_START));
      const d = easeOutBack(dRaw);
      const settle = Math.max(0, (t - T_DIVE_END) / (1 - T_DIVE_END));
      const y = THREE.MathUtils.lerp(GK_IDLE.y - 0.06, gkDiveY, d) - settle * (gkIsCenter ? 0.25 : 0.16);
      gRoot.position.set(
        THREE.MathUtils.lerp(GK_IDLE.x, gkDirX, d),
        Math.max(0.12, y),
        THREE.MathUtils.lerp(GK_IDLE.z, gkDiveZ, d),
      );
      gRoot.rotation.set(
        gkIsCenter ? 0.25 * d : 0.1 * d,
        0,
        THREE.MathUtils.lerp(0, gkRoll, d),
      );
      // Arms shoot out toward the corner
      setRot(gk.armL, 0.15, 0, THREE.MathUtils.lerp(-0.9, -2.85, d));
      setRot(gk.armR, 0.15, 0, THREE.MathUtils.lerp(0.9, 2.85, d));
      setRot(gk.legL, -0.2 * d, 0, -0.14 - 0.25 * d);
      setRot(gk.legR, 0.15 * d, 0, 0.14 + 0.25 * d);
    }

    // --- Ball ---
    const flightEnd = outcome === "save" ? T_SAVE_IMPACT : T_FLIGHT_END;
    const contactX = gkDirX;
    const contactY = Math.min(targetY, gkDiveY + 0.5);
    const contactZ = gkDiveZ + 0.12;
    let flying = false;

    if (t < T_CONTACT) {
      ball.position.set(BALL_START.x, BALL_START.y, BALL_START.z);
    } else if (t < flightEnd) {
      flying = true;
      const ft = (t - T_CONTACT) / (flightEnd - T_CONTACT);
      const fe = 1 - Math.pow(1 - ft, 1.6);
      const endX = outcome === "save" ? contactX : targetX;
      const endY = outcome === "save" ? contactY : targetY;
      const endZ = outcome === "save" ? contactZ : targetZ;
      ball.position.set(
        THREE.MathUtils.lerp(BALL_START.x, endX, fe),
        THREE.MathUtils.lerp(BALL_START.y, endY, fe) + Math.sin(ft * Math.PI) * 0.28,
        THREE.MathUtils.lerp(BALL_START.z, endZ, fe),
      );
      ball.rotation.x -= delta * 22;
      ball.rotation.z += delta * 6;
    } else if (outcome === "goal") {
      // Into the net
      const nt = (t - T_FLIGHT_END) / (1 - T_FLIGHT_END);
      const push = easeOutCubic(Math.min(1, nt * 3));
      const drop = easeInOutQuad(Math.min(1, nt * 1.1));
      ball.position.set(
        targetX,
        Math.max(0.12, THREE.MathUtils.lerp(targetY, 0.13, drop)),
        THREE.MathUtils.lerp(targetZ, -0.95, push),
      );
      ball.rotation.x -= delta * 4;

      // Net ripple
      if (netRef.current) {
        const bulge = push * (1 - nt * 0.55);
        netRef.current.position.z = NET_Z_BASE - bulge * 0.32;
        netRef.current.scale.set(1 + bulge * 0.06, 1 + bulge * 0.1, 1);
        const mat = netRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 + bulge * 0.2;
      }
      if (!showGoalFx.current) {
        showGoalFx.current = true;
        fxPos.current.set(targetX, targetY, targetZ);
        cameraShake.current = 0.4;
        if (goalFxRef.current) {
          goalFxRef.current.position.copy(fxPos.current);
          goalFxRef.current.visible = true;
        }
      }
    } else {
      // Save: rebound off the gloves
      const rt = (t - T_SAVE_IMPACT) / (1 - T_SAVE_IMPACT);
      const re = easeOutCubic(rt);
      ball.position.set(
        contactX * (1 + re * 0.4),
        Math.max(0.11, contactY + 1.4 * rt - 2.6 * rt * rt),
        contactZ + re * 3.1,
      );
      ball.rotation.x += delta * 16;
      if (!showSaveFx.current) {
        showSaveFx.current = true;
        fxPos.current.set(contactX, contactY, contactZ);
        cameraShake.current = 0.18;
        if (saveFxRef.current) {
          saveFxRef.current.position.copy(fxPos.current);
          saveFxRef.current.visible = true;
        }
      }
    }

    // --- Ball trail ---
    if (flying) {
      if (!wasFlying.current) {
        wasFlying.current = true;
        for (const p of trailPts.current) p.copy(ball.position);
      }
      const pts = trailPts.current;
      for (let i = TRAIL_N - 1; i > 0; i--) pts[i].copy(pts[i - 1]);
      pts[0].copy(ball.position);
      trailMeshes.current.forEach((m, i) => {
        if (!m) return;
        m.position.copy(pts[i]);
        m.visible = i > 0;
      });
    } else {
      hideTrail();
    }

    // --- Camera: push in, kick punch, goal shake ---
    if (t >= T_CONTACT && !kickShakeFired.current) {
      kickShakeFired.current = true;
      cameraShake.current = Math.max(cameraShake.current, 0.14);
    }
    const push = t < T_RUN_END ? (t / T_RUN_END) * 0.5 : 0.5;
    lookX.current = THREE.MathUtils.lerp(
      lookX.current,
      t > T_CONTACT ? targetX * 0.32 : 0,
      0.06,
    );

    let shakeX = 0;
    let shakeY = 0;
    if (cameraShake.current > 0) {
      cameraShake.current = Math.max(0, cameraShake.current - delta * 1.6);
      shakeX = (Math.random() - 0.5) * cameraShake.current * 0.14;
      shakeY = (Math.random() - 0.5) * cameraShake.current * 0.1;
    }
    cam.position.set(
      CAM.x + Math.sin(time * 0.22) * 0.1 + shakeX,
      CAM.y + shakeY,
      CAM.z - push,
    );
    cam.lookAt(CAM_LOOK.x + lookX.current, 0.95, 0);
  });

  return (
    <>
      <color attach="background" args={["#04070f"]} />
      <fog attach="fog" args={["#050b16", 13, 30]} />

      {/* Night-match lighting: warm key, cool fill, blue rim from the stands */}
      <hemisphereLight intensity={0.5} color="#a8c8ff" groundColor="#0a2812" />
      <directionalLight
        position={[5, 9, 5]}
        intensity={1.7}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={9}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 5, 3]} intensity={0.5} color="#89a7ff" />
      <directionalLight position={[0, 5, -9]} intensity={0.9} color="#6fd8ff" />

      <Stadium />
      <CrowdFlashes />
      <AdBoards />
      <Pitch />
      <PitchMarkings />
      <Goal netRef={netRef} />

      <Athlete
        refs={gk}
        kit={{
          jersey: "#facc15",
          shorts: "#111827",
          socks: "#facc15",
          skin: "#8d5524",
          hair: "#151b23",
          boots: "#111318",
          gloves: "#f8fafc",
        }}
      />
      <Athlete
        refs={shooter}
        kit={{
          jersey: "#f97316",
          shorts: "#f1f5f9",
          socks: "#f97316",
          skin: "#c68642",
          hair: "#2b1a10",
          boots: "#0f1218",
        }}
      />

      <SoccerBall meshRef={ballRef} />

      {/* Ball motion trail */}
      {Array.from({ length: TRAIL_N }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            trailMeshes.current[i] = m;
          }}
          visible={false}
        >
          <sphereGeometry args={[Math.max(0.03, 0.085 - i * 0.007), 10, 10]} />
          <meshBasicMaterial
            color="#d9ffe6"
            transparent
            opacity={0.26 * (1 - i / TRAIL_N)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <GoalEffects groupRef={goalFxRef} />
      <SaveEffects groupRef={saveFxRef} />
    </>
  );
}
