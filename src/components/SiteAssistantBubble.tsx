"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ASSISTANT_CATEGORIES,
  findAssistantQaMatch,
  readAssistantText,
  type AssistantLocale,
} from "@/lib/siteAssistantKnowledge";
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  stripLocaleFromPathname,
  withLocalePath,
} from "@/lib/i18n";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  showContactCta?: boolean;
};

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const HIDDEN_SUBPATH_PREFIXES = [
  "/dashboard",
  "/admin",
  "/team",
  "/myreview",
  "/mystudio",
  "/myproject",
  "/project",
];

function buildCopy(locale: AssistantLocale) {
  if (locale === "fr") {
    return {
      bubbleLabel: "Q&A",
      openAria: "Ouvrir l'assistant",
      closeAria: "Fermer l'assistant",
      title: "Questions rapides",
      categoriesTitle: "Categories",
      inputPlaceholder: "Ex: combien de temps pour 5 images ?",
      submitQuestion: "Repondre",
      replyingLabel: "Reponse...",
      contactButton: "Soumettre une demande de contact",
      contactTitle: "Demande de contact",
      contactIntro:
        "Laisse tes coordonnees et un court message. La demande sera envoyee directement.",
      nameLabel: "Nom",
      emailLabel: "Email",
      phoneLabel: "Telephone",
      messageLabel: "Message",
      messagePlaceholder: "Decris rapidement ton projet ou ta demande.",
      sendLabel: "Envoyer la demande",
      sendingLabel: "Envoi...",
      successMessage: "Demande envoyee. Nous revenons vers toi rapidement.",
      fallback:
        "Je n'ai pas de reponse precise pour cette question. Le plus efficace est de m'envoyer une demande avec ton projet, ton delai et le type de rendu recherche.",
      backToMenu: "Retour au menu",
      viewContactPage: "Voir la page contact",
    };
  }

  return {
    bubbleLabel: "Q&A",
    openAria: "Open assistant",
    closeAria: "Close assistant",
    title: "Quick questions",
    categoriesTitle: "Categories",
    inputPlaceholder: "Example: how long for 5 images?",
    submitQuestion: "Reply",
    replyingLabel: "Replying...",
    contactButton: "Submit a contact request",
    contactTitle: "Contact request",
    contactIntro: "Leave your details and a short message. The request will be sent directly.",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone",
    messageLabel: "Message",
    messagePlaceholder: "Briefly describe your project or request.",
    sendLabel: "Send request",
    sendingLabel: "Sending...",
    successMessage: "Request sent. We will get back to you shortly.",
    fallback:
      "I do not have a precise answer for that question. The most efficient next step is to send your project details, timeline, and target deliverables.",
    backToMenu: "Back to menu",
    viewContactPage: "Open contact page",
  };
}

