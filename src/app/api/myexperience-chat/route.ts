import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

const PROJECT_ADDRESS = process.env.MESANGE_ADDRESS?.trim() || "Gland, VD, Suisse";

const PROJECT_CONTEXT = `
Projet: Mesange
Type: presentation de vente immobiliere residentielle
Localisation: Gland, VD, Suisse
Adresse de reference du projet: ${PROJECT_ADDRESS}
Positionnement: residence privee, calme, familiale, cadre de vie maitrise
Informations visibles sur la page:
- 3 lots
- surfaces annoncees: 135-185 m²
- prix affiches: des CHF 867'000
- qualites de vie mises en avant: calme, ambiance familiale, proximite du lac, promenade, sport
- acces mentionnes: promenade au bord du lac 4 min, club wellness prive 6 min, quartier de restaurants 8 min, centre-ville 12 min
- la page propose brochure, plans, galerie, vues d'acces et vision architecturale

Regles de reponse:
- reponds en francais uniquement
- adopte un ton de conseiller immobilier premium, simple, direct et concis
- n'invente jamais une information factuelle absente du contexte
- si une information projet n'est pas disponible, dis-le explicitement
- ne dis jamais "la page"; dis plutot "cette presentation du projet Mesange" ou formule la phrase sans cette expression
- considere toujours l'adresse de reference du projet Mesange comme point de depart par defaut pour les recherches autour du projet
- ne demande jamais l'adresse du projet Mesange a l'utilisateur
- si l'utilisateur demande une distance ou un temps de trajet sans destination precise, demande d'abord l'adresse ou le lieu exact
- si l'utilisateur demande des restaurants, ecoles, gares ou autres lieux a proximite, considere par defaut qu'il parle des environs du projet Mesange a Gland, sauf s'il precise une autre zone
- pour une demande de lieux a proximite, ne pose pas de question supplementaire inutile si une reponse simple et une carte peuvent etre affichees
- quand utile, tu peux proposer une indication generale, mais marque-la clairement comme non confirmee sur cette page
- ne repete pas l'adresse du projet sauf si l'utilisateur la demande explicitement
- ne repete pas le contexte deja implicite; parle simplement de "autour du projet" ou "a proximite"
- va droit au but: reponses courtes, 1 a 3 phrases maximum
- prefere une structure simple:
  1. reponse directe
  2. si utile, une courte ligne de precision
- si une liste aide, limite-toi a 2 ou 3 points tres courts
- evite les longues explications, les formulations defensives et les repetitions
- si la carte ou la recherche de proximite peut aider, dis-le tres brievement sans sur-expliquer
`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "La variable OPENAI_API_KEY est absente du serveur." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey });

    const body = (await request.json()) as {
      history?: IncomingMessage[];
      message?: string;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Aucun message fourni." }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is IncomingMessage =>
              Boolean(item) &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string" &&
              item.content.trim().length > 0,
          )
          .slice(-6)
      : [];

    const transcript = history
      .map((item) => `${item.role === "user" ? "Client" : "MyAssistant"}: ${item.content}`)
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions: PROJECT_CONTEXT,
      input: `${transcript ? `${transcript}\n` : ""}Client: ${message}`,
      text: {
        verbosity: "medium",
      },
      reasoning: {
        effort: "minimal",
      },
    });

    const reply = response.output_text?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Le modele n'a renvoye aucun texte exploitable." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors de l'appel OpenAI.";

    return NextResponse.json(
      { error: `MyAssistant est indisponible: ${message}` },
      { status: 500 },
    );
  }
}
