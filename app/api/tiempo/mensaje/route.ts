/**
 * /api/tiempo/mensaje
 * Returns a unique, AI-generated funny weather comment every time it's called.
 * Response is never cached so the message changes on every reload.
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt, type WeatherSnapshot } from "@/lib/helpers/weatherMessageHelpers";
import {
  WEATHER_MESSAGE_CACHE_HEADERS,
  WEATHER_MESSAGE_DEFAULT_TEXT,
  WEATHER_MESSAGE_ERROR_FALLBACK,
  WEATHER_MESSAGE_FALLBACK_CACHE_HEADERS,
  WEATHER_MESSAGE_MAX_TOKENS,
} from "@/lib/constants/weatherMessageConstants";

const WEATHER_MESSAGE_MODEL =
  process.env.OPENAI_WEATHER_MODEL?.trim() ||
  process.env.OPENAI_MODEL?.trim() ||
  "gpt-5.6-luna";

export async function POST(req: NextRequest) {
  try {
    const snap: WeatherSnapshot = await req.json();
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { message: WEATHER_MESSAGE_ERROR_FALLBACK },
        {
          status: 200,
          headers: {
            ...WEATHER_MESSAGE_FALLBACK_CACHE_HEADERS,
            "X-AI-Mode": "openai-unconfigured",
          },
        }
      );
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: WEATHER_MESSAGE_MODEL,
      instructions: buildSystemPrompt(),
      input: buildUserPrompt(snap),
      max_output_tokens: WEATHER_MESSAGE_MAX_TOKENS,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
    });

    const text = response.output_text.trim() || WEATHER_MESSAGE_DEFAULT_TEXT;

    return NextResponse.json(
      { message: text },
      {
        headers: {
          ...WEATHER_MESSAGE_CACHE_HEADERS,
          "X-AI-Mode": "openai",
        },
      }
    );
  } catch (err) {
    console.error("[tiempo/mensaje]", err);
    // Fallback so the page never breaks if OpenAI is unreachable.
    return NextResponse.json(
      { message: WEATHER_MESSAGE_ERROR_FALLBACK },
      { status: 200, headers: WEATHER_MESSAGE_FALLBACK_CACHE_HEADERS }
    );
  }
}
