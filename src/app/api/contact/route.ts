import { NextResponse } from "next/server";

import { site } from "@/content/site";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  interest?: unknown;
  message?: unknown;
  website?: unknown;
  source?: unknown;
  project?: unknown;
  submissionId?: unknown;
  valuation?: unknown;
};

type ValuationDetails = {
  firstName: string;
  lastName: string;
  propertyType: string;
  propertyAddress: string;
  roomCount: string;
  approximateArea: string;
  contactTime: string;
  saleTimeline: string;
  desiredPriceChf: string;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function readValuation(value: unknown): ValuationDetails | null {
  if (!value || typeof value !== "object") return null;
  const fields = value as Record<string, unknown>;
  const result: ValuationDetails = {
    firstName: clip(asTrimmedString(fields.firstName), 60),
    lastName: clip(asTrimmedString(fields.lastName), 60),
    propertyType: clip(asTrimmedString(fields.propertyType), 80),
    propertyAddress: clip(asTrimmedString(fields.propertyAddress), 500),
    roomCount: clip(asTrimmedString(fields.roomCount), 20),
    approximateArea: clip(asTrimmedString(fields.approximateArea), 30),
    contactTime: clip(asTrimmedString(fields.contactTime), 80),
    saleTimeline: clip(asTrimmedString(fields.saleTimeline), 80),
    desiredPriceChf: clip(asTrimmedString(fields.desiredPriceChf), 30),
  };

  if (!result.firstName || !result.lastName || !result.propertyType || !result.propertyAddress || !result.roomCount || !result.contactTime || !result.saleTimeline) {
    return null;
  }
  if (result.desiredPriceChf && (!/^\d+(?:\.\d{1,2})?$/.test(result.desiredPriceChf) || Number(result.desiredPriceChf) < 0)) {
    return null;
  }
  return result;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readJson(request: Request): Promise<ContactPayload | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") return null;
    return body as ContactPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const website = asTrimmedString(body.website);
  if (website) {
    // Honeypot: pretend success for bots.
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const name = clip(asTrimmedString(body.name), 120);
  const email = clip(asTrimmedString(body.email).toLowerCase(), 200);
  const phone = clip(asTrimmedString(body.phone), 40);
  const interest = clip(asTrimmedString(body.interest), 120);
  const message = clip(asTrimmedString(body.message), 4000);
  const source = clip(asTrimmedString(body.source), 80);
  const project = clip(asTrimmedString(body.project), 120);
  const isValuationRequest = source === "campaign-landing-valuation";
  const valuation = isValuationRequest ? readValuation(body.valuation) : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  if (isValuationRequest) {
    const submissionId = asTrimmedString(body.submissionId);
    if (!valuation || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
      return NextResponse.json({ error: "Complete valuation details are required." }, { status: 400 });
    }
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("property_valuation_requests").upsert({
        submission_id: submissionId,
        first_name: valuation.firstName,
        last_name: valuation.lastName,
        email,
        phone,
        property_type: valuation.propertyType,
        property_address: valuation.propertyAddress,
        room_count: valuation.roomCount,
        approximate_area: valuation.approximateArea || null,
        contact_time: valuation.contactTime,
        sale_timeline: valuation.saleTimeline,
        desired_price_chf: valuation.desiredPriceChf ? Number(valuation.desiredPriceChf) : null,
        source,
      }, { onConflict: "submission_id", ignoreDuplicates: true });
      if (error) throw error;
    } catch (saveError) {
      console.error("Failed to save property valuation request in Supabase:", saveError);
      return NextResponse.json({ error: "Your valuation request could not be saved." }, { status: 503 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) {
    if (isValuationRequest) {
      console.warn("Valuation request was saved, but RESEND_API_KEY is missing; no notification email was sent.");
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    return NextResponse.json(
      {
        error:
          "Contact form is not configured yet. Missing RESEND_API_KEY on the server.",
      },
      { status: 500 },
    );
  }

  const toEmail = process.env.CONTACT_FORM_TO_EMAIL?.trim() || site.contact.email;
  const ccEmail = process.env.CONTACT_FORM_CC_EMAIL?.trim() || site.contact.email;
  const fromEmail =
    process.env.CONTACT_FORM_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "BrotherStudio <onboarding@resend.dev>";

  const submittedAt = new Date().toISOString();
  const requestContext = project || (source ? source.replaceAll("-", " ") : "BrotherStudio");
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `Interest: ${interest || "-"}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    message,
  ];

  const text = lines.join("\n");
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111">
      <p><strong>New contact request</strong></p>
      <p>
        <strong>Name:</strong> ${escapeHtml(name)}<br />
        <strong>Email:</strong> ${escapeHtml(email)}<br />
        <strong>Phone:</strong> ${escapeHtml(phone || "-")}<br />
        <strong>Interest:</strong> ${escapeHtml(interest || "-")}<br />
        <strong>Source:</strong> ${escapeHtml(source || "-")}<br />
        <strong>Project:</strong> ${escapeHtml(project || "-")}<br />
        <strong>Submitted:</strong> ${escapeHtml(submittedAt)}
      </p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  const ownerEmailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `New website contact - ${name}`,
      text,
      html,
    }),
  });

  if (!ownerEmailResponse.ok) {
    const errorPayload = (await ownerEmailResponse.json().catch(() => null)) as
      | { message?: string; error?: { message?: string } }
      | null;

    const errorMessage =
      errorPayload?.message ||
      errorPayload?.error?.message ||
      "Email provider error.";

    if (isValuationRequest) {
      console.error("Valuation request was saved, but the owner notification email failed:", errorMessage);
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const clientText = [
    `Bonjour ${name},`,
    "",
    `Nous avons bien recu votre demande concernant ${requestContext}.`,
    "Notre equipe revient vers vous rapidement.",
    "",
    "Recapitulatif :",
    `- Email : ${email}`,
    `- Telephone : ${phone || "-"}`,
    `- Intérêt : ${interest || "-"}`,
    `- Demande : ${message}`,
    "",
    "BrotherStudio",
  ].join("\n");

  const clientHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111">
      <p>Bonjour ${escapeHtml(name)},</p>
      <p>Nous avons bien recu votre demande concernant ${escapeHtml(requestContext)}.</p>
      <p>Notre equipe revient vers vous rapidement.</p>
      <p><strong>Recapitulatif</strong><br />
      Email: ${escapeHtml(email)}<br />
      Telephone: ${escapeHtml(phone || "-")}<br />
      Intérêt: ${escapeHtml(interest || "-")}<br />
      Demande: ${escapeHtml(message)}</p>
      <p>BrotherStudio</p>
    </div>
  `;

  const clientEmailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      cc: ccEmail && ccEmail !== email ? [ccEmail] : undefined,
      reply_to: toEmail,
      subject: `Confirmation de votre demande - ${requestContext}`,
      text: clientText,
      html: clientHtml,
    }),
  });

  if (!clientEmailResponse.ok) {
    const errorPayload = (await clientEmailResponse.json().catch(() => null)) as
      | { message?: string; error?: { message?: string } }
      | null;

    const errorMessage =
      errorPayload?.message ||
      errorPayload?.error?.message ||
      "Email provider error.";

    if (isValuationRequest) {
      console.error("Valuation request was saved, but the client confirmation email failed:", errorMessage);
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const projectSearchPattern = project.toLowerCase().includes("plantaz")
    ? "%Plantaz%"
    : project.toLowerCase().includes("mesange") || project.toLowerCase().includes("mésange")
      ? "%Mesange%"
      : null;

  if (projectSearchPattern) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: projectRow } = await supabase
        .from("projects")
        .select("id")
        .ilike("name", projectSearchPattern)
        .limit(1)
        .maybeSingle();

      if (projectRow?.id) {
        await supabase.from("project_prospects").insert({
          project_id: projectRow.id,
          name,
          email,
          phone,
          source: source || `${project.toLowerCase()}-website`,
          interest: interest || `Projet ${project || "immobilier"}`,
          message,
          notes: `Prospect ajouté automatiquement depuis le site ${project || "BrotherStudio"}.\n\nIntérêt : ${interest || "Non précisé"}\n\nDemande :\n${message}`,
        });
      }
    } catch (prospectError) {
      console.error("Failed to save Plantaz website prospect:", prospectError);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
