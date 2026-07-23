"use client";

import { FormEvent, useState } from "react";

type MaretsetContactFormProps = {
  locale: "fr" | "en";
};

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function MaretsetContactForm({ locale }: MaretsetContactFormProps) {
  const isFr = locale === "fr";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const apartment = String(formData.get("apartment") ?? "");
    const message = String(formData.get("message") ?? "");

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      source: "maretset-sales-website",
      project: "Maretset - CJ Construction",
      message: [
        "New Maretset inquiry for CJ Construction via BrotherStudio.",
        "",
        `Preferred apartment: ${apartment || "Not specified"}`,
        "",
        "Buyer message:",
        message,
      ].join("\n"),
    };

    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || (isFr ? "La demande n'a pas pu etre envoyee." : "The request could not be sent."));
      }

      form.reset();
      setSubmitState({
        status: "success",
        message: isFr
          ? "Demande envoyee. BrotherStudio la transmettra a CJ Construction."
          : "Request sent. BrotherStudio will forward it to CJ Construction.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : isFr
              ? "Une erreur est survenue."
              : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="maretsetContactForm" onSubmit={handleSubmit}>
      <div className="maretsetContactFormGrid">
        <label>
          <span>{isFr ? "Nom complet" : "Full name"}</span>
          <input name="name" type="text" autoComplete="name" required maxLength={120} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
        <label>
          <span>{isFr ? "Telephone" : "Phone"}</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label>
          <span>{isFr ? "Interet" : "Interest"}</span>
          <select name="apartment" defaultValue="Apartment A">
            <option value="Apartment A">Apartment A · CHF 1&apos;250&apos;000</option>
            <option value="Apartment B">Apartment B</option>
            <option value="Both apartments">{isFr ? "Les deux appartements" : "Both apartments"}</option>
          </select>
        </label>
      </div>

      <label>
        <span>{isFr ? "Message" : "Message"}</span>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={1400}
          placeholder={
            isFr
              ? "Bonjour, je souhaite recevoir plus d'informations sur Maretset..."
              : "Hello, I would like to receive more information about Maretset..."
          }
        />
      </label>

      <div className="maretsetContactHoneypot" aria-hidden="true">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="maretsetContactFormActions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isFr ? "Envoi..." : "Sending...") : isFr ? "Envoyer la demande" : "Send request"}
        </button>
        {submitState.status !== "idle" ? (
          <p className={`maretsetContactStatus maretsetContactStatus--${submitState.status}`} role="status">
            {submitState.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
