"use client";

import { FormEvent, useState } from "react";

import type { ContactFormMessages } from "@/content/messages";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ContactFormProps = {
  messages: ContactFormMessages;
};

export function ContactForm({ messages }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageValue, setMessageValue] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (activeTemplateId === null) {
      setSubmitState({
        status: "error",
        message: messages.status.chooseQuickPrompt,
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
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
        throw new Error(data?.error ?? messages.status.genericError);
      }

      form.reset();
      setMessageValue("");
      setActiveTemplateId(null);
      setSubmitState({
        status: "success",
        message: messages.status.success,
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error ? error.message : messages.status.genericError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contactForm" onSubmit={handleSubmit}>
      <div className="contactField">
        <label className="contactLabel" htmlFor="contact-name">
          {messages.labels.name}
        </label>
        <input
          id="contact-name"
          className="contactInput"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
        />
      </div>

      <div className="contactField">
        <label className="contactLabel" htmlFor="contact-email">
          {messages.labels.email}
        </label>
        <input
          id="contact-email"
          className="contactInput"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </div>

      <div className="contactField">
        <label className="contactLabel" htmlFor="contact-phone">
          {messages.labels.phoneOptional}
        </label>
        <input
          id="contact-phone"
          className="contactInput"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
        />
      </div>

      <div className="contactField">
        <span className="contactLabel">{messages.labels.quickPrompt}</span>
        <div
          className="contactTemplateList"
          role="group"
          aria-label={messages.promptGroupAriaLabel}
        >
          {messages.quickPrompts.map((template) => (
            <button
              key={template.id}
              type="button"
              className="contactTemplateButton"
              data-active={activeTemplateId === template.id ? "true" : "false"}
              onClick={() => {
                setMessageValue(template.text);
                setActiveTemplateId(template.id);
                if (submitState.status === "error") {
                  setSubmitState({ status: "idle", message: "" });
                }
              }}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="contactField">
        <label className="contactLabel" htmlFor="contact-message">
          {messages.labels.message}
        </label>
        <textarea
          id="contact-message"
          className="contactTextarea"
          name="message"
          rows={6}
          required
          maxLength={4000}
          value={messageValue}
          onChange={(event) => {
            setMessageValue(event.target.value);
            if (activeTemplateId !== null) setActiveTemplateId(null);
          }}
          placeholder={messages.messagePlaceholder}
        />
      </div>

      <div className="contactHoneypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contactFormActions">
        <button
          className="contactButton"
          type="submit"
          disabled={isSubmitting || activeTemplateId === null}
        >
          {isSubmitting ? messages.buttons.sending : messages.buttons.send}
        </button>
        {submitState.status !== "idle" ? (
          <p
            className={`contactStatus contactStatus--${submitState.status}`}
            role="status"
          >
            {submitState.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
