import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { toAbsoluteUrl } from "@/lib/siteUrl";

function fromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.CONTACT_FORM_FROM_EMAIL?.trim() ||
    "BrotherStudio <onboarding@resend.dev>"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendNotificationEmail(input: {
  to: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing RESEND_API_KEY on the server.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail(),
      to: input.to,
      bcc: input.bcc?.length ? input.bcc : undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; error?: { message?: string } }
      | null;
    throw new Error(payload?.message || payload?.error?.message || "Email provider error.");
  }
}

export async function sendProjectApprovalNotification(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const [{ data: projectData, error: projectError }, { data: viewerData, error: viewerError }] =
    await Promise.all([
      supabase.from("projects").select("name").eq("id", projectId).maybeSingle(),
      supabase.from("project_viewers").select("email").eq("project_id", projectId),
    ]);

  if (projectError) throw projectError;
  if (viewerError) throw viewerError;

  const recipients = Array.from(
    new Set(
      ((viewerData ?? []) as Array<{ email: string }>)
        .map((viewer) => viewer.email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  if (recipients.length === 0) {
    throw new Error("Aucun e-mail client enregistré pour ce projet.");
  }

  const projectName = (projectData as { name?: string } | null)?.name || "votre projet";
  const projectUrl = toAbsoluteUrl(`/myreview/${projectId}`);
  const text = [
    `Bonjour,`,
    "",
    `Les images approuvées de ${projectName} sont maintenant disponibles dans MyReview.`,
    "",
    `Consulter le projet : ${projectUrl}`,
    "",
    "BrotherStudio",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111">
      <p>Bonjour,</p>
      <p>Les images approuvées de <strong>${escapeHtml(projectName)}</strong> sont maintenant disponibles dans MyReview.</p>
      <p><a href="${projectUrl}">Consulter le projet</a></p>
      <p>BrotherStudio</p>
    </div>
  `;

  await sendNotificationEmail({
    to: [recipients[0]],
    bcc: recipients.slice(1),
    subject: `MyReview — ${projectName} est prêt`,
    text,
    html,
  });

  return recipients.length;
}
