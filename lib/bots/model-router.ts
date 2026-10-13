import OpenAI from "openai";
import type { PreferredModel } from "./types";

export interface ModelResult {
  content: string;
  tokensUsed: number;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  cacheKey?: string,
): Promise<ModelResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured — this agent cannot think right now.");
  }
  const model = process.env.ANTHROPIC_BOTS_MODEL?.trim() || "claude-sonnet-4-5-20250929";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      // System prompt carries the stable prefix (agent persona + repo context).
      // A cache_control breakpoint at its end lets Anthropic serve it from the
      // prompt cache on repeat turns instead of re-billing every token.
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
      // Keeps a session's requests routed to the same warm cache node.
      ...(cacheKey ? { metadata: { user_id: cacheKey } } : {}),
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude call failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const textBlock = Array.isArray(data.content)
    ? data.content.find((block: { type: string }) => block.type === "text")
    : null;

  const usage = data.usage ?? {};
  const freshInput = usage.input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  if (cacheRead || cacheWrite) {
    const totalIn = freshInput + cacheRead + cacheWrite;
    const rate = totalIn ? Math.round((cacheRead / totalIn) * 100) : 0;
    console.info(
      `[bots/claude] cache ${rate}% read=${cacheRead} write=${cacheWrite} fresh=${freshInput}`,
    );
  }

  return {
    content: textBlock?.text ?? "",
    // Count cached tokens too, so quota accounting stays consistent with the
    // pre-cache behaviour where all input landed in input_tokens.
    tokensUsed: freshInput + cacheRead + cacheWrite + output,
  };
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  cacheKey?: string,
): Promise<ModelResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured — this agent cannot think right now.");
  }
  const model = process.env.OPENAI_BOTS_MODEL?.trim()
    || process.env.OPENAI_ASSISTANT_MODEL?.trim()
    || process.env.OPENAI_MODEL?.trim()
    || "gpt-5.6-luna";

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create(
    {
      model,
      prompt_cache_key: cacheKey || undefined,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    },
    { signal: AbortSignal.timeout(30_000) }
  );

  const usage = response.usage;
  if (usage) {
    const cached = usage.input_tokens_details?.cached_tokens ?? 0;
    if (cached) {
      const rate = usage.input_tokens ? Math.round((cached / usage.input_tokens) * 100) : 0;
      console.info(`[bots/openai] cache ${rate}% (${cached}/${usage.input_tokens} in)`);
    }
  }

  return {
    content: response.output_text ?? "",
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}

export async function callModel(
  preferredModel: PreferredModel,
  systemPrompt: string,
  userMessage: string,
  cacheKey?: string,
): Promise<ModelResult> {
  return preferredModel === "claude"
    ? callClaude(systemPrompt, userMessage, cacheKey)
    : callOpenAI(systemPrompt, userMessage, cacheKey);
}
