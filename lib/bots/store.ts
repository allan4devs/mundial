import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { DEFAULT_QUOTAS } from "./seed-catalog";
import type {
  Agent,
  AgentDoc,
  AgentQuotas,
  AgentStatus,
  ActivityDoc,
  ActivityEvent,
  ActivityType,
  ApprovalAction,
  ApprovalDoc,
  Approval,
  PreferredModel,
} from "./types";

async function agentsCol(): Promise<Collection<AgentDoc>> {
  const db = await getDb();
  return db.collection<AgentDoc>(COLLECTIONS.BOT_AGENTS);
}

async function activityCol(): Promise<Collection<ActivityDoc>> {
  const db = await getDb();
  return db.collection<ActivityDoc>(COLLECTIONS.BOT_ACTIVITY);
}

async function approvalsCol(): Promise<Collection<ApprovalDoc>> {
  const db = await getDb();
  return db.collection<ApprovalDoc>(COLLECTIONS.BOT_APPROVALS);
}

function serializeAgent(doc: AgentDoc): Agent {
  return {
    id: String(doc._id),
    role: doc.role,
    name: doc.name,
    color: doc.color,
    preferredModel: doc.preferredModel,
    systemPrompt: doc.systemPrompt,
    status: doc.status,
    currentTask: doc.currentTask,
    quotas: doc.quotas,
    hiredBy: doc.hiredBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function serializeActivity(doc: ActivityDoc): ActivityEvent {
  return {
    id: String(doc._id),
    agentId: doc.agentId,
    agentName: doc.agentName,
    type: doc.type,
    content: doc.content,
    model: doc.model,
    tokens: doc.tokens,
    createdAt: doc.createdAt.toISOString(),
  };
}

function serializeApproval(doc: ApprovalDoc): Approval {
  return {
    id: String(doc._id),
    agentId: doc.agentId,
    agentName: doc.agentName,
    action: doc.action,
    summary: doc.summary,
    status: doc.status,
    requestedAt: doc.requestedAt.toISOString(),
    decidedBy: doc.decidedBy,
    decidedAt: doc.decidedAt?.toISOString(),
  };
}

export async function listAgents(): Promise<Agent[]> {
  const col = await agentsCol();
  const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
  return docs.map(serializeAgent);
}

export async function getAgentDoc(id: string): Promise<AgentDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await agentsCol();
  return col.findOne({ _id: new ObjectId(id) } as never);
}

export async function hireAgent(input: {
  role: string;
  name: string;
  color: string;
  preferredModel: PreferredModel;
  systemPrompt: string;
  firstTask: string;
  hiredBy: string;
}): Promise<Agent> {
  const col = await agentsCol();
  const now = new Date();
  const doc: AgentDoc = {
    role: input.role,
    name: input.name,
    color: input.color,
    preferredModel: input.preferredModel,
    systemPrompt: input.systemPrompt,
    status: "idle",
    currentTask: input.firstTask || "Awaiting assignment",
    quotas: { ...DEFAULT_QUOTAS },
    hiredBy: input.hiredBy,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc);
  const agent = serializeAgent({ ...doc, _id: result.insertedId });
  await logActivity({
    agentId: agent.id,
    agentName: agent.name,
    type: "hired",
    content: `${agent.name} hired as ${agent.role}`,
  });
  return agent;
}

export async function fireAgent(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await agentsCol();
  const result = await col.deleteOne({ _id: new ObjectId(id) } as never);
  return result.deletedCount === 1;
}

export async function setStatus(id: string, status: AgentStatus): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const col = await agentsCol();
  await col.updateOne(
    { _id: new ObjectId(id) } as never,
    { $set: { status, updatedAt: new Date() } }
  );
}

