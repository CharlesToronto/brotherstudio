import { NextResponse } from "next/server";

import { site } from "@/content/site";

export const runtime = "nodejs";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  website?: unknown;
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
  const message = clip(asTrimmedString(body.message), 4000);

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Contact form is not configured yet. Missing RESEND_API_KEY on the server.",
      },
      { status: 500 },
    );
  }

  const toEmail = process.env.CONTACT_FORM_TO_EMAIL?.trim() || site.contact.email;
  const fromEmail =
    process.env.CONTACT_FORM_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "BrotherStudio <onboarding@resend.dev>";

  const submittedAt = new Date().toISOString();
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
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
        <strong>Submitted:</strong> ${escapeHtml(submittedAt)}
      </p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
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

  if (!resendResponse.ok) {
    const errorPayload = (await resendResponse.json().catch(() => null)) as
      | { message?: string; error?: { message?: string } }
      | null;

    const errorMessage =
      errorPayload?.message ||
      errorPayload?.error?.message ||
      "Email provider error.";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
