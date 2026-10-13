"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Float, OrbitControls, Sparkles, Stars, Text } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Github,
  Home,
  Layers,
  Mail,
  MapPin,
  Phone,
  Play,
  Rocket,
  Square,
  Waypoints,
  X,
} from "lucide-react";
import {
  domainColor,
  eraMap,
  eras,
  profile,
  projectMap,
  projects,
  skillMap,
  skills,
  statusColor,
  statusLabel,
  stats,
  type Era,
  type Project,
  type Section,
  type Selection,
  type SkillCluster,
  type Vec3,
} from "./data";

// ───────────────────────────────────────────────
// Camera choreography
// ───────────────────────────────────────────────
const SECTION_VIEW: Record<Section, { cam: Vec3; tgt: Vec3 }> = {
  overview: { cam: [0, 10, 28], tgt: [0, 1, 0] },
  timeline: { cam: [0, 6.5, 21], tgt: [0, 0, 0] },
  skills: { cam: [0, 8.5, 19], tgt: [0, 5.2, -2.5] },
  projects: { cam: [0, -1.5, 21], tgt: [0, -3, 2.5] },
  contact: { cam: [3, 4, 17], tgt: [0, 0, 0] },
};

function dampVec(v: THREE.Vector3, t: Vec3, lambda: number, dt: number) {
  v.x = THREE.MathUtils.damp(v.x, t[0], lambda, dt);
  v.y = THREE.MathUtils.damp(v.y, t[1], lambda, dt);
  v.z = THREE.MathUtils.damp(v.z, t[2], lambda, dt);
}

function Rig({ selected, section }: { selected: Selection | null; section: Section }) {
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; update: () => void }
    | null;
  const camera = useThree((s) => s.camera);
  const until = useRef(0);
  const key = selected ? `${selected.type}:${selected.id}` : `section:${section}`;

  useEffect(() => {
    until.current = performance.now() + 1600;
  }, [key]);

  useFrame((_, dt) => {
    if (performance.now() > until.current) return;
    const cd = Math.min(dt, 0.05);

    let cam: Vec3;
    let tgt: Vec3;

    if (selected) {
      const node =
        selected.type === "era"
          ? eraMap[selected.id]
          : selected.type === "project"
            ? projectMap[selected.id]
            : skillMap[selected.id];
      if (!node) return;
      const p = node.position;
      tgt = p;
      if (selected.type === "skill") cam = [p[0] * 0.4, p[1] + 1.5, p[2] + 12];
      else if (selected.type === "project") cam = [p[0], p[1] + 2.6, p[2] + 7];
      else cam = [p[0], p[1] + 3.4, p[2] + 9];
    } else {
      const view = SECTION_VIEW[section];
      cam = view.cam;
      tgt = view.tgt;
    }

    dampVec(camera.position, cam, 3.4, cd);
    if (controls) {
      dampVec(controls.target, tgt, 3.4, cd);
      controls.update();
    }
  });

  return null;
}

// ───────────────────────────────────────────────
// The river (career spine)
// ───────────────────────────────────────────────
function River({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.05, 8, false), [curve]);
  const glowTube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.16, 8, false), [curve]);
  const packetsRef = useRef<THREE.Group>(null!);
  const offsets = useMemo(() => Array.from({ length: 8 }, (_, i) => i / 8), []);
  const nowPoint = useMemo(() => curve.getPointAt(1), [curve]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.045;
    packetsRef.current.children.forEach((child, i) => {
      curve.getPointAt((t + offsets[i]) % 1, child.position);
    });
  });

  return (
    <group>
      <mesh geometry={glowTube}>
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.05} toneMapped={false} />
      </mesh>
      <mesh geometry={tube}>
        <meshBasicMaterial color="#5eead4" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <group ref={packetsRef}>
        {offsets.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshBasicMaterial color="#a7f3d0" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={nowPoint} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.6, 40]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <Billboard position={[nowPoint.x, nowPoint.y + 0.95, nowPoint.z]}>
        <Text fontSize={0.22} color="#fbbf24" anchorX="center" anchorY="middle" letterSpacing={0.2}>
          NOW · 2026
        </Text>
      </Billboard>
    </group>
  );
}

// ───────────────────────────────────────────────
// Neural edges
// ───────────────────────────────────────────────
interface EdgeDef {
  id: string;
  a: Vec3;
  b: Vec3;
  lift: number;
  color: string;
  aKey: string;
  bKey: string;
}

