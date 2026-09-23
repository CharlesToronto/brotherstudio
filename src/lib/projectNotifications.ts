import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { toAbsoluteUrl } from "@/lib/siteUrl";

const commentDigestDelayMs = 30 * 60 * 1000;
const defaultNotificationEmail = "info@brotherstudio.ca";

type ProjectCommentRow = {
  id: string;
  image_id: string;
  author: string;
  content: string;
  created_at: string;
};

function notificationEmail() {
  return process.env.PROJECT_REVIEW_NOTIFICATION_EMAIL?.trim() || defaultNotificationEmail;
}

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

export async function queueProjectCommentDigest(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const pendingUntil = new Date(Date.now() + commentDigestDelayMs).toISOString();
  const { error } = await supabase.from("project_comment_notification_digests").upsert(
    {
      project_id: projectId,
      pending_until: pendingUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );

  if (error) throw error;
}

export async function processPendingProjectCommentDigests(limit = 20) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: digests, error: digestError } = await supabase
    .from("project_comment_notification_digests")
    .select("project_id, pending_until, last_notified_comment_at")
    .not("pending_until", "is", null)
    .lte("pending_until", now)
    .order("pending_until", { ascending: true })
    .limit(limit);

  if (digestError) throw digestError;

  let processed = 0;
  for (const digest of (digests ?? []) as Array<{
    project_id: string;
    last_notified_comment_at: string | null;
  }>) {
    const commentQuery = supabase
      .from("comments")
      .select("id, image_id, author, content, created_at")
      .eq("project_id", digest.project_id)
      .order("created_at", { ascending: true });

    const { data: commentData, error: commentError } = digest.last_notified_comment_at
      ? await commentQuery.gt("created_at", digest.last_notified_comment_at)
      : await commentQuery;

    if (commentError) throw commentError;
    const comments = (commentData ?? []) as ProjectCommentRow[];

    if (comments.length === 0) {
      await supabase
        .from("project_comment_notification_digests")
        .update({ pending_until: null, updated_at: now })
        .eq("project_id", digest.project_id);
      continue;
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("name")
      .eq("id", digest.project_id)
      .maybeSingle();
    if (projectError) throw projectError;

    const projectName = (projectData as { name?: string } | null)?.name || "Projet MyReview";
    const projectUrl = toAbsoluteUrl(`/myreview/${digest.project_id}`);
    const textLines = [
      `${comments.length} nouvelle${comments.length === 1 ? "" : "s"} demande${comments.length === 1 ? "" : "s"} sur ${projectName}`,
      "",
      ...comments.map(
        (comment, index) =>
          `${index + 1}. ${comment.author || "Client"} : ${comment.content}`,
      ),
      "",
      `Ouvrir MyReview : ${projectUrl}`,
    ];
    const text = textLines.join("\n");
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111">
        <p><strong>${comments.length} nouvelle${comments.length === 1 ? "" : "s"} demande${comments.length === 1 ? "" : "s"} sur ${escapeHtml(projectName)}</strong></p>
        <ul>${comments
          .map(
            (comment) =>
              `<li><strong>${escapeHtml(comment.author || "Client")} :</strong> ${escapeHtml(comment.content)}</li>`,
          )
          .join("")}</ul>
        <p><a href="${projectUrl}">Ouvrir MyReview</a></p>
      </div>
    `;

    await sendNotificationEmail({
      to: [notificationEmail()],
      subject: `MyReview — ${comments.length} nouvelle${comments.length === 1 ? "" : "s"} demande${comments.length === 1 ? "" : "s"} — ${projectName}`,
      text,
      html,
    });

    await supabase
      .from("project_comment_notification_digests")
      .update({
        pending_until: null,
        last_notified_comment_at: comments[comments.length - 1]?.created_at ?? now,
        updated_at: now,
      })
      .eq("project_id", digest.project_id);
    processed += 1;
  }

  return processed;
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
