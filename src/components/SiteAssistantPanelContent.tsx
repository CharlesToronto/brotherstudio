"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  ASSISTANT_CATEGORIES,
  buildAssistantLocalReply,
  readAssistantText,
  type AssistantLocale,
} from "@/lib/siteAssistantKnowledge";
import { withLocalePath } from "@/lib/i18n";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type AssistantTab = "chat" | "questions";
type AssistantMessageSegment =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

type SiteAssistantPanelContentProps = {
  locale: AssistantLocale;
  onClose?: () => void;
  showCloseButton?: boolean;
  showContactPageLink?: boolean;
  embedded?: boolean;
};

function buildCopy(locale: AssistantLocale) {
  if (locale === "fr") {
    return {
      bubbleLabel: "Q&A",
      closeAria: "Fermer l'assistant",
      title: "MyAssistant",
      chatTab: "Chat",
      questionsTab: "Questions",
      categoriesTitle: "Catégories",
      inputPlaceholder: "Écrivez votre question…",
      submitQuestion: "Envoyer",
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
      viewContactPage: "Voir la page contact",
    };
  }

  return {
    bubbleLabel: "Q&A",
    closeAria: "Close assistant",
    title: "MyAssistant",
    chatTab: "Chat",
    questionsTab: "Questions",
    categoriesTitle: "Categories",
    inputPlaceholder: "Write your question…",
    submitQuestion: "Send",
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
    viewContactPage: "Open contact page",
  };
}

function splitAssistantMessage(text: string): AssistantMessageSegment[] {
  const blocks = text
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.flatMap((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const bulletLines = lines.filter((line) => /^[-•]\s+/.test(line));
    const introLines = lines.filter((line) => !/^[-•]\s+/.test(line));

    if (bulletLines.length === lines.length) {
      return [
        {
          kind: "list" as const,
          items: bulletLines.map((line) => line.replace(/^[-•]\s+/, "")),
        },
      ];
    }

    if (bulletLines.length > 0) {
      return [
        ...(introLines.length > 0
          ? [{ kind: "paragraph" as const, text: introLines.join(" ") }]
          : []),
        {
          kind: "list" as const,
          items: bulletLines.map((line) => line.replace(/^[-•]\s+/, "")),
        },
      ];
    }

    return [{ kind: "paragraph" as const, text: lines.join(" ") }];
  });
}

function renderTextWithPriceBadges(text: string) {
  const pricePattern =
    /(CHF\s*\d+(?:[.,]\d+)?(?:\s*(?:[–—-]|\/)\s*(?:CHF\s*)?\d+(?:[.,]\d+)?)*(?:\s*\/\s*[\p{L}]+)?)/giu;
  const parts = text.split(pricePattern);

  return parts.map((part, index) =>
    /^CHF\s*\d/i.test(part) ? (
      <span key={`${part}-${index}`} className="siteAssistantPriceBadge">
        {part.trim()}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function renderAssistantListItem(item: string) {
  const [label, ...rest] = item.split(/\s:\s/);
  const hasLabel = rest.length > 0 && label.length <= 52;
  const body = hasLabel ? rest.join(" : ") : item;

  return (
    <>
      {hasLabel ? <span className="siteAssistantMessageItemTitle">{label}</span> : null}
      <span className="siteAssistantMessageItemText">{renderTextWithPriceBadges(body)}</span>
    </>
  );
}

function AssistantFormattedMessage({ text }: { text: string }) {
  const segments = splitAssistantMessage(text);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="siteAssistantMessageFormatted">
      {segments.map((segment, index) =>
        segment.kind === "list" ? (
          <ul key={`list-${index}`} className="siteAssistantMessageList">
            {segment.items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} className="siteAssistantMessageItem">
                {renderAssistantListItem(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={`paragraph-${index}`} className="siteAssistantMessageParagraph">
            {renderTextWithPriceBadges(segment.text)}
          </p>
        ),
      )}
    </div>
  );
}

export function SiteAssistantPanelContent({
  locale,
  onClose,
  showCloseButton = false,
  showContactPageLink = true,
  embedded = false,
}: SiteAssistantPanelContentProps) {
  const copy = useMemo(() => buildCopy(locale), [locale]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");
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
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [activeTab, isReplying, messages]);

  const contactHref = withLocalePath(locale, "/contact");

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const buildLocalFallback = (rawQuestion: string, forcedAnswer?: string) => {
    if (forcedAnswer) return forcedAnswer;
    return buildAssistantLocalReply(rawQuestion, locale) ?? copy.fallback;
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
    setActiveTab("chat");
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
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${current.length + 1}`,
          role: "assistant",
          text: buildLocalFallback(value, forcedAnswer),
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

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
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
      source: embedded ? "landing-site-assistant" : "site-assistant",
      project: embedded ? "Campaign landing page" : "",
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
    <section
      className={`siteAssistantPanel${embedded ? " siteAssistantPanel--embedded" : ""}`}
      aria-label={copy.title}
    >
      <div className="siteAssistantPanelHeader">
        <div>
          <p className="siteAssistantEyebrow">{copy.bubbleLabel}</p>
          <h2 className="siteAssistantTitle">{copy.title}</h2>
        </div>
        {showCloseButton && onClose ? (
          <button
            type="button"
            className="siteAssistantClose"
            aria-label={copy.closeAria}
            onClick={onClose}
          >
            x
          </button>
        ) : null}
      </div>

      <div className="siteAssistantTabs" role="tablist" aria-label={copy.title}>
        <button
          type="button"
          className="siteAssistantTab"
          role="tab"
          aria-selected={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        >
          {copy.chatTab}
        </button>
        <button
          type="button"
          className="siteAssistantTab"
          role="tab"
          aria-selected={activeTab === "questions"}
          onClick={() => setActiveTab("questions")}
        >
          {copy.questionsTab}
        </button>
      </div>

      <div className="siteAssistantPanelBody">
        {activeTab === "chat" ? (
          <div className="siteAssistantChatView">
            {messages.length > 0 ? (
              <div className="siteAssistantMessages" aria-live="polite">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`siteAssistantMessage siteAssistantMessage--${message.role}`}
                  >
                    {message.role === "assistant" ? (
                      <AssistantFormattedMessage text={message.text} />
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>
                ))}

                {isReplying ? (
                  <div className="siteAssistantMessage siteAssistantMessage--assistant">
                    <p className="siteAssistantReplyingText">{copy.replyingLabel}</p>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            ) : null}

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
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={200}
                  />
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
                            onClick={() => {
                              setActiveTab("chat");
                              void requestAssistantReply(
                                readAssistantText(item.question, locale),
                                readAssistantText(item.answer, locale),
                              );
                            }}
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
      </div>

      {activeTab === "chat" ? (
        <div className="siteAssistantComposer">
          <form className="siteAssistantQuestionForm" onSubmit={handleQuestionSubmit}>
            <textarea
              className="siteAssistantInput"
              value={question}
              maxLength={240}
              rows={3}
              placeholder={copy.inputPlaceholder}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
            />
            <button
              type="submit"
              className="siteAssistantSubmit"
              disabled={isReplying || !question.trim()}
              aria-label={copy.submitQuestion}
              title={copy.submitQuestion}
            >
              <span aria-hidden="true">{isReplying ? "…" : "↑"}</span>
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
            {showContactPageLink ? (
              <Link className="siteAssistantContactLink" href={contactHref}>
                {copy.viewContactPage}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