function Edge({ edge, selKey }: { edge: EdgeDef; selKey: string | null }) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...edge.a);
    const end = new THREE.Vector3(...edge.b);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += edge.lift;
    const c = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = c.getPoints(22);
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, [edge]);

  const active = selKey != null && (edge.aKey === selKey || edge.bKey === selKey);
  const dim = selKey != null && !active;
  const opacity = dim ? 0.03 : active ? 0.55 : 0.09;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={edge.color} transparent opacity={opacity} toneMapped={false} />
    </line>
  );
}

// ───────────────────────────────────────────────
// Nodes
// ───────────────────────────────────────────────
function EraNode({
  era,
  selected,
  anySelected,
  onSelect,
}: {
  era: Era;
  selected: boolean;
  anySelected: boolean;
  onSelect: (s: Selection) => void;
}) {
  const g = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const torus = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const dim = anySelected && !selected;
  const color = domainColor[era.domain];

  useEffect(() => () => void (document.body.style.cursor = "auto"), []);

  useFrame((state, dt) => {
    const cd = Math.min(dt, 0.05);
    const goal = selected ? 1.5 : hovered ? 1.26 : 1;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, goal, 8, cd));
    torus.current.rotation.z += cd * 0.5;
    const mat = halo.current.material as THREE.MeshBasicMaterial;
    if (selected || era.current) {
      const p = (state.clock.elapsedTime * (selected ? 0.9 : 0.5)) % 1;
      halo.current.scale.setScalar(1 + p * (selected ? 2.6 : 1.8));
      mat.opacity = (selected ? 0.55 : 0.3) * (1 - p);
    } else {
      halo.current.scale.setScalar(1);
      mat.opacity = 0;
    }
  });

  const emissive = selected ? 2.8 : hovered ? 2 : era.current ? 1.6 : 1.1;

  return (
    <group position={era.position}>
      <Float speed={1.1} rotationIntensity={0.22} floatIntensity={0.4}>
        <group
          ref={g}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({ type: "era", id: era.id });
          }}
        >
          <mesh>
            <sphereGeometry args={[0.38, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissive}
              roughness={0.2}
              transparent
              opacity={dim ? 0.4 : 1}
            />
          </mesh>
          <mesh ref={torus} rotation={[Math.PI / 2.4, 0.3, 0]}>
            <torusGeometry args={[0.66, 0.03, 12, 60]} />
            <meshBasicMaterial color={color} transparent opacity={dim ? 0.2 : 0.75} toneMapped={false} />
          </mesh>
          <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.74, 0.84, 48]} />
            <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          {era.current && (
            <Sparkles count={10} scale={1.8} size={2} speed={0.4} color={color} opacity={0.85} />
          )}
        </group>
      </Float>

      <Billboard position={[0, 1.1, 0]}>
        <Text
          fontSize={0.23}
          color={dim ? "#64748b" : "#f1f5f9"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.006}
          outlineColor="#020617"
          maxWidth={4.2}
        >
          {era.company}
        </Text>
        <Text
          position={[0, -0.33, 0]}
          fontSize={0.15}
          color={dim ? "#475569" : color}
          anchorX="center"
          anchorY="middle"
        >
          {era.current ? "NOW" : String(era.year)}
        </Text>
      </Billboard>
    </group>
  );
}

function ProjectNode({
  project,
  selected,
  anySelected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  anySelected: boolean;
  onSelect: (s: Selection) => void;
}) {
  const g = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const dim = anySelected && !selected;
  const color = statusColor[project.status];

  useEffect(() => () => void (document.body.style.cursor = "auto"), []);

  useFrame((_, dt) => {
    const cd = Math.min(dt, 0.05);
    const goal = selected ? 1.55 : hovered ? 1.3 : project.flagship ? 1.15 : 1;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, goal, 8, cd));
    g.current.rotation.y += cd * 0.35;
  });

  const emissive = selected ? 2.5 : hovered ? 1.9 : 1;

  return (
    <group position={project.position}>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
        <group
          ref={g}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({ type: "project", id: project.id });
          }}
        >
          <mesh rotation={[0.5, 0.4, 0]}>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissive}
              roughness={0.25}
              transparent
              opacity={dim ? 0.32 : 1}
            />
          </mesh>
          <mesh rotation={[0.5, 0.4, 0]} scale={1.16}>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={dim ? 0.1 : 0.4} toneMapped={false} />
          </mesh>
        </group>
      </Float>

      <Billboard position={[0, 0.78, 0]}>
        <Text
          fontSize={0.15}
          color={dim ? "#475569" : "#cbd5e1"}
          anchorX="center"
          anchorY="middle"
          maxWidth={3.2}
          outlineWidth={0.004}
          outlineColor="#020617"
        >
          {project.flagship ? `★ ${project.name}` : project.name}
        </Text>
      </Billboard>
    </group>
  );
}