export async function assignTask(id: string, task: string): Promise<Agent | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await agentsCol();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) } as never,
    { $set: { currentTask: task, status: "thinking", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  const agent = serializeAgent(result);
  await logActivity({
    agentId: agent.id,
    agentName: agent.name,
    type: "task_assigned",
    content: task,
  });
  return agent;
}

export async function pauseAgent(id: string): Promise<Agent | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await agentsCol();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) } as never,
    { $set: { status: "paused", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  const agent = serializeAgent(result);
  await logActivity({ agentId: agent.id, agentName: agent.name, type: "paused", content: "Agent paused" });
  return agent;
}

export async function resumeAgent(id: string): Promise<Agent | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await agentsCol();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) } as never,
    { $set: { status: "idle", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  const agent = serializeAgent(result);
  await logActivity({ agentId: agent.id, agentName: agent.name, type: "resumed", content: "Agent resumed" });
  return agent;
}

export async function pauseAllAgents(): Promise<number> {
  const col = await agentsCol();
  const result = await col.updateMany(
    { status: { $ne: "paused" } },
    { $set: { status: "paused", updatedAt: new Date() } }
  );
  await logActivity({
    agentId: "system",
    agentName: "System",
    type: "paused",
    content: "Emergency stop triggered — all agents paused",
  });
  return result.modifiedCount;
}

export async function resumeAllAgents(): Promise<number> {
  const col = await agentsCol();
  const result = await col.updateMany(
    { status: "paused" },
    { $set: { status: "idle", updatedAt: new Date() } }
  );
  await logActivity({
    agentId: "system",
    agentName: "System",
    type: "resumed",
    content: "All agents resumed",
  });
  return result.modifiedCount;
}

export class QuotaExceededError extends Error {
  constructor(public quotaType: keyof AgentQuotas) {
    super(`Insufficient ${quotaType} quota`);
  }
}

export async function decreaseQuota(
  id: string,
  type: keyof AgentQuotas,
  amount: number
): Promise<Agent> {
  if (amount <= 0) {
    const doc = await getAgentDoc(id);
    if (!doc) throw new Error("Agent not found");
    return serializeAgent(doc);
  }
  const col = await agentsCol();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id), [`quotas.${type}`]: { $gte: amount } } as never,
    { $inc: { [`quotas.${type}`]: -amount }, $set: { updatedAt: new Date() } } as never,
    { returnDocument: "after" }
  );
  if (!result) throw new QuotaExceededError(type);

  if (result.quotas[type] <= 0) {
    await col.updateOne(
      { _id: result._id } as never,
      { $set: { status: "paused", updatedAt: new Date() } }
    );
    result.status = "paused";
    await logActivity({
      agentId: String(result._id),
      agentName: result.name,
      type: "paused",
      content: `${type} quota exhausted — agent auto-paused`,
    });
  }

  return serializeAgent(result);
}

export async function logActivity(input: {
  agentId: string;
  agentName: string;
  type: ActivityType;
  content: string;
  model?: PreferredModel;
  tokens?: number;
}): Promise<ActivityEvent> {
  const col = await activityCol();
  const doc: ActivityDoc = {
    agentId: input.agentId,
    agentName: input.agentName,
    type: input.type,
    content: input.content,
    model: input.model,
    tokens: input.tokens,
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return serializeActivity({ ...doc, _id: result.insertedId });
}

export async function listActivity(limit = 50): Promise<ActivityEvent[]> {
  const col = await activityCol();
  const docs = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(serializeActivity);
}

export async function createApproval(input: {
  agentId: string;
  agentName: string;
  action: ApprovalAction;
  summary: string;
}): Promise<Approval> {
  const col = await approvalsCol();
  const doc: ApprovalDoc = {
    agentId: input.agentId,
    agentName: input.agentName,
    action: input.action,
    summary: input.summary,
    status: "pending",
    requestedAt: new Date(),
  };
  const result = await col.insertOne(doc);
  await logActivity({
    agentId: input.agentId,
    agentName: input.agentName,
    type: "approval_requested",
    content: `${input.action} requires approval: ${input.summary}`,
  });
  return serializeApproval({ ...doc, _id: result.insertedId });
}

export async function listApprovals(status?: "pending" | "approve" | "reject"): Promise<Approval[]> {
  const col = await approvalsCol();
  const query = status ? { status } : {};
  const docs = await col.find(query).sort({ requestedAt: -1 }).limit(100).toArray();
  return docs.map(serializeApproval);
}

export async function getApprovalDoc(id: string): Promise<ApprovalDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await approvalsCol();
  return col.findOne({ _id: new ObjectId(id) } as never);
}

export async function decideApproval(
  id: string,
  decision: "approve" | "reject",
  adminUsername: string
): Promise<Approval | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await approvalsCol();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" } as never,
    { $set: { status: decision, decidedBy: adminUsername, decidedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  await logActivity({
    agentId: result.agentId,
    agentName: result.agentName,
    type: "approval_decided",
    content: `${result.action} ${decision === "approve" ? "approved" : "rejected"} by ${adminUsername}`,
  });
  return serializeApproval(result);
}

export async function getQuotaSummary(): Promise<Pick<Agent, "id" | "name" | "role" | "status" | "quotas">[]> {
  const col = await agentsCol();
  const docs = await col
    .find({}, { projection: { name: 1, role: 1, quotas: 1, status: 1 } })
    .toArray();
  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    role: doc.role,
    status: doc.status,
    quotas: doc.quotas,
  }));
}
