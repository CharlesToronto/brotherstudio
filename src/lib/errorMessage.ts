type ErrorLike = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

function normalizePart(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) return message;
  }

  if (error && typeof error === "object") {
    const candidate = error as ErrorLike;
    const message = normalizePart(candidate.message);
    const details = normalizePart(candidate.details);
    const hint = normalizePart(candidate.hint);
    const code = normalizePart(candidate.code);

    const combined = [message, details, hint].filter(Boolean).join(" ");
    if (combined) return combined;
    if (code) return `${fallback} (${code})`;
  }

  return fallback;
}

export async function getResponseErrorMessage(
  response: Response,
  fallback: string,
) {
  const clonedResponse = response.clone();

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null;

  const payloadMessage = payload?.error?.trim() || payload?.message?.trim();
  if (payloadMessage) return payloadMessage;

  const text = (await clonedResponse.text().catch(() => "")).trim();
  if (text) return text;

  return fallback;
}