export function SiteAssistantBubble() {
  const pathname = usePathname();
  const locale = (getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE) as AssistantLocale;
  const subpath = stripLocaleFromPathname(pathname);
  const copy = useMemo(() => buildCopy(locale), [locale]);
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>(["studio"]);

  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
    };

    window.addEventListener("site-assistant:open", handleOpenAssistant);

    return () => {
      window.removeEventListener("site-assistant:open", handleOpenAssistant);
    };
  }, []);

  const isHidden = HIDDEN_SUBPATH_PREFIXES.some(
    (prefix) => subpath === prefix || subpath.startsWith(`${prefix}/`),
  );
  const contactHref = withLocalePath(locale, "/contact");
  const hasConversation = messages.length > 0;

  if (isHidden) {
    return null;
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const buildLocalFallback = (rawQuestion: string, forcedAnswer?: string) => {
    if (forcedAnswer) return forcedAnswer;
    const match = findAssistantQaMatch(rawQuestion, locale);
    return match ? readAssistantText(match.answer, locale) : copy.fallback;
  };

  const requestAssistantReply = async (rawQuestion: string, forcedAnswer?: string) => {
    const value = rawQuestion.trim();
    if (!value || isReplying) return;

    const nextMessages = [
      ...messages,
      {
        id: `user-${messages.length + 1}`,
        role: "user" as const,
        text: value,
      },
    ];

    setMessages(nextMessages);
    setQuestion("");
    setIsReplying(true);

    try {
      const response = await fetch("/api/site-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          message: value,
          history: messages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { reply?: string; error?: string }
        | null;

      const reply = response.ok && data?.reply ? data.reply.trim() : "";
      const safeReply = reply || buildLocalFallback(value, forcedAnswer);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${current.length + 1}`,
          role: "assistant",
          text: safeReply,
          showContactCta: true,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${current.length + 1}`,
          role: "assistant",
          text: buildLocalFallback(value, forcedAnswer),
          showContactCta: true,
        },
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  const handleQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestAssistantReply(question);
  };

  const handleBackToMenu = () => {
    setMessages([]);
    setShowContactForm(false);
    setQuestion("");
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: "",
      source: "site-assistant",
      project: "",
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
        throw new Error(data?.error ?? "Failed to send request.");
      }

      form.reset();
      setContactMessage("");
      setSubmitState({
        status: "success",
        message: copy.successMessage,
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to send request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="siteAssistant" data-open={isOpen ? "true" : "false"}>
      {isOpen ? (
        <section className="siteAssistantPanel" aria-label={copy.title}>
          <div className="siteAssistantPanelHeader">
            <div>
              <p className="siteAssistantEyebrow">{copy.bubbleLabel}</p>
              <h2 className="siteAssistantTitle">{copy.title}</h2>
            </div>
            <button
              type="button"
              className="siteAssistantClose"
              aria-label={copy.closeAria}
              onClick={() => setIsOpen(false)}
            >
              x
            </button>
          </div>

          <div className="siteAssistantPanelBody">
            {hasConversation ? (
              <>
                <button
                  type="button"
                  className="siteAssistantBackButton"
                  onClick={handleBackToMenu}
                >
                  <span className="siteAssistantBackArrow">←</span>
                  <span>{copy.backToMenu}</span>
                </button>

                <div className="siteAssistantMessages" aria-live="polite">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`siteAssistantMessage siteAssistantMessage--${message.role}`}
                    >
                      <p>{message.text}</p>
                      {message.role === "assistant" && message.showContactCta ? (
                        <button
                          type="button"
                          className="siteAssistantInlineCta"
                          onClick={() => setShowContactForm(true)}
                        >
                          {copy.contactButton}
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {isReplying ? (
                    <div className="siteAssistantMessage siteAssistantMessage--assistant">
                      <p>{copy.replyingLabel}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="siteAssistantCategoryBlock">
                <p className="siteAssistantSectionLabel">{copy.categoriesTitle}</p>
                <div className="siteAssistantCategoryList">
                  {ASSISTANT_CATEGORIES.map((category) => {
                    const isExpanded = openCategoryIds.includes(category.id);

                    return (
                      <section
                        key={category.id}
                        className="siteAssistantCategory"
                        data-open={isExpanded ? "true" : "false"}
                      >
                        <button
                          type="button"
                          className="siteAssistantCategoryToggle"
                          onClick={() => toggleCategory(category.id)}
                          aria-expanded={isExpanded}
                        >
                          <span>{readAssistantText(category.title, locale)}</span>
                          <span className="siteAssistantCategoryChevron">
                            {isExpanded ? "-" : "+"}
                          </span>
                        </button>

                        {isExpanded ? (
                          <div className="siteAssistantQuestionList">
                            {category.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="siteAssistantQuestionItem"
                                onClick={() =>
                                  void requestAssistantReply(
                                    readAssistantText(item.question, locale),
                                    readAssistantText(item.answer, locale),
                                  )
                                }
                              >
                                {readAssistantText(item.question, locale)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              </div>
            )}

            {showContactForm ? (
              <form className="siteAssistantContactForm" onSubmit={handleContactSubmit}>
                <div className="siteAssistantContactHeader">
                  <h3>{copy.contactTitle}</h3>
                  <p>{copy.contactIntro}</p>
                </div>

                <label className="siteAssistantField">
                  <span>{copy.nameLabel}</span>
                  <input name="name" type="text" autoComplete="name" required maxLength={120} />
                </label>

                <label className="siteAssistantField">
                  <span>{copy.emailLabel}</span>
                  <input name="email" type="email" autoComplete="email" required maxLength={200} />
                </label>

                <label className="siteAssistantField">
                  <span>{copy.phoneLabel}</span>
                  <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
                </label>

                <label className="siteAssistantField">
                  <span>{copy.messageLabel}</span>
                  <textarea
                    name="message"
                    rows={4}
                    required
                    maxLength={4000}
                    value={contactMessage}
                    placeholder={copy.messagePlaceholder}
                    onChange={(event) => setContactMessage(event.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="siteAssistantFormSubmit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? copy.sendingLabel : copy.sendLabel}
                </button>

                {submitState.status !== "idle" ? (
                  <p
                    className={`siteAssistantStatus siteAssistantStatus--${submitState.status}`}
                    role="status"
                  >
                    {submitState.message}
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>

          <div className="siteAssistantComposer">
            <form className="siteAssistantQuestionForm" onSubmit={handleQuestionSubmit}>
              <input
                className="siteAssistantInput"
                type="text"
                value={question}
                maxLength={240}
                placeholder={copy.inputPlaceholder}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button type="submit" className="siteAssistantSubmit" disabled={isReplying}>
                {isReplying ? copy.replyingLabel : copy.submitQuestion}
              </button>
            </form>

            <div className="siteAssistantFooterActions">
              <button
                type="button"
                className="siteAssistantContactTrigger"
                onClick={() => setShowContactForm((current) => !current)}
              >
                {copy.contactButton}
              </button>
              <Link className="siteAssistantContactLink" href={contactHref}>
                {copy.viewContactPage}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="siteAssistantBubbleButton"
        aria-label={copy.openAria}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="siteAssistantBubbleButtonMark">?</span>
        <span>{copy.bubbleLabel}</span>
      </button>
    </div>
  );
}
