import type { ObjectId } from "mongodb";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "coding"
  | "reviewing"
  | "deploying"
  | "active"
  | "paused"
  | "error";

export type PreferredModel = "claude" | "chatgpt";

export interface AgentQuotas {
  claudeTokens: number;
  chatgptTokens: number;
  githubActions: number;
  vercelDeploys: number;
  dailySpendUSD: number;
}

export interface AgentDoc {
  _id?: ObjectId;
  role: string;
  name: string;
  color: string;
  preferredModel: PreferredModel;
  systemPrompt: string;
  status: AgentStatus;
  currentTask: string;
  quotas: AgentQuotas;
  hiredBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  role: string;
  name: string;
  color: string;
  preferredModel: PreferredModel;
  systemPrompt: string;
  status: AgentStatus;
  currentTask: string;
  quotas: AgentQuotas;
  hiredBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | "hired"
  | "task_assigned"
  | "chat"
  | "commit"
  | "pull_request"
  | "approval_requested"
  | "approval_decided"
  | "deploy"
  | "paused"
  | "resumed"
  | "discussion"
  | "error";

export interface ActivityDoc {
  _id?: ObjectId;
  agentId: string;
  agentName: string;
  type: ActivityType;
  content: string;
  model?: PreferredModel;
  tokens?: number;
  createdAt: Date;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: ActivityType;
  content: string;
  model?: PreferredModel;
  tokens?: number;
  createdAt: string;
}

export type ApprovalAction = "merge" | "deploy";
export type ApprovalStatus = "pending" | "approve" | "reject";

export interface ApprovalDoc {
  _id?: ObjectId;
  agentId: string;
  agentName: string;
  action: ApprovalAction;
  summary: string;
  status: ApprovalStatus;
  requestedAt: Date;
  decidedBy?: string;
  decidedAt?: Date;
}

export interface Approval {
  id: string;
  agentId: string;
  agentName: string;
  action: ApprovalAction;
  summary: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface SeedRole {
  role: string;
  name: string;
  description: string;
  defaultModel: PreferredModel;
  tasks: string[];
}

export type DiscussionStatus = "running" | "completed" | "error";

export interface DiscussionTurnDoc {
  agentId: string;
  agentName: string;
  content: string;
  createdAt: Date;
}

export interface DiscussionTurn {
  agentId: string;
  agentName: string;
  content: string;
  createdAt: string;
}

export interface DiscussionDoc {
  _id?: ObjectId;
  topic: string;
  participantIds: string[];
  participantNames: string[];
  repoContext: string;
  turns: DiscussionTurnDoc[];
  status: DiscussionStatus;
  error?: string;
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Discussion {
  id: string;
  topic: string;
  participantIds: string[];
  participantNames: string[];
  turns: DiscussionTurn[];
  status: DiscussionStatus;
  error?: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}