function SkillNode({
  cluster,
  selected,
  anySelected,
  onSelect,
}: {
  cluster: SkillCluster;
  selected: boolean;
  anySelected: boolean;
  onSelect: (s: Selection) => void;
}) {
  const g = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const dim = anySelected && !selected;

  useEffect(() => () => void (document.body.style.cursor = "auto"), []);

  useFrame((state, dt) => {
    const cd = Math.min(dt, 0.05);
    const goal = selected ? 1.5 : hovered ? 1.25 : 1;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, goal, 8, cd));
    const mat = halo.current.material as THREE.MeshBasicMaterial;
    if (selected) {
      const p = (state.clock.elapsedTime * 0.8) % 1;
      halo.current.scale.setScalar(1 + p * 2.4);
      mat.opacity = 0.5 * (1 - p);
    } else {
      halo.current.scale.setScalar(1);
      mat.opacity = 0;
    }
  });

  const emissive = selected ? 2.6 : hovered ? 1.9 : 1.1;

  return (
    <group position={cluster.position}>
      <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.5}>
        <group
          ref={g}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({ type: "skill", id: cluster.id });
          }}
        >
          <mesh>
            <octahedronGeometry args={[0.44, 0]} />
            <meshStandardMaterial
              color={cluster.color}
              emissive={cluster.color}
              emissiveIntensity={emissive}
              roughness={0.25}
              transparent
              opacity={dim ? 0.35 : 1}
            />
          </mesh>
          <mesh scale={1.12}>
            <octahedronGeometry args={[0.44, 0]} />
            <meshBasicMaterial color={cluster.color} wireframe transparent opacity={dim ? 0.12 : 0.4} toneMapped={false} />
          </mesh>
          <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.58, 40]} />
            <meshBasicMaterial color={cluster.color} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </Float>

      <Billboard position={[0, 0.98, 0]}>
        <Text
          fontSize={0.2}
          color={dim ? "#64748b" : "#e2e8f0"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.006}
          outlineColor="#020617"
        >
          {cluster.label}
        </Text>
        <Text
          position={[0, -0.26, 0]}
          fontSize={0.135}
          color={dim ? "#475569" : cluster.color}
          anchorX="center"
          anchorY="middle"
        >
          {`~${cluster.spanYears} yr`}
        </Text>
      </Billboard>
    </group>
  );
}

// ───────────────────────────────────────────────
// Scene
// ───────────────────────────────────────────────
function Scene({
  selected,
  section,
  onSelect,
}: {
  selected: Selection | null;
  section: Section;
  onSelect: (s: Selection) => void;
}) {
  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-15.6, 0.2, 0.4),
      ...eras.map((e) => new THREE.Vector3(...e.position)),
      new THREE.Vector3(15.9, 0.4, -0.2),
    ];
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }, []);

  const edges = useMemo<EdgeDef[]>(() => {
    const list: EdgeDef[] = [];
    skills.forEach((s) => {
      s.eraIds.forEach((eid) => {
        const era = eraMap[eid];
        if (!era) return;
        list.push({
          id: `s-${s.id}-${eid}`,
          a: s.position,
          b: era.position,
          lift: 1.6,
          color: s.color,
          aKey: `skill:${s.id}`,
          bKey: `era:${eid}`,
        });
      });
    });
    projects.forEach((p) => {
      const era = eraMap[p.eraId];
      if (!era) return;
      list.push({
        id: `p-${p.id}`,
        a: era.position,
        b: p.position,
        lift: -0.8,
        color: statusColor[p.status],
        aKey: `era:${p.eraId}`,
        bKey: `project:${p.id}`,
      });
    });
    return list;
  }, []);

  const selKey = selected ? `${selected.type}:${selected.id}` : null;

  return (
    <>
      <color attach="background" args={["#04060a"]} />
      <fog attach="fog" args={["#04060a", 22, 62]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 14, 12]} intensity={0.6} color="#5eead4" />
      <pointLight position={[-16, -6, -8]} intensity={0.35} color="#a78bfa" />

      <Stars radius={110} depth={60} count={2400} factor={3.2} saturation={0} fade speed={0.5} />

      <River curve={curve} />

      {edges.map((edge) => (
        <Edge key={edge.id} edge={edge} selKey={selKey} />
      ))}

      {eras.map((era) => (
        <EraNode
          key={era.id}
          era={era}
          selected={selected?.type === "era" && selected.id === era.id}
          anySelected={!!selected}
          onSelect={onSelect}
        />
      ))}
      {projects.map((project) => (
        <ProjectNode
          key={project.id}
          project={project}
          selected={selected?.type === "project" && selected.id === project.id}
          anySelected={!!selected}
          onSelect={onSelect}
        />
      ))}
      {skills.map((cluster) => (
        <SkillNode
          key={cluster.id}
          cluster={cluster}
          selected={selected?.type === "skill" && selected.id === cluster.id}
          anySelected={!!selected}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        minDistance={5}
        maxDistance={60}
      />
      <Rig selected={selected} section={section} />
    </>
  );
}

// ───────────────────────────────────────────────
// HUD primitives
// ───────────────────────────────────────────────
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/70">
      {children}
    </h2>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{children}</p>;
}

