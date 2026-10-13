'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Trail, Sparkles } from '@react-three/drei';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  Skull,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SEED_CATALOG, colorForRole } from '@/lib/bots/seed-catalog';
import type { Agent, AgentStatus, ActivityEvent, Approval, Discussion, PreferredModel } from '@/lib/bots/types';

// ───────────────────────────────────────────────
// Status metadata driving color + motion everywhere
// ───────────────────────────────────────────────
const STATUS_META: Record<AgentStatus, { label: string; hex: string; pulse: number }> = {
  idle: { label: 'Idle', hex: '#64748b', pulse: 0.08 },
  thinking: { label: 'Thinking', hex: '#a855f7', pulse: 0.22 },
  coding: { label: 'Coding', hex: '#3b82f6', pulse: 0.3 },
  reviewing: { label: 'Reviewing', hex: '#f59e0b', pulse: 0.22 },
  deploying: { label: 'Deploying', hex: '#10b981', pulse: 0.34 },
  active: { label: 'Active', hex: '#22d3ee', pulse: 0.18 },
  paused: { label: 'Paused', hex: '#475569', pulse: 0.03 },
  error: { label: 'Error', hex: '#ef4444', pulse: 0.4 },
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ───────────────────────────────────────────────
// Voice command parsing — "<agent name or role>, <instruction>"
// ───────────────────────────────────────────────
const VOICE_WAKE_WORDS = new Set(['hey', 'ok', 'okay', 'yo']);

function stripWakeWord(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length > 1 && VOICE_WAKE_WORDS.has(words[0].toLowerCase())) {
    return words.slice(1).join(' ');
  }
  return text.trim();
}

function parseVoiceCommand(rawTranscript: string, agents: Agent[]): { agent: Agent | null; instruction: string } {
  const cleaned = stripWakeWord(rawTranscript);
  const lower = cleaned.toLowerCase();

  const candidates: { agent: Agent; phrase: string }[] = [];
  for (const agent of agents) {
    const phrases = new Set([
      agent.name.toLowerCase(),
      agent.role.toLowerCase(),
      agent.name.toLowerCase().replace(/\s*bot$/, ''),
    ]);
    for (const phrase of phrases) {
      if (phrase) candidates.push({ agent, phrase });
    }
  }
  candidates.sort((a, b) => b.phrase.length - a.phrase.length);

  for (const { agent, phrase } of candidates) {
    if (lower === phrase || lower.startsWith(`${phrase},`) || lower.startsWith(`${phrase} `)) {
      const rest = cleaned
        .slice(phrase.length)
        .replace(/^[,:]\s*/, '')
        .replace(/^(please|can you|could you)\s+/i, '')
        .trim();
      return { agent, instruction: rest };
    }
  }

  return { agent: null, instruction: cleaned };
}

// Minimal ambient typing for the (non-standard, Chrome/Edge-only) Web Speech API.
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// ───────────────────────────────────────────────
// Central Neural Core (the living brain)
// ───────────────────────────────────────────────
function NeuralCore({ activity }: { activity: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const spin = 0.15 + activity * 0.35;
    mesh.current.rotation.y = t * spin;
    mesh.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    glow.current.scale.setScalar(1 + Math.sin(t * (2 + activity * 3)) * 0.05);
  });

  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.8, 4]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh ref={glow}>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </mesh>

      <Sparkles count={80} scale={4.5} size={2} speed={0.4} opacity={0.6} color="#67e8f9" />
    </group>
  );
}

