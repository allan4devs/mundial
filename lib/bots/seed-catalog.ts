import seedRoles from "./ready-to-hire.json";
import type { SeedRole } from "./types";

export const SEED_CATALOG = seedRoles as SeedRole[];

const ROLE_COLORS: Record<string, string> = {
  CEO: "#f59e0b",
  CTO: "#3b82f6",
  COO: "#14b8a6",
  CMO: "#06b6d4",
  CFO: "#eab308",
  "Product Manager": "#ec4899",
  "Research Lead": "#a855f7",
  "Engineering Lead": "#22c55e",
  "DevOps / SRE": "#10b981",
  "Design / UX": "#f472b6",
  Security: "#ef4444",
  "Data / Analytics": "#8b5cf6",
  "Customer Success": "#38bdf8",
  Sales: "#fb923c",
  "Legal / Compliance": "#94a3b8",
};

export function colorForRole(role: string): string {
  return ROLE_COLORS[role] ?? "#67e8f9";
}

export const DEFAULT_QUOTAS = {
  claudeTokens: 2_000_000,
  chatgptTokens: 1_500_000,
  githubActions: 100,
  vercelDeploys: 30,
  dailySpendUSD: 50,
};
