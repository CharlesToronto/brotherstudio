import OpenAI from "openai";
import { NextResponse } from "next/server";

import type { AssistantLocale } from "@/lib/siteAssistantKnowledge";
import {
  buildAssistantKnowledgeContext,
  findAssistantQaMatch,
  readAssistantText,
} from "@/lib/siteAssistantKnowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function isLocale(value: unknown): value is AssistantLocale {
  return value === "fr" || value === "en";
}

function buildInstructions(locale: AssistantLocale) {
  const localeRule =
    locale === "fr"
      ? "Reponds uniquement en francais."
      : "Reply only in English.";

  const commercialRule =
    locale === "fr"
      ? "Tu es l'assistant commercial de Brother Studio. Tu aides a comprendre les services, rassurer, qualifier legerement le besoin, puis orienter vers une demande de contact quand c'est pertinent."
      : "You are Brother Studio's sales assistant. You help explain the services, reassure the visitor, lightly qualify the need, and guide them toward a contact request when relevant.";

  const guardrails =
    locale === "fr"
      ? [
          "N'invente jamais un prix, un delai, un service, un format, un engagement commercial ou une politique non presents dans le contexte.",
          "Base-toi d'abord sur la FAQ fournie.",
          "Tu peux reformuler, synthetiser et vendre plus clairement, mais sans ajouter de faits non confirmes.",
          "Si l'information n'est pas disponible, dis-le clairement puis propose de soumettre une demande de contact.",
          "Reste concis: 2 a 5 phrases maximum sauf si une liste courte aide.",
          "Quand l'utilisateur demande des informations cles sous forme de liste, comparaison ou synthese, notamment services, tarifs, delais, etapes, formats de livraison, moyens de paiement ou types de clients, commence par une tres courte phrase d'introduction puis reponds avec une liste a puces ou numerotee.",
          "Pour ces reponses structurees, utilise 2 a 6 points maximum et garde chaque point court.",
          "Ton ton doit etre premium, direct, clair et rassurant.",
          "Quand c'est utile, termine par une suggestion courte du type: 'Je peux aussi vous aider a preparer une demande de devis.'",
        ]
      : [
          "Never invent a price, timeline, service, file format, commercial promise, or policy that is not present in the provided context.",
          "Use the provided FAQ as the primary source of truth.",
          "You may rephrase, summarize, and sell more clearly, but without adding unconfirmed facts.",
          "If the information is not available, say so clearly and suggest submitting a contact request.",
          "Stay concise: 2 to 5 sentences max unless a short list helps.",
          "When the user asks for key information as a list, comparison, or summary, especially services, pricing, timelines, steps, delivery formats, payment methods, or client types, start with one short introductory sentence and then answer with bullets or a numbered list.",
          "For these structured answers, use 2 to 6 items maximum and keep each item short.",
          "Your tone must feel premium, direct, clear, and reassuring.",
          "When useful, end with a short suggestion such as: 'I can also help you prepare a quote request.'",
        ];

  return `
${localeRule}
${commercialRule}

Regles:
${guardrails.map((rule) => `- ${rule}`).join("\n")}

Base de connaissance Brother Studio:
${buildAssistantKnowledgeContext(locale)}
`.trim();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        history?: IncomingMessage[];
        message?: string;
        locale?: string;
      }
    | null;

  const locale: AssistantLocale = isLocale(body?.locale) ? body.locale : "fr";
  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .filter(
          (item): item is IncomingMessage =>
            Boolean(item) &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim().length > 0,
        )
        .slice(-8)
    : [];

  const fallbackMatch = findAssistantQaMatch(message, locale);
  const fallbackReply = fallbackMatch
    ? readAssistantText(fallbackMatch.answer, locale)
    : locale === "fr"
      ? "Je n'ai pas de reponse certaine a partir de la FAQ. Le plus efficace est de soumettre une demande de contact avec vos plans, votre delai et le type de rendu souhaite."
      : "I do not have a certain answer from the FAQ. The most efficient next step is to submit a contact request with your plans, timeline, and target deliverable.";

  const apiKey =
    process.env.SITE_ASSISTANT_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ reply: fallbackReply, source: "local" });
  }

  try {
    const client = new OpenAI({ apiKey });
    const transcript = history
      .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
      .join("\n");

    const model = process.env.SITE_ASSISTANT_OPENAI_MODEL?.trim() || "gpt-5-mini";

    const response = await client.responses.create({
      model,
      instructions: buildInstructions(locale),
      input: `${transcript ? `${transcript}\n` : ""}User: ${message}`,
      text: {
        verbosity: "medium",
      },
      reasoning: {
        effort: "minimal",
      },
    });

    const reply = response.output_text?.trim();
    if (!reply) {
      return NextResponse.json({ reply: fallbackReply, source: "local" });
    }

    return NextResponse.json({ reply, source: "openai" });
  } catch {
    return NextResponse.json({ reply: fallbackReply, source: "local" });
  }
}