// ───────────────────────────────────────────────
// Single Agent Node
// ───────────────────────────────────────────────
function AgentNode({
  agent,
  index,
  total,
  selected,
  onSelect,
}: {
  agent: Agent;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const meta = STATUS_META[agent.status];

  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 6.5;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = agent.status === 'paused' ? 0.02 : meta.pulse;
    const x = Math.cos(angle + t * speed) * radius;
    const z = Math.sin(angle + t * speed) * radius;
    const y = Math.sin(t * 0.5 + index) * 0.6;

    ref.current.position.set(x, y, z);
    ref.current.lookAt(0, 0, 0);
  });

  const emissiveIntensity = agent.status === 'paused' ? 0.4 : hovered || selected ? 2.5 : 1.2;

  return (
    <group ref={ref}>
      <Float speed={agent.status === 'paused' ? 0.4 : 2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => onSelect(agent.id)}
        >
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial
            color={agent.color}
            emissive={agent.color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
            transparent
            opacity={agent.status === 'paused' ? 0.45 : 1}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.55, 32]} />
          <meshBasicMaterial color={meta.hex} transparent opacity={selected ? 0.95 : 0.6} />
        </mesh>
      </Float>

      <Text
        position={[0, 0.85, 0]}
        fontSize={0.28}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {agent.name}
      </Text>

      <Text
        position={[0, 0.55, 0]}
        fontSize={0.18}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
      >
        {agent.currentTask}
      </Text>

      <Trail width={0.6} length={6} color={agent.color} attenuation={(t) => t * t}>
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={agent.color} />
        </mesh>
      </Trail>
    </group>
  );
}

