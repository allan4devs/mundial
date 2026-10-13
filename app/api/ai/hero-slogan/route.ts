import { NextResponse } from "next/server";
import OpenAI from "openai";

const SLOGAN_MODEL =
  process.env.OPENAI_SLOGAN_MODEL?.trim() ||
  process.env.OPENAI_MODEL?.trim() ||
  "gpt-5.6-luna";
const USER_PROMPT = "Genera un slogan fresco y único para hoy.";

const SYSTEM_PROMPT = `Eres el copywriter creativo de La Vieja Adventures, un tour de cañón en Ciudad Esmeralda sobre el Río La Vieja en San Carlos, Costa Rica. El lugar está dentro de la cuenca del Parque Nacional del Agua Juan Castro Blanco: bosque tropical exuberante, cañones de agua cristalina, cascadas, biodiversidad espectacular y una experiencia de aventura pura e irrepetible.

Tu misión: generar UN slogan héroe único, poético y emocionalmente poderoso para el sitio web.

Reglas:
- Una sola oración por idioma (máximo 12 palabras)
- Evocador, visual, que haga SENTIR la magia del lugar
- Menciona el cañón, el río, la naturaleza o la aventura
- Tono de marca de aventura premium
- Completamente diferente en cada generación — varía metáforas, verbos, imágenes
- Sin clichés como "únicos recuerdos" o "experiencia inolvidable"

Devuelve ÚNICAMENTE un objeto JSON con esta forma exacta:
{"es": "<slogan en español>", "en": "<slogan en inglés>"}
Sin texto adicional.`;

type HeroSloganPayload = {
  es: string;
  en: string;
};

const FALLBACKS: HeroSloganPayload[] = [
  {
    es: "Donde el cañón guarda secretos que solo el agua conoce.",
    en: "Where the canyon keeps secrets only the river knows.",
  },
  {
    es: "El río La Vieja te llama — ¿te atreves a responder?",
    en: "The La Vieja river calls — do you dare to answer?",
  },
  {
    es: "Un cañón vivo, un río salvaje, una aventura que te cambia.",
    en: "A living canyon, a wild river, an adventure that changes you.",
  },
];

function getFallbackSlogan(): HeroSloganPayload {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function extractJsonPayload(rawText: string): HeroSloganPayload {
  const trimmed = rawText.trim();

  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  const parsed = JSON.parse(candidate) as Partial<HeroSloganPayload>;
  if (!parsed.es || !parsed.en) {
    throw new Error("Invalid slogan payload");
  }

  return {
    es: parsed.es,
    en: parsed.en,
  };
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(getFallbackSlogan(), {
      headers: { "X-AI-Mode": "openai-unconfigured" },
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: SLOGAN_MODEL,
      instructions: SYSTEM_PROMPT,
      input: USER_PROMPT,
      max_output_tokens: 120,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
    });

    const parsed = extractJsonPayload(response.output_text);

    return NextResponse.json(parsed, {
      headers: { "X-AI-Mode": "openai" },
    });
  } catch {
    const fallback = getFallbackSlogan();

    return NextResponse.json(fallback, {
      headers: { "X-AI-Mode": "fallback" },
    });
  }
}
