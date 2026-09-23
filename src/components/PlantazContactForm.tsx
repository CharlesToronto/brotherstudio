"use client";

import { FormEvent, useState } from "react";

export function PlantazContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          message: String(data.get("message") ?? ""),
          website: String(data.get("website") ?? ""),
          source: "plantaz-sales-website",
          project: "Plantaz",
        }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "La demande n’a pas pu être envoyée.");

      form.reset();
      setMessage("Merci. Votre demande a bien été envoyée.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="plantazContactForm" onSubmit={handleSubmit}>
      <div className="plantazContactGrid">
        <label><span>Nom complet</span><input name="name" type="text" autoComplete="name" required maxLength={120} /></label>
        <label><span>E-mail</span><input name="email" type="email" autoComplete="email" required maxLength={200} /></label>
        <label><span>Téléphone</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
      </div>
      <label><span>Votre demande</span><textarea name="message" rows={4} required maxLength={1400} placeholder="Je souhaite recevoir plus d’informations sur l’appartement Plantaz…" /></label>
      <div className="plantazContactHoneypot" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="plantazContactActions">
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Envoi…" : "Envoyer"}</button>
        {message ? <p data-error={isError ? "true" : "false"} role="status">{message}</p> : null}
      </div>
    </form>
  );
}