// ───────────────────────────────────────────────
// Main 3D Scene
// ───────────────────────────────────────────────
function Scene({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const activity = agents.length
    ? agents.filter((a) => a.status !== 'idle' && a.status !== 'paused').length / agents.length
    : 0;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#22d3ee" />
      <pointLight position={[10, 10, 10]} intensity={0.8} />

      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.8} />

      <NeuralCore activity={activity} />

      {agents.map((agent, i) => (
        <AgentNode
          key={agent.id}
          agent={agent}
          index={i}
          total={agents.length}
          selected={agent.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={5}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

// ───────────────────────────────────────────────
// HUD: small pieces
// ───────────────────────────────────────────────
function QuotaBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const low = pct < 15;
  return (
    <div className="text-[10px] text-slate-400">
      <div className="flex justify-between mb-0.5">
        <span>{label}</span>
        <span className={low ? 'text-red-400' : 'text-slate-500'}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${low ? 'bg-red-500' : 'bg-cyan-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const QUOTA_MAX = {
  claudeTokens: 2_000_000,
  chatgptTokens: 1_500_000,
  githubActions: 100,
  vercelDeploys: 30,
  dailySpendUSD: 50,
};

// ───────────────────────────────────────────────
// Final Component
// ───────────────────────────────────────────────
export default function GrokArmyVisualization() {
  const [initialSessionLoading, setInitialSessionLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hirePanelOpen, setHirePanelOpen] = useState(false);
  const [hiringRole, setHiringRole] = useState<string | null>(null);
  const [stopBusy, setStopBusy] = useState(false);

  const [taskDraft, setTaskDraft] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatLog, setChatLog] = useState<Record<string, { role: 'user' | 'agent'; content: string }[]>>({});
  const [actionBusy, setActionBusy] = useState(false);

  const [investigatePanelOpen, setInvestigatePanelOpen] = useState(false);
  const [investigateAgentIds, setInvestigateAgentIds] = useState<string[]>([]);
  const [investigateTopic, setInvestigateTopic] = useState('');
  const [investigateRounds, setInvestigateRounds] = useState(4);
  const [investigateBusy, setInvestigateBusy] = useState(false);
  const [investigateError, setInvestigateError] = useState('');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const agentsRef = useRef<Agent[]>([]);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const handleUnauthorized = useCallback(() => {
    setIsLoggedIn(false);
    setAgents([]);
    setActivity([]);
    setApprovals([]);
    setSelectedId(null);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [agentsRes, activityRes, approvalsRes] = await Promise.all([
        fetch('/api/bots', { cache: 'no-store' }),
        fetch('/api/bots/activity', { cache: 'no-store' }),
        fetch('/api/bots/approvals?status=pending', { cache: 'no-store' }),
      ]);

      if (agentsRes.status === 401 || activityRes.status === 401 || approvalsRes.status === 401) {
        handleUnauthorized();
        return;
      }

      const [agentsData, activityData, approvalsData] = await Promise.all([
        parseJsonSafe(agentsRes),
        parseJsonSafe(activityRes),
        parseJsonSafe(approvalsRes),
      ]);

      if (agentsRes.ok) setAgents(agentsData.agents ?? []);
      if (activityRes.ok) setActivity(activityData.feed ?? []);
      if (approvalsRes.ok) setApprovals(approvalsData.approvals ?? []);
      setIsLoggedIn(true);
    } catch {
      setError('Connection to Command lost.');
    } finally {
      setInitialSessionLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = window.setInterval(() => void fetchAll(), 5000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn, fetchAll]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok) {
        setAuthError(data.error || 'Invalid credentials.');
        return;
      }
      setPassword('');
      await fetchAll();
    } catch {
      setAuthError('Could not reach Command. Try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    handleUnauthorized();
    setUsername('');
    setPassword('');
  }

  async function hireFromCatalog(role: typeof SEED_CATALOG[number]) {
    setActionBusy(true);
    setError('');
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.role,
          name: role.name,
          preferredModel: role.defaultModel as PreferredModel,
          color: colorForRole(role.role),
          systemPrompt: `You are ${role.name}, the ${role.role} inside Grok Army Command. ${role.description}. Be decisive, concise, and always state concrete next actions.`,
          firstTask: role.tasks[0],
        }),
      });
      if (res.status === 401) return handleUnauthorized();
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setError(data.error || 'Could not hire agent.');
        return;
      }
      setHirePanelOpen(false);
      await fetchAll();
    } finally {
      setActionBusy(false);
    }
  }

  async function fireAgent(id: string) {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      if (res.status === 401) return handleUnauthorized();
      if (res.ok) {
        setSelectedId(null);
        await fetchAll();
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function togglePause(agent: Agent) {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/bots/${agent.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: agent.status === 'paused' }),
      });
      if (res.status === 401) return handleUnauthorized();
      await fetchAll();
    } finally {
      setActionBusy(false);
    }
  }

  async function assignTask(agent: Agent) {
    if (!taskDraft.trim()) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/bots/${agent.id}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskDraft.trim() }),
      });
      if (res.status === 401) return handleUnauthorized();
      if (res.ok) setTaskDraft('');
      await fetchAll();
    } finally {
      setActionBusy(false);
    }
  }

  async function sendChat(agent: Agent, messageOverride?: string) {
    const message = (messageOverride ?? chatDraft).trim();
    if (!message) return;
    if (messageOverride === undefined) setChatDraft('');
    setChatLog((prev) => ({
      ...prev,
      [agent.id]: [...(prev[agent.id] ?? []), { role: 'user', content: message }],
    }));
    setChatBusy(true);
    try {
      const res = await fetch(`/api/bots/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.status === 401) return handleUnauthorized();
      const data = await parseJsonSafe(res);
      const reply = res.ok ? data.reply : `[error] ${data.error ?? 'Model call failed.'}`;
      setChatLog((prev) => ({
        ...prev,
        [agent.id]: [...(prev[agent.id] ?? []), { role: 'agent', content: reply }],
      }));
      if (res.ok && ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
      }
      await fetchAll();
    } finally {
      setChatBusy(false);
    }
  }

  async function decideApproval(id: string, decision: 'approve' | 'reject') {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/bots/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.status === 401) return handleUnauthorized();
      await fetchAll();
    } finally {
      setActionBusy(false);
    }
  }

  async function emergencyStop(resume: boolean) {
    setStopBusy(true);
    try {
      const res = await fetch('/api/bots/admin/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      if (res.status === 401) return handleUnauthorized();
      await fetchAll();
    } finally {
      setStopBusy(false);
    }
  }

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch('/api/bots/investigate', { cache: 'no-store' });
      if (res.status === 401) return handleUnauthorized();
      const data = await parseJsonSafe(res);
      if (res.ok) setDiscussions(data.discussions ?? []);
    } catch {
      // swallow — the panel just stays empty, roster/activity polling will surface real errors
    }
  }, [handleUnauthorized]);

  function toggleInvestigateAgent(id: string) {
    setInvestigateAgentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function startInvestigation() {
    const topic = investigateTopic.trim();
    if (investigateAgentIds.length === 0) {
      setInvestigateError('Select at least one agent.');
      return;
    }
    if (!topic) {
      setInvestigateError('Give the investigation a topic.');
      return;
    }
    setInvestigateBusy(true);
    setInvestigateError('');
    try {
      const res = await fetch('/api/bots/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: investigateAgentIds, topic, rounds: investigateRounds }),
      });
      if (res.status === 401) return handleUnauthorized();
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setInvestigateError(data.error || 'Investigation failed.');
        return;
      }
      setDiscussions((prev) => [data.discussion, ...prev]);
      setExpandedDiscussionId(data.discussion.id);
      setInvestigateTopic('');
      await fetchAll();
    } catch {
      setInvestigateError('Connection to Command lost mid-investigation.');
    } finally {
      setInvestigateBusy(false);
    }
  }

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  function startListening() {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceStatus('Voice control needs Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interim += result[0].transcript;
      }
      setLiveTranscript(finalTranscript || interim);

      if (finalTranscript.trim()) {
        const { agent, instruction } = parseVoiceCommand(finalTranscript.trim(), agentsRef.current);
        const target = agent ?? agentsRef.current.find((a) => a.id === selectedIdRef.current) ?? null;

        if (!target) {
          setVoiceStatus(
            agentsRef.current.length === 0
              ? 'No agents hired yet — hire one first.'
              : "Didn't catch who — say an agent's name first, e.g. \"CEO Bot, ...\"."
          );
          return;
        }

        setSelectedId(target.id);
        if (!instruction) {
          setVoiceStatus(`Selected ${target.name}. Say a command.`);
          return;
        }
        if (target.status === 'paused') {
          setVoiceStatus(`${target.name} is paused — resume before sending.`);
          return;
        }
        setVoiceStatus(`→ ${target.name}: "${instruction}"`);
        void sendChat(target, instruction);
      }
    };

    recognition.onerror = (event) => {
      setVoiceStatus(event.error === 'not-allowed' ? 'Microphone access denied.' : `Voice error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setLiveTranscript('');
    setVoiceStatus('Listening…');
    setListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  useEffect(() => {
    if (listening || !voiceStatus) return;
    const timeout = window.setTimeout(() => setVoiceStatus(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [voiceStatus, listening]);

  const selectedAgent = useMemo(() => agents.find((a) => a.id === selectedId) ?? null, [agents, selectedId]);
  const activeCount = agents.filter((a) => a.status !== 'idle' && a.status !== 'paused').length;

  if (initialSessionLoading) {
    return (
      <main className="w-full h-screen bg-slate-950 flex items-center justify-center text-cyan-300 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Establishing uplink to Command...
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="w-full h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-black/50 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
          <p className="text-xs uppercase tracking-widest text-cyan-500/70 mb-1">Restricted access</p>
          <h1 className="text-2xl font-bold text-white mb-2">Grok Army Command</h1>
          <p className="text-sm text-slate-400 mb-6">Admin credentials required to observe or command the army.</p>
          {authError && <p className="text-sm text-red-400 mb-4">{authError}</p>}
          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold py-2 text-sm transition"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Authenticate
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <Canvas camera={{ position: [0, 4, 14], fov: 50 }} dpr={[1, 2]}>
        <Scene agents={agents} selectedId={selectedId} onSelect={setSelectedId} />
      </Canvas>

      {/* Top bar */}
      <div className="absolute top-6 left-6 text-white pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-cyan-300">Grok Army Command</h1>
        <p className="text-sm text-slate-400 mt-1">
          Live Neural Orchestration • {agents.length} Agents Hired • {activeCount} Active
        </p>
        {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => setHirePanelOpen((v) => !v)}
          className="pointer-events-auto rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 text-xs font-semibold px-3 py-2 transition"
        >
          + Hire agent
        </button>
        <button
          onClick={() => {
            setInvestigatePanelOpen((v) => !v);
            void fetchDiscussions();
          }}
          className="pointer-events-auto flex items-center gap-1 rounded-lg bg-purple-500/90 hover:bg-purple-400 text-slate-950 text-xs font-semibold px-3 py-2 transition"
        >
          <Users className="h-3.5 w-3.5" /> Investigate
        </button>
        <button
          onClick={() => emergencyStop(false)}
          disabled={stopBusy}
          className="pointer-events-auto flex items-center gap-1 rounded-lg bg-red-500/90 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 transition"
        >
          <Skull className="h-3.5 w-3.5" /> Emergency stop
        </button>
        <button
          onClick={() => emergencyStop(true)}
          disabled={stopBusy}
          className="pointer-events-auto flex items-center gap-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-semibold px-3 py-2 transition"
        >
          <Play className="h-3.5 w-3.5" /> Resume all
        </button>
        <button
          onClick={() => setTtsEnabled((v) => !v)}
          title={ttsEnabled ? 'Voice replies on' : 'Voice replies off'}
          className={`pointer-events-auto flex items-center gap-1 rounded-lg text-xs font-semibold px-3 py-2 transition ${
            ttsEnabled
              ? 'bg-cyan-500/90 hover:bg-cyan-400 text-slate-950'
              : 'bg-black/40 border border-slate-700 hover:border-slate-500 text-slate-300'
          }`}
        >
          {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => (listening ? stopListening() : startListening())}
          disabled={!voiceSupported}
          title={voiceSupported ? "Say \"<agent name>, <instruction>\"" : 'Voice control needs Chrome or Edge'}
          className={`pointer-events-auto flex items-center gap-1 rounded-lg text-xs font-semibold px-3 py-2 transition disabled:opacity-40 ${
            listening
              ? 'bg-red-500/90 hover:bg-red-400 text-white animate-pulse'
              : 'bg-black/40 border border-slate-700 hover:border-cyan-500 text-slate-300'
          }`}
        >
          {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {listening ? 'Listening…' : 'Voice'}
        </button>
        <button
          onClick={handleLogout}
          className="pointer-events-auto flex items-center gap-1 rounded-lg bg-black/40 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-3 py-2 transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      {/* Voice status */}
      {(listening || voiceStatus) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none max-w-md w-full px-4">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 text-center">
            {listening && (
              <p className="text-xs text-cyan-300 flex items-center justify-center gap-1.5">
                <Mic className="h-3 w-3 animate-pulse" /> {liveTranscript || 'Listening…'}
              </p>
            )}
            {voiceStatus && !listening && <p className="text-xs text-slate-300">{voiceStatus}</p>}
          </div>
        </div>
      )}

      {/* Roster + activity feed (left) */}
      <div className="absolute left-6 top-28 bottom-24 w-72 flex flex-col gap-3 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-3 overflow-y-auto flex-1">
          <p className="text-[10px] uppercase tracking-widest text-cyan-500/70 mb-2">Roster</p>
          {agents.length === 0 && (
            <p className="text-xs text-slate-500">No agents hired yet. Use “Hire agent” to staff the army.</p>
          )}
          <div className="space-y-2">
            {agents.map((agent) => {
              const meta = STATUS_META[agent.status];
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedId(agent.id)}
                  className={`w-full text-left rounded-lg border px-2.5 py-2 transition ${
                    selectedId === agent.id
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{agent.name}</span>
                    <span className="text-[10px]" style={{ color: meta.hex }}>
                      ● {meta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{agent.currentTask}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-3 h-48 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-cyan-500/70 mb-2 flex items-center gap-1">
            <Radio className="h-3 w-3" /> Activity feed
          </p>
          <div className="space-y-1.5">
            {activity.length === 0 && <p className="text-xs text-slate-500">No activity yet.</p>}
            {activity.map((event) => (
              <div key={event.id} className="text-[11px] text-slate-400">
                <span className="text-slate-600">{timeAgo(event.createdAt)}</span>{' '}
                <span className="text-slate-300">{event.agentName}</span> — {event.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals queue (right) */}
      {approvals.length > 0 && (
        <div className="absolute right-6 top-28 w-72 bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-xl p-3 pointer-events-auto max-h-80 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">
            Approval queue ({approvals.length})
          </p>
          <div className="space-y-2">
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-lg border border-slate-800 p-2">
                <p className="text-[11px] text-slate-300">
                  <span className="text-amber-400 uppercase">{approval.action}</span> · {approval.agentName}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{approval.summary}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    disabled={actionBusy}
                    onClick={() => decideApproval(approval.id, 'approve')}
                    className="flex-1 rounded bg-emerald-500/90 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[11px] font-semibold py-1"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionBusy}
                    onClick={() => decideApproval(approval.id, 'reject')}
                    className="flex-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-[11px] font-semibold py-1"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hire panel */}
      {hirePanelOpen && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto z-20">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-950 border border-cyan-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cyan-300">Hire from catalog</h2>
              <button onClick={() => setHirePanelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEED_CATALOG.map((role) => (
                <div key={role.role} className="rounded-xl border border-slate-800 p-3 hover:border-cyan-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{role.name}</span>
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded-full border border-slate-700 text-slate-400"
                    >
                      {role.defaultModel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{role.description}</p>
                  <button
                    disabled={actionBusy}
                    onClick={() => hireFromCatalog(role)}
                    onMouseEnter={() => setHiringRole(role.role)}
                    className="mt-3 w-full rounded-lg bg-cyan-500/90 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-semibold py-1.5"
                  >
                    {actionBusy && hiringRole === role.role ? 'Hiring…' : `Hire ${role.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investigation room: agents read the repo and discuss it with each other */}
      {investigatePanelOpen && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto z-20">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                <Users className="h-4 w-4" /> Investigation room
              </h2>
              <button onClick={() => setInvestigatePanelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Agents read this repo&apos;s real source (app/, lib/) and take turns discussing it. They only
              analyze and advise — acting on a finding still goes through the normal commit → PR → approval flow.
            </p>

            <div className="rounded-xl border border-slate-800 p-3 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Participants</p>
                {agents.length === 0 ? (
                  <p className="text-xs text-slate-500">Hire at least one agent first.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {agents.map((agent) => {
                      const active = investigateAgentIds.includes(agent.id);
                      return (
                        <button
                          key={agent.id}
                          onClick={() => toggleInvestigateAgent(agent.id)}
                          disabled={agent.status === 'paused'}
                          className={`text-[11px] rounded-full px-2.5 py-1 border transition disabled:opacity-40 ${
                            active
                              ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                              : 'border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {agent.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <input
                value={investigateTopic}
                onChange={(e) => setInvestigateTopic(e.target.value)}
                placeholder='Topic — e.g. "find bugs in the reservation capacity logic"'
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 outline-none"
              />

              <div className="flex items-center gap-3">
                <label className="text-[11px] text-slate-400 flex items-center gap-2">
                  Rounds
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={investigateRounds}
                    onChange={(e) => setInvestigateRounds(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-14 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </label>
                <button
                  disabled={investigateBusy}
                  onClick={startInvestigation}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-500/90 hover:bg-purple-400 disabled:opacity-50 text-slate-950 text-xs font-semibold py-1.5"
                >
                  {investigateBusy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Investigating…
                    </>
                  ) : (
                    'Start investigation'
                  )}
                </button>
              </div>
              {investigateError && <p className="text-xs text-red-400">{investigateError}</p>}
            </div>

            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Past investigations</p>
              {discussions.length === 0 && <p className="text-xs text-slate-500">None yet.</p>}
              <div className="space-y-2">
                {discussions.map((d) => {
                  const expanded = expandedDiscussionId === d.id;
                  return (
                    <div key={d.id} className="rounded-lg border border-slate-800">
                      <button
                        onClick={() => setExpandedDiscussionId(expanded ? null : d.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-slate-200 truncate">{d.topic}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {d.participantNames.join(', ')} · {d.status} · {timeAgo(d.createdAt)}
                          </p>
                        </div>
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        )}
                      </button>
                      {expanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-800 pt-2">
                          {d.turns.map((turn, i) => (
                            <div key={i} className="text-xs">
                              <span className="text-purple-300 font-semibold">{turn.agentName}: </span>
                              <span className="text-slate-300">{turn.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent detail / chat panel */}
      {selectedAgent && (
        <div className="absolute right-6 bottom-24 w-96 max-h-[60vh] bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 pointer-events-auto flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: STATUS_META[selectedAgent.status].hex }}>
                {STATUS_META[selectedAgent.status].label} · {selectedAgent.role}
              </p>
              <h3 className="text-white font-bold">{selectedAgent.name}</h3>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <QuotaBar label="Claude tokens" value={selectedAgent.quotas.claudeTokens} max={QUOTA_MAX.claudeTokens} />
            <QuotaBar label="ChatGPT tokens" value={selectedAgent.quotas.chatgptTokens} max={QUOTA_MAX.chatgptTokens} />
            <QuotaBar label="GitHub actions" value={selectedAgent.quotas.githubActions} max={QUOTA_MAX.githubActions} />
            <QuotaBar label="Vercel deploys" value={selectedAgent.quotas.vercelDeploys} max={QUOTA_MAX.vercelDeploys} />
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              placeholder="Assign a new task…"
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
            />
            <button
              disabled={actionBusy}
              onClick={() => assignTask(selectedAgent)}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold px-2.5"
            >
              Assign
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              disabled={actionBusy}
              onClick={() => togglePause(selectedAgent)}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold py-1.5"
            >
              {selectedAgent.status === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {selectedAgent.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              disabled={actionBusy}
              onClick={() => fireAgent(selectedAgent.id)}
              className="flex-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-300 text-xs font-semibold py-1.5"
            >
              Fire agent
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 min-h-[80px]">
            {(chatLog[selectedAgent.id] ?? []).map((entry, i) => (
              <div
                key={i}
                className={`text-xs rounded-lg px-2.5 py-1.5 ${
                  entry.role === 'user' ? 'bg-cyan-500/10 text-cyan-100 ml-6' : 'bg-slate-800/60 text-slate-200 mr-6'
                }`}
              >
                {entry.content}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat(selectedAgent)}
              placeholder={`Message ${selectedAgent.name}…`}
              disabled={selectedAgent.status === 'paused'}
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none disabled:opacity-50"
            />
            <button
              disabled={chatBusy || selectedAgent.status === 'paused'}
              onClick={() => sendChat(selectedAgent)}
              className="rounded-lg bg-cyan-500/90 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-semibold px-3"
            >
              {chatBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl px-5 py-3 text-sm text-slate-300">
          <span className="text-cyan-400">●</span> Central Core: Grok Orchestrator
        </div>
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl px-5 py-3 text-sm text-slate-300">
          Drag to rotate • Scroll to zoom • Click an agent{voiceSupported ? ' • Voice: "<agent>, <instruction>"' : ''}
        </div>
      </div>
    </div>
  );
}
