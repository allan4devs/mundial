import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const PITCH_MODEL = "claude-haiku-4-5";
const AI_HEADERS = { "Cache-Control": "no-store" };

type PitchPayload = {
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
};

type BusinessContext = {
  name?: string;
  address?: string;
  types?: string[];
  rating?: number | null;
  userRatingCount?: number | null;
  hasWebsite?: boolean;
  websiteVerdict?: string | null;
  websiteReasons?: string[];
};

const SYSTEM_PROMPT = `Sos un vendedor consultivo de una agencia costarricense que diseña sitios web modernos para negocios locales (pymes) en San Carlos, Costa Rica.

Tu tarea: escribir un mensaje de prospección personalizado para un negocio específico, basado en los datos que te doy. El objetivo es conseguir una reunión o respuesta, no cerrar la venta en el mensaje.

Reglas de estilo:
- Español costarricense, cálido y directo. Tuteo/voseo natural ("tenés", "podés"). Nada de "usted" formal acartonado.
- Sin exagerar ni sonar a spam. Cero promesas vacías tipo "duplicá tus ventas".
- Menciona algo concreto del negocio (nombre, tipo, o el hallazgo de su sitio actual) para que se sienta personal.
- Si NO tiene website: enfoca en que hoy los clientes buscan en Google/redes y no lo encuentran.
- Si tiene website pero conviene modernizarlo: menciona con tacto 1 mejora concreta (de las razones dadas), sin insultar su sitio actual.
- WhatsApp: máximo 45 palabras, tono de mensaje directo, 1 pregunta al final que invite a responder.
- Email: subject de máximo 8 palabras; body de 3 a 5 líneas cortas, con saludo y una llamada a la acción clara.

Devolvé ÚNICAMENTE un objeto JSON con esta forma exacta, sin texto adicional ni bloques de código:
{"whatsapp": "<mensaje>", "email": {"subject": "<asunto>", "body": "<cuerpo con \\n entre líneas>"}}`;

function buildUserPrompt(business: BusinessContext): string {
  const lines: string[] = [];
  lines.push(`Negocio: ${business.name?.trim() || "Negocio local"}`);
  if (business.address?.trim()) lines.push(`Dirección: ${business.address.trim()}`);
  if (business.types?.length) lines.push(`Tipo: ${business.types.slice(0, 3).join(", ")}`);
  if (typeof business.rating === "number") {
    lines.push(`Reputación: ${business.rating} estrellas (${business.userRatingCount ?? 0} reseñas)`);
  }

  if (!business.hasWebsite) {
    lines.push("Sitio web: NO tiene sitio web.");
  } else {
    lines.push(
      `Sitio web: SÍ tiene, pero ${business.websiteVerdict?.trim() || "conviene modernizarlo"}.`,
    );
    if (business.websiteReasons?.length) {
      lines.push(`Hallazgos del sitio actual: ${business.websiteReasons.slice(0, 3).join("; ")}.`);
    }
  }

  lines.push("");
  lines.push("Escribí el mensaje de prospección para este negocio.");
  return lines.join("\n");
}

function getFallbackPitch(business: BusinessContext): PitchPayload {
  const name = business.name?.trim() || "Hola";
  if (!business.hasWebsite) {
    return {
      whatsapp: `¡Pura vida, ${name}! Vi que aún no tienen sitio web y hoy muchos clientes buscan primero en Google. Diseñamos webs modernas para negocios de la zona. ¿Les interesa que les mande un ejemplo?`,
      email: {
        subject: "Un sitio web para tu negocio",
        body: `Hola, equipo de ${name}.\n\nNotamos que aún no cuentan con un sitio web, y hoy la mayoría de clientes busca en Google antes de visitar.\n\nDiseñamos sitios modernos para negocios locales. ¿Podríamos coordinar una llamada corta esta semana?\n\nSaludos.`,
      },
    };
  }
  return {
    whatsapp: `¡Pura vida, ${name}! Revisamos su sitio web y hay mejoras rápidas que ayudarían a que los clientes los encuentren mejor. ¿Les comparto un par de ideas sin compromiso?`,
    email: {
      subject: "Ideas para modernizar su sitio",
      body: `Hola, equipo de ${name}.\n\nRevisamos su sitio web y vimos oportunidades para que cargue mejor y aparezca más en Google.\n\nNos encantaría compartirles un par de ideas concretas. ¿Coordinamos una llamada corta?\n\nSaludos.`,
    },
  };
}

function extractPitchPayload(rawText: string): PitchPayload {
  const trimmed = rawText.trim();
  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  const parsed = JSON.parse(candidate) as Partial<PitchPayload>;
  if (!parsed.whatsapp || !parsed.email?.subject || !parsed.email?.body) {
    throw new Error("Invalid pitch payload");
  }

  return {
    whatsapp: parsed.whatsapp,
    email: {
      subject: parsed.email.subject,
      body: parsed.email.body,
    },
  };
}

export async function POST(req: NextRequest) {
  let business: BusinessContext = {};

  try {
    business = ((await req.json()) as { business?: BusinessContext }).business ?? {};

    const message = await client.messages.create({
      model: PITCH_MODEL,
      max_tokens: 400,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(business) }],
    });

    const contentText = message.content
      .map((item) => (item.type === "text" ? item.text : ""))
      .join("\n")
      .trim();

    const parsed = extractPitchPayload(contentText);

    return NextResponse.json(parsed, {
      headers: { ...AI_HEADERS, "X-AI-Mode": "anthropic" },
    });
  } catch (error) {
    console.error("[maps-scrapper/pitch]", error);
    return NextResponse.json(getFallbackPitch(business), {
      headers: { ...AI_HEADERS, "X-AI-Mode": "fallback-default" },
    });
  }
}