function PanelHeading({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-300">
        {icon}
      </span>
      <span className="font-[family-name:var(--font-bricolage)] text-sm font-bold text-white">{title}</span>
      {hint && <span className="ml-auto text-[10px] text-slate-500">{hint}</span>}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  href,
  external,
  children,
}: {
  title: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  children: ReactNode;
}) {
  const cls =
    "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-300 backdrop-blur-xl transition hover:border-emerald-400/50 hover:text-white";
  if (href) {
    return (
      <a
        href={href}
        title={title}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" title={title} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function contactIcon(kind: string) {
  if (kind === "email") return Mail;
  if (kind === "phone") return Phone;
  if (kind === "github") return Github;
  return MapPin;
}

function Chip({ label, color, onClick }: { label: string; color?: string; onClick?: () => void }) {
  const style = color ? { borderColor: `${color}40`, background: `${color}12`, color } : undefined;
  const cls =
    "rounded-md border px-1.5 py-0.5 text-[10.5px] transition " +
    (color ? "" : "border-white/10 bg-white/[0.04] text-slate-300 ") +
    (onClick ? "hover:border-emerald-400/60 cursor-pointer" : "cursor-default");
  return onClick ? (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {label}
    </button>
  ) : (
    <span className={cls} style={style}>
      {label}
    </span>
  );
}

// ───────────────────────────────────────────────
// Left dock panels
// ───────────────────────────────────────────────
function OverviewPanel() {
  return (
    <div>
      <PanelHeading icon={<Compass className="h-3.5 w-3.5" />} title="Overview" />
      <div className="space-y-2">
        {profile.summary.map((p, i) => (
          <p key={i} className="text-[12.5px] leading-relaxed text-slate-300">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="font-[family-name:var(--font-bricolage)] text-xl font-extrabold text-emerald-300">
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <MiniLabel>Education</MiniLabel>
        <p className="mt-1 text-[12px] text-slate-300">{profile.education.degree}</p>
        <p className="text-[11px] text-slate-500">
          {profile.education.school} · {profile.education.period}
        </p>
        <p className="text-[11px] text-slate-500">{profile.education.note}</p>
      </div>
      <div className="mt-3">
        <MiniLabel>Languages</MiniLabel>
        {profile.languages.map((l) => (
          <p key={l.language} className="mt-1 text-[11px] text-slate-400">
            <span className="text-slate-200">{l.language}</span> — {l.level}
          </p>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel({
  selected,
  onSelect,
}: {
  selected: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  return (
    <div>
      <PanelHeading icon={<Waypoints className="h-3.5 w-3.5" />} title="Timeline" hint="2015 → now" />
      <div className="space-y-1.5">
        {[...eras].reverse().map((e) => {
          const active = selected?.type === "era" && selected.id === e.id;
          return (
            <button
              key={e.id}
              onClick={() => onSelect({ type: "era", id: e.id })}
              className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                active ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-slate-100">{e.company}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                  {e.current ? "NOW" : e.year}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: domainColor[e.domain] }} />
                <span className="truncate text-[11px] text-slate-400">{e.role}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                  {e.projectIds.length} proj
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SkillsPanel({
  selected,
  onSelect,
}: {
  selected: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  return (
    <div>
      <PanelHeading icon={<Boxes className="h-3.5 w-3.5" />} title="Skills" hint="6 clusters" />
      <div className="space-y-1.5">
        {skills.map((c) => {
          const active = selected?.type === "skill" && selected.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect({ type: "skill", id: c.id })}
              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                active ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 hover:border-white/25"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="flex-1 truncate text-[12px] font-semibold text-slate-100">{c.label}</span>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                ~{c.spanYears}y · {c.items.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsPanel({
  selected,
  onSelect,
}: {
  selected: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  return (
    <div>
      <PanelHeading icon={<Layers className="h-3.5 w-3.5" />} title="Projects" hint={`${projects.length} total`} />
      <div className="space-y-3">
        {[...eras].reverse().map((e) => (
          <div key={e.id}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {e.company}
            </p>
            <div className="space-y-1">
              {e.projectIds.map((pid) => {
                const p = projectMap[pid];
                const active = selected?.type === "project" && selected.id === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => onSelect({ type: "project", id: pid })}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${
                      active ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: statusColor[p.status] }}
                    />
                    <span className="flex-1 truncate text-[11.5px] text-slate-200">
                      {p.flagship ? "★ " : ""}
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPanel() {
  return (
    <div>
      <PanelHeading icon={<Mail className="h-3.5 w-3.5" />} title="Contact" />
      <p className="text-[12px] text-slate-300">{profile.available}.</p>
      <div className="mt-3 space-y-1.5">
        {profile.contact.map((c) => {
          const Icon = contactIcon(c.kind);
          const inner = (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-emerald-300">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500">{c.label}</span>
                <span className="block truncate text-[12px] text-slate-200">{c.value}</span>
              </span>
            </>
          );
          return c.href ? (
            <a
              key={c.label}
              href={c.href}
              target={c.kind === "github" ? "_blank" : undefined}
              rel={c.kind === "github" ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2.5 rounded-lg border border-white/10 p-2 transition hover:border-emerald-400/50"
            >
              {inner}
            </a>
          ) : (
            <div key={c.label} className="flex items-center gap-2.5 rounded-lg border border-white/10 p-2">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Detail panel
// ───────────────────────────────────────────────
function PrototypeButton({ url }: { url: string }) {
  if (url && url !== "#") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-[12px] font-semibold text-emerald-950 transition hover:bg-emerald-300"
      >
        <Rocket className="h-3.5 w-3.5" /> Open prototype <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-slate-500">
      <Rocket className="h-3.5 w-3.5" /> Prototype · coming soon
    </span>
  );
}

function DetailPanel({
  selected,
  onSelect,
  onClose,
  onCycle,
}: {
  selected: Selection;
  onSelect: (s: Selection) => void;
  onClose: () => void;
  onCycle: (dir: 1 | -1) => void;
}) {
  const era = selected.type === "era" ? eraMap[selected.id] : undefined;
  const skill = selected.type === "skill" ? skillMap[selected.id] : undefined;
  const project = selected.type === "project" ? projectMap[selected.id] : undefined;

  return (
    <motion.aside
      key={`${selected.type}:${selected.id}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="pointer-events-auto absolute inset-x-3 bottom-24 z-30 max-h-[56dvh] overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-28 sm:w-[380px]"
    >
      {era && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ borderColor: `${domainColor[era.domain]}66`, color: domainColor[era.domain] }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: domainColor[era.domain] }} />
                {era.domain}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-bricolage)] text-lg font-bold leading-tight text-white">
                {era.role}
              </h3>
              <p className="text-[12px] text-slate-300">{era.company}</p>
              <p className="text-[11px] text-slate-500">
                {era.period} · {era.location}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="mt-3 space-y-1.5">
            {era.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-slate-300">
                <span
                  className="mt-[6px] h-1 w-1 shrink-0 rounded-full"
                  style={{ background: domainColor[era.domain] }}
                />
                {b}
              </li>
            ))}
          </ul>

          {era.projectIds.length > 0 && (
            <div className="mt-3">
              <MiniLabel>Projects</MiniLabel>
              <div className="mt-1.5 space-y-1">
                {era.projectIds.map((pid) => {
                  const p = projectMap[pid];
                  return (
                    <button
                      key={pid}
                      onClick={() => onSelect({ type: "project", id: pid })}
                      className="flex w-full items-center gap-2 rounded-md border border-white/10 px-2 py-1 text-left transition hover:border-emerald-400/50"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[p.status] }} />
                      <span className="flex-1 truncate text-[11.5px] text-slate-200">
                        {p.flagship ? "★ " : ""}
                        {p.name}
                      </span>
                      <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {era.skillClusterIds.map((cid) => (
              <Chip
                key={cid}
                label={skillMap[cid].label}
                color={skillMap[cid].color}
                onClick={() => onSelect({ type: "skill", id: cid })}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => onCycle(-1)}
              className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Earlier
            </button>
            <span className="text-[10px] tabular-nums text-slate-600">
              {eras.findIndex((x) => x.id === era.id) + 1} / {eras.length}
            </span>
            <button
              onClick={() => onCycle(1)}
              className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
            >
              Later <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      {skill && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ borderColor: `${skill.color}66`, color: skill.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: skill.color }} />
                {skill.range}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-bricolage)] text-lg font-bold text-white">
                {skill.label}
              </h3>
              <p className="text-[12px] text-slate-400">{skill.summary}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {skill.items.map((it) => (
              <div key={it.name} className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-semibold text-slate-100">{it.name}</span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-slate-400">
                    ~{it.years} yr · {it.range}
                  </span>
                </div>
                {it.note && <p className="mt-0.5 text-[11px] text-slate-500">{it.note}</p>}
              </div>
            ))}
          </div>

          <div className="mt-3">
            <MiniLabel>Used at</MiniLabel>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {skill.eraIds.map((eid) => (
                <Chip
                  key={eid}
                  label={eraMap[eid].company}
                  color={domainColor[eraMap[eid].domain]}
                  onClick={() => onSelect({ type: "era", id: eid })}
                />
              ))}
            </div>
          </div>

          {skill.projectIds.length > 0 && (
            <div className="mt-3">
              <MiniLabel>Shows up in</MiniLabel>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {skill.projectIds.map((pid) => (
                  <Chip
                    key={pid}
                    label={projectMap[pid].name}
                    onClick={() => onSelect({ type: "project", id: pid })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {project && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ borderColor: `${statusColor[project.status]}66`, color: statusColor[project.status] }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[project.status] }} />
                  {statusLabel[project.status]}
                </span>
                {project.flagship && <span className="text-[11px] text-amber-300">★ flagship</span>}
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-bricolage)] text-lg font-bold leading-tight text-white">
                {project.name}
              </h3>
              <button
                onClick={() => onSelect({ type: "era", id: project.eraId })}
                className="text-[12px] text-slate-400 transition hover:text-emerald-300"
              >
                {eraMap[project.eraId].company} · {project.year}
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-[12px] leading-relaxed text-slate-300">{project.blurb}</p>

          <ul className="mt-2 space-y-1">
            {project.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-slate-400">
                <span
                  className="mt-[6px] h-1 w-1 shrink-0 rounded-full"
                  style={{ background: statusColor[project.status] }}
                />
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tech.map((x) => (
              <Chip key={x} label={x} />
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.clusters.map((cid) => (
              <Chip
                key={cid}
                label={skillMap[cid].label}
                color={skillMap[cid].color}
                onClick={() => onSelect({ type: "skill", id: cid })}
              />
            ))}
          </div>

          <PrototypeButton url={project.prototypeUrl} />

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => onCycle(-1)}
              className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[10px] tabular-nums text-slate-600">
              {projects.findIndex((x) => x.id === project.id) + 1} / {projects.length}
            </span>
            <button
              onClick={() => onCycle(1)}
              className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}

// ───────────────────────────────────────────────
// Scrubber (year rail + guided tour)
// ───────────────────────────────────────────────
function Scrubber({
  selected,
  onSelect,
  tour,
  onToggleTour,
}: {
  selected: Selection | null;
  onSelect: (s: Selection) => void;
  tour: boolean;
  onToggleTour: () => void;
}) {
  const eraSel = selected?.type === "era" ? eraMap[selected.id] : null;
  const pos = (frac: number) => 4 + frac * 92;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-6">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onToggleTour}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            tour ? "bg-rose-400 text-rose-950" : "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
          }`}
        >
          {tour ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {tour ? "Stop" : "Tour"}
        </button>

        <div className="relative h-9 flex-1">
          <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          {eras.map((e) => {
            const on = eraSel?.id === e.id;
            return (
              <button
                key={e.id}
                onClick={() => onSelect({ type: "era", id: e.id })}
                style={{ left: `${pos(e.frac)}%` }}
                className="group absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                title={`${e.company} · ${e.period}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full border transition ${on ? "scale-[1.6]" : "group-hover:scale-125"}`}
                  style={{ background: on ? domainColor[e.domain] : "#0b0f14", borderColor: domainColor[e.domain] }}
                />
                <span
                  className={`absolute top-[14px] text-[9px] tabular-nums transition ${
                    on ? "text-slate-200" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {e.year}
                </span>
              </button>
            );
          })}
          {eraSel && (
            <div
              className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-emerald-300 transition-all duration-500"
              style={{ left: `${pos(eraSel.frac)}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function IntroOverlay() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#04060a]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="font-[family-name:var(--font-bricolage)] text-5xl font-extrabold tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(52,211,153,0.75)]"
      >
        {profile.monogram}
      </motion.div>
      <div className="mt-4 h-px w-40 overflow-hidden bg-white/10">
        <motion.div
          className="h-full w-1/3 bg-emerald-400"
          initial={{ x: "-120%" }}
          animate={{ x: "360%" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">Charting the river</p>
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Document fallback
// ───────────────────────────────────────────────
function StaticView({ can3d, onLaunch3d }: { can3d: boolean; onLaunch3d: () => void }) {
  return (
    <main className="min-h-[100dvh] w-full bg-[#04060a] text-slate-200 font-[family-name:var(--font-manrope)]">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/80">{profile.available}</span>
        </div>

        <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-4xl font-extrabold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
            Allan Rojas
          </span>
        </h1>
        <p className="mt-2 text-lg text-slate-300">{profile.title}</p>
        <p className="mt-1 text-sm text-slate-500">
          {profile.tagline} · {profile.location}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {profile.contact.map((c) => {
            const Icon = contactIcon(c.kind);
            const cls =
              "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-300 transition hover:border-emerald-400/50 hover:text-white";
            return c.href ? (
              <a
                key={c.label}
                href={c.href}
                target={c.kind === "github" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={cls}
              >
                <Icon className="h-3.5 w-3.5 text-emerald-300" />
                {c.value}
              </a>
            ) : (
              <span key={c.label} className={cls}>
                <Icon className="h-3.5 w-3.5 text-emerald-300" />
                {c.value}
              </span>
            );
          })}
        </div>

        {can3d && (
          <button
            onClick={onLaunch3d}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-[13px] font-semibold text-emerald-950 transition hover:bg-emerald-300"
          >
            <Waypoints className="h-4 w-4" /> Launch the river timeline
          </button>
        )}

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-[family-name:var(--font-bricolage)] text-2xl font-extrabold text-emerald-300">
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <SectionLabel>Profile</SectionLabel>
          <div className="mt-3 space-y-2">
            {profile.summary.map((p, i) => (
              <p key={i} className="text-[14px] leading-relaxed text-slate-300">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>Trajectory</SectionLabel>
          <div className="relative mt-5 space-y-7 border-l border-white/10 pl-6">
            {[...eras].reverse().map((e) => (
              <div key={e.id} className="relative">
                <span
                  className="absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-[#04060a]"
                  style={{ background: domainColor[e.domain] }}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-[family-name:var(--font-bricolage)] text-[15px] font-bold text-white">
                    {e.role}
                  </h3>
                  <span className="text-[11px] tabular-nums text-slate-500">{e.period}</span>
                </div>
                <p className="text-[12.5px] text-slate-400">
                  {e.company} · {e.location}
                </p>
                <ul className="mt-2 space-y-1">
                  {e.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-slate-300">
                      <span
                        className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                        style={{ background: domainColor[e.domain] }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.stack.map((x) => (
                    <span
                      key={x}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-slate-400"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>Projects</SectionLabel>
          <div className="mt-5 space-y-8">
            {[...eras].reverse().map((e) => (
              <div key={e.id}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  {e.company}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {e.projectIds.map((pid) => {
                    const p = projectMap[pid];
                    return (
                      <div key={pid} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{
                              borderColor: `${statusColor[p.status]}66`,
                              color: statusColor[p.status],
                            }}
                          >
                            {statusLabel[p.status]}
                          </span>
                          {p.flagship && <span className="text-[10px] text-amber-300">★</span>}
                        </div>
                        <h4 className="mt-1.5 text-[13px] font-semibold text-slate-100">{p.name}</h4>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{p.blurb}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.tech.map((x) => (
                            <span
                              key={x}
                              className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400"
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                        {p.prototypeUrl && p.prototypeUrl !== "#" ? (
                          <a
                            href={p.prototypeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
                          >
                            <Rocket className="h-3 w-3" /> Open prototype
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Rocket className="h-3 w-3" /> Prototype · coming soon
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>Skills</SectionLabel>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {skills.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <h3 className="text-[13px] font-semibold text-slate-100">{c.label}</h3>
                  <span className="ml-auto text-[10px] tabular-nums text-slate-500">{c.range}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{c.summary}</p>
                <div className="mt-2 space-y-1">
                  {c.items.map((it) => (
                    <div key={it.name} className="flex items-baseline justify-between gap-2 text-[11.5px]">
                      <span className="text-slate-300">{it.name}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">
                        ~{it.years}y · {it.range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div>
            <SectionLabel>Education</SectionLabel>
            <p className="mt-2 text-[13px] text-slate-200">{profile.education.degree}</p>
            <p className="text-[12px] text-slate-500">{profile.education.school}</p>
            <p className="text-[12px] text-slate-500">
              {profile.education.period} · {profile.education.note}
            </p>
          </div>
          <div>
            <SectionLabel>Languages</SectionLabel>
            {profile.languages.map((l) => (
              <p key={l.language} className="mt-2 text-[12px] text-slate-400">
                <span className="text-slate-200">{l.language}</span> — {l.level}
              </p>
            ))}
          </div>
        </section>

        <div className="mt-14 flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-slate-600">
          <span>{profile.name}</span>
          <Link href="/" className="transition hover:text-slate-300">
            ← laviejadventures.com
          </Link>
        </div>
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────
const SECTIONS: Section[] = ["overview", "timeline", "skills", "projects", "contact"];

export default function AllanPortfolio() {
  const [section, setSection] = useState<Section>("overview");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [mode, setMode] = useState<"3d" | "doc">("3d");
  const [webgl, setWebgl] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [tour, setTour] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    let ok = true;
    try {
      const c = document.createElement("canvas");
      ok = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      ok = false;
    }
    setWebgl(ok);
    if (!ok || prefersReduced) setMode("doc");
  }, [prefersReduced]);

  useEffect(() => {
    const id = window.setTimeout(() => setShowIntro(false), 1300);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mode === "doc") document.body.style.cursor = "auto";
  }, [mode]);

  useEffect(() => {
    if (!tour) return;
    setSelected({ type: "era", id: eras[0].id });
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      if (i >= eras.length) {
        window.clearInterval(iv);
        setTour(false);
        setSelected(null);
        setSection("overview");
        return;
      }
      setSelected({ type: "era", id: eras[i].id });
    }, 2800);
    return () => window.clearInterval(iv);
  }, [tour]);

  const pickNode = useCallback((s: Selection) => {
    setTour(false);
    setSelected(s);
  }, []);

  const chooseSection = useCallback((s: Section) => {
    setTour(false);
    setSection(s);
    setSelected(null);
  }, []);

  const cycleSelection = useCallback((dir: 1 | -1) => {
    setTour(false);
    setSelected((prev) => {
      if (!prev || prev.type === "skill") {
        return { type: "era", id: dir === 1 ? eras[0].id : eras[eras.length - 1].id };
      }
      if (prev.type === "project") {
        const i = projects.findIndex((p) => p.id === prev.id);
        const n = (i + dir + projects.length) % projects.length;
        return { type: "project", id: projects[n].id };
      }
      const i = eras.findIndex((e) => e.id === prev.id);
      const n = (i + dir + eras.length) % eras.length;
      return { type: "era", id: eras[n].id };
    });
  }, []);

  useEffect(() => {
    if (mode !== "3d") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTour(false);
        setSelected(null);
        setSection("overview");
      } else if (e.key === "ArrowRight") {
        cycleSelection(1);
      } else if (e.key === "ArrowLeft") {
        cycleSelection(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, cycleSelection]);

  if (mode === "doc") {
    return <StaticView can3d={webgl && !prefersReduced} onLaunch3d={() => setMode("3d")} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#04060a] text-slate-100 font-[family-name:var(--font-manrope)]">
      <Canvas
        camera={{ position: [0, 16, 34], fov: 46, near: 0.1, far: 260 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Scene selected={selected} section={section} onSelect={pickNode} />
      </Canvas>

      {/* atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.72) 100%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.13] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/80">Available for work</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-bricolage)] text-2xl font-extrabold leading-none tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              Allan Rojas
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Senior Software Engineer · {profile.location}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <nav className="flex flex-wrap justify-end gap-1 rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
            {SECTIONS.map((s) => {
              const on = section === s && !selected;
              return (
                <button
                  key={s}
                  onClick={() => chooseSection(s)}
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold capitalize transition ${
                    on ? "bg-emerald-400 text-emerald-950" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5">
            <IconButton title="Document view" onClick={() => setMode("doc")}>
              <FileText className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton title="GitHub" href={profile.contact[2].href} external>
              <Github className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              href="/cv"
              title="Printable CV"
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-300 backdrop-blur-xl transition hover:border-emerald-400/50 hover:text-white"
            >
              <Layers className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/"
              title="Back to site"
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-300 backdrop-blur-xl transition hover:border-emerald-400/50 hover:text-white"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* left dock */}
      <div className="pointer-events-none absolute left-0 top-32 z-20 hidden w-[320px] px-4 sm:block sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto max-h-[calc(100dvh-13rem)] overflow-y-auto rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl"
          >
            {section === "overview" && <OverviewPanel />}
            {section === "timeline" && <TimelinePanel selected={selected} onSelect={pickNode} />}
            {section === "skills" && <SkillsPanel selected={selected} onSelect={pickNode} />}
            {section === "projects" && <ProjectsPanel selected={selected} onSelect={pickNode} />}
            {section === "contact" && <ContactPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* detail panel */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            selected={selected}
            onSelect={pickNode}
            onClose={() => setSelected(null)}
            onCycle={cycleSelection}
          />
        )}
      </AnimatePresence>

      <Scrubber
        selected={selected}
        onSelect={pickNode}
        tour={tour}
        onToggleTour={() => setTour((v) => !v)}
      />

      <AnimatePresence>{showIntro && <IntroOverlay key="intro" />}</AnimatePresence>
    </div>
  );
}
