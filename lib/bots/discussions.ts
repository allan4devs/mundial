import { Collection } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { callModel } from "./model-router";
import { buildRepoContext } from "./repo-knowledge";
import { getAgentDoc, decreaseQuota, logActivity } from "./store";
import type { AgentDoc, Discussion, DiscussionDoc, DiscussionTurnDoc } from "./types";

async function discussionsCol(): Promise<Collection<DiscussionDoc>> {
  const db = await getDb();
  return db.collection<DiscussionDoc>(COLLECTIONS.BOT_DISCUSSIONS);
}

function serialize(doc: DiscussionDoc): Discussion {
  return {
    id: String(doc._id),
    topic: doc.topic,
    participantIds: doc.participantIds,
    participantNames: doc.participantNames,
    turns: doc.turns.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    status: doc.status,
    error: doc.error,
    requestedBy: doc.requestedBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listDiscussions(limit = 20): Promise<Discussion[]> {
  const col = await discussionsCol();
  const docs = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(serialize);
}

/**
 * Runs a bounded, admin-triggered multi-agent discussion grounded in real
 * repo content. Agents take turns responding to the accumulated transcript;
 * nothing here writes to the repo — findings are advisory text only. Acting
 * on a suggestion (e.g. committing a fix) still goes through the existing
 * commit → PR → human-approved-merge pipeline.
 */
export async function runInvestigation(input: {
  agentIds: string[];
  topic: string;
  rounds: number;
  requestedBy: string;
}): Promise<Discussion> {
  const uniqueIds = Array.from(new Set(input.agentIds));
  const agentDocs: AgentDoc[] = [];
  for (const id of uniqueIds) {
    const doc = await getAgentDoc(id);
    if (doc) agentDocs.push(doc);
  }
  if (agentDocs.length === 0) {
    throw new Error("No valid agents selected.");
  }

  const active = agentDocs.filter((a) => a.status !== "paused");
  if (active.length === 0) {
    throw new Error("All selected agents are paused.");
  }

  const repoContext = await buildRepoContext(input.topic);
  const col = await discussionsCol();
  const now = new Date();

  const doc: DiscussionDoc = {
    topic: input.topic,
    participantIds: active.map((a) => String(a._id)),
    participantNames: active.map((a) => a.name),
    repoContext,
    turns: [],
    status: "running",
    requestedBy: input.requestedBy,
    createdAt: now,
    updatedAt: now,
  };
  const inserted = await col.insertOne(doc);
  doc._id = inserted.insertedId;

  await logActivity({
    agentId: "system",
    agentName: "System",
    type: "discussion",
    content: `Investigation started: "${input.topic}" with ${active.map((a) => a.name).join(", ")}`,
  });

  for (let i = 0; i < input.rounds; i++) {
    const agent = active[i % active.length];
    const agentId = String(agent._id);
    const others = active
      .filter((a) => String(a._id) !== agentId)
      .map((a) => a.name)
      .join(", ") || "no one else yet";
    const transcript = doc.turns.length
      ? doc.turns.map((t) => `${t.agentName}: ${t.content}`).join("\n\n")
      : "(no messages yet — you go first)";
    const isFinal = i === input.rounds - 1;

    // Stable prefix: agent persona + collaboration rules + repo context are the
    // same on every one of this agent's turns in the investigation, so they stay
    // at the top for prompt-cache hits. The round transcript and the final-round
    // flag are volatile and go in the user turn.
    const systemPrompt = `${agent.systemPrompt}

You are one of several agents jointly investigating this codebase (La Vieja Adventures, a Next.js tour-booking app) alongside: ${others}. Ground every claim in the repo context below — cite real file paths from it. Be concise, under 120 words, and build on or challenge prior points rather than repeating them. You are analyzing and advising only — you cannot edit files directly.

REPO CONTEXT:
${repoContext}`;
    const userMessage = `INVESTIGATION TOPIC: ${input.topic}

DISCUSSION SO FAR:
${transcript}
${isFinal ? "\nThis is the final round: end with one concrete, actionable recommendation.\n" : ""}
Your turn, ${agent.name}:`;

    let content: string;
    try {
      const result = await callModel(
        agent.preferredModel,
        systemPrompt,
        userMessage,
        `discussion:${doc._id}:${agentId}`,
      );
      content = result.content?.trim() || "(no response)";
      const quotaType = agent.preferredModel === "claude" ? "claudeTokens" : "chatgptTokens";
      await decreaseQuota(agentId, quotaType, result.tokensUsed).catch(() => {});
    } catch (err) {
      content = `[error: ${err instanceof Error ? err.message : "model call failed"}]`;
    }

    const turn: DiscussionTurnDoc = { agentId, agentName: agent.name, content, createdAt: new Date() };
    doc.turns.push(turn);
    await col.updateOne(
      { _id: doc._id } as never,
      { $push: { turns: turn }, $set: { updatedAt: new Date() } } as never
    );
    await logActivity({ agentId, agentName: agent.name, type: "discussion", content: content.slice(0, 240) });
  }

  await col.updateOne({ _id: doc._id } as never, { $set: { status: "completed", updatedAt: new Date() } });
  doc.status = "completed";

  return serialize(doc);
}
