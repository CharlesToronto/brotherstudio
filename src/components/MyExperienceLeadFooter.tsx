"use client";

import { FormEvent, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const QUICK_PROMPTS = [
  "Recevoir la brochure",
  "Planifier une visite",
  "Être rappelé",
];

export function MyExperienceLeadFooter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageValue, setMessageValue] = useState(QUICK_PROMPTS[0] ?? "");
  const [interest, setInterest] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("appartement") || params.get("interet") || params.get("interest") || "";
    if (!value.trim()) return;

    const apartmentNumber = value.trim().match(/^\d{1,2}$/)?.[0];
    setInterest(apartmentNumber ? `Appartement ${apartmentNumber.padStart(2, "0")}` : value.trim());
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      interest: String(formData.get("interest") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
      source: "myexperience-footer",
      project: "Mesange",
    };

    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? "Impossible d'envoyer votre demande.");
      }

      form.reset();
      setMessageValue(QUICK_PROMPTS[0] ?? "");
      setInterest("");
      setSubmitState({
        status: "success",
        message:
            "Demande envoyée. Un e-mail de confirmation vient d’être envoyé au client.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer votre demande.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="myExperienceContactFooter" aria-labelledby="myexperience-contact-footer-title">
      <div className="myExperienceShell myExperienceContactFooterShell">
        <div className="myExperienceContactFooterIntro">
          <p className="myExperienceSectionKicker">Prise de contact</p>
          <h2 id="myexperience-contact-footer-title" className="myExperienceContactFooterTitle">
            Parlons de votre projet d&apos;achat
          </h2>
          <p className="myExperienceContactFooterLead">
            Laissez vos coordonnées. Une confirmation est envoyée automatiquement au client,
            avec copie sur votre adresse e-mail.
          </p>
        </div>

        <form className="myExperienceContactFooterForm" onSubmit={handleSubmit}>
          <div className="myExperienceContactFooterGrid">
            <label className="myExperienceContactFooterField">
              <span>Nom complet</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                placeholder="Jean Dupont"
              />
            </label>

            <label className="myExperienceContactFooterField">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
                placeholder="jean@exemple.com"
              />
            </label>

            <label className="myExperienceContactFooterField">
              <span>Téléphone</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                placeholder="+41 ..."
              />
            </label>

            <label className="myExperienceContactFooterField">
              <span>Intérêt</span>
              <input
                name="interest"
                type="text"
                maxLength={120}
                value={interest}
                onChange={(event) => setInterest(event.target.value)}
                placeholder="Appartement 04"
              />
            </label>

            <div className="myExperienceContactFooterField">
              <span>Demande rapide</span>
              <div className="myExperienceContactFooterPromptList" role="group" aria-label="Demande rapide">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "myExperienceContactFooterPrompt",
                    )}
                    data-active={messageValue === prompt ? "true" : "false"}
                    onClick={() => {
                      setMessageValue(prompt);
                      if (submitState.status === "error") {
                        setSubmitState({ status: "idle", message: "" });
                      }
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="myExperienceContactFooterField myExperienceContactFooterFieldFull">
            <span>Message</span>
            <textarea
              name="message"
              rows={4}
              required
              maxLength={4000}
              value={messageValue}
              onChange={(event) => setMessageValue(event.target.value)}
              placeholder="Precisez votre demande..."
            />
          </label>

          <div className="myExperienceContactFooterHoneypot" aria-hidden="true">
            <label htmlFor="myexperience-contact-website">Website</label>
            <input
              id="myexperience-contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="myExperienceContactFooterActions">
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "myExperienceContactFooterSubmit",
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi..." : "Envoyer la demande"}
            </button>
            <p className="myExperienceContactFooterNote">
              Réponse rapide par e-mail. Idéal pour brochure, visite ou rappel.
            </p>
          </div>

          {submitState.status !== "idle" ? (
            <p
              className={`myExperienceContactFooterStatus myExperienceContactFooterStatus--${submitState.status}`}
              role="status"
            >
              {submitState.message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
