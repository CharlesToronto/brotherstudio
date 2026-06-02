"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Command,
  LoaderIcon,
  MapPin,
  Paperclip,
  Receipt,
  SendIcon,
  SlidersHorizontal,
  XIcon,
} from "lucide-react";

import { MyExperienceAssistantMap } from "@/components/MyExperienceAssistantMap";
import { Button } from "@/components/ui/button";
import { GradientPromptButtons } from "@/components/ui/gradient-prompt-buttons";
import { cn } from "@/lib/utils";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

type CommandSuggestion = {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
};

type QuickPrompt = {
  icon: React.ReactNode;
  label: string;
  question: string;
  gradientFrom: string;
  gradientTo: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MapPoint = {
  label: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  etaMinutes?: number | null;
};

type AssistantMapData =
  | {
      mode: "route";
      title: string;
      summary: string;
      origin: MapPoint;
      destination: MapPoint;
      route: {
        type: "Feature";
        geometry: {
          type: "LineString";
          coordinates: [number, number][];
        };
        properties: Record<string, never>;
      };
    }
  | {
      mode: "nearby";
      title: string;
      summary: string;
      origin: MapPoint;
      places: MapPoint[];
    };

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          ref={ref}
          className={cn(
            "flex w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900",
            "placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/10",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <Calendar className="h-4 w-4" />,
    label: "Livraison",
    description: "Obtenir les dates prevues du projet",
    prefix: "/livraison",
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    label: "Quartier",
    description: "Comprendre les atouts du secteur",
    prefix: "/quartier",
  },
  {
    icon: <Receipt className="h-4 w-4" />,
    label: "Frais",
    description: "Connaitre les frais apres achat",
    prefix: "/frais",
  },
  {
    icon: <SlidersHorizontal className="h-4 w-4" />,
    label: "Personnalisation",
    description: "Verifier les options de personnalisation",
    prefix: "/personnalisation",
  },
] as const;

const quickPrompts: QuickPrompt[] = [
  {
    icon: <Calendar className="h-4 w-4" />,
    label: "Dates de livraison",
    question: "Quelles sont les dates prevues de livraison ?",
    gradientFrom: "#63c5ff",
    gradientTo: "#2f7df6",
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    label: "Avantages du quartier",
    question: "Quels sont les avantages de ce quartier ?",
    gradientFrom: "#8fe388",
    gradientTo: "#38b6a4",
  },
  {
    icon: <Receipt className="h-4 w-4" />,
    label: "Frais apres achat",
    question: "Quels sont les frais a prevoir apres l'achat ?",
    gradientFrom: "#ffb36b",
    gradientTo: "#ff6c5f",
  },
  {
    icon: <SlidersHorizontal className="h-4 w-4" />,
    label: "Personnalisation",
    question: "Puis-je personnaliser certains elements de mon unite ?",
    gradientFrom: "#d398ff",
    gradientTo: "#f252c9",
  },
];

const nearbyCategoryMatchers = [
  { pattern: /(restaurant|resto|brasserie|manger)/i, category: "restaurants" },
  { pattern: /(cafe|cafes|coffee)/i, category: "cafes" },
  { pattern: /(gare|train)/i, category: "gare" },
  { pattern: /(ecole|school)/i, category: "ecole" },
  { pattern: /(sport|fitness|gym)/i, category: "sport" },
  { pattern: /(lac|parc|nature)/i, category: "lac" },
] as const;

function extractNearbyCategory(input: string) {
  for (const matcher of nearbyCategoryMatchers) {
    if (matcher.pattern.test(input)) return matcher.category;
  }

  return null;
}

function looksLikeDistanceRequest(input: string) {
  return /(distance|trajet|temps pour aller|combien de temps|combien de km|a quelle distance)/i.test(
    input,
  );
}

function looksLikeAddressResponse(input: string) {
  const trimmed = input.trim();
  if (trimmed.length < 4 || trimmed.length > 90) return false;
  if (/[?]/.test(trimmed)) return false;

  return /(\d{4,}|\d+\s+\w+|rue|route|avenue|av\.|boulevard|bd|chemin|impasse|place|quai|allee|allée|geneve|lausanne|gland|nyon|zurich|airport|gare|station|,)/i.test(
    trimmed,
  );
}

function extractDestinationFromMessage(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:jusqu['’]a|jusqu a|vers|pour aller a|pour aller au|pour aller aux|distance jusqu['’]a|distance jusqu a)\s+(.+)$/i,
  );

  if (match?.[1]) return match[1].trim();
  if (trimmed.includes(",")) return trimmed;
  return null;
}

function buildQuickAddressReply() {
  return "Donnez-moi l'adresse ou le lieu exact, et je vous affiche le trajet sur la carte.";
}

function buildMapToolReply(data: AssistantMapData) {
  if (data.mode === "route") {
    return `Je vous affiche le trajet sur la carte.\n${data.summary}.`;
  }

  const nearestPlace = data.places[0];
  if (!nearestPlace) {
    return "Je vous affiche les lieux les plus proches sur la carte.";
  }

  const parts = [];
  if (nearestPlace.distanceMeters) {
    parts.push(`${Math.round(nearestPlace.distanceMeters / 100) / 10} km`);
  }
  if (nearestPlace.etaMinutes) {
    parts.push(`${Math.round(nearestPlace.etaMinutes)} min`);
  }

  return parts.length > 0
    ? `Je vous montre les lieux les plus proches sur la carte.\nLe plus proche : ${nearestPlace.label} • ${parts.join(" • ")}.`
    : `Je vous montre les lieux les plus proches sur la carte.\nLe plus proche : ${nearestPlace.label}.`;
}

export function AnimatedAIChat() {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mapData, setMapData] = useState<AssistantMapData | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [pendingRoutePrompt, setPendingRoutePrompt] = useState(false);
  const [isPending, startTransition] = useTransition();
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 180,
  });

  const isCommandQuery = value.startsWith("/") && !value.includes(" ");
  const paletteVisible = showCommandPalette || isCommandQuery;
  const matchedSuggestionIndex = isCommandQuery
    ? commandSuggestions.findIndex((item) => item.prefix.startsWith(value))
    : -1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(target)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages, isTyping]);

  const selectCommandSuggestion = (index: number) => {
    const selected = commandSuggestions[index];
    if (!selected) return;

    setValue(`${selected.prefix} `);
    setShowCommandPalette(false);
    setRecentCommand(selected.label);
    window.setTimeout(() => setRecentCommand(null), 2200);
  };

  const fetchAssistantMap = async (payload: {
    mode: "route" | "nearby";
    destinationQuery?: string;
    category?: string;
  }) => {
    setIsMapLoading(true);

    try {
      const response = await fetch("/api/myexperience-map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as AssistantMapData & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "La carte n'a pas pu etre chargee.");
      }

      setMapData(result);
      return result;
    } catch {
      setMapData(null);
      return null;
    } finally {
      setIsMapLoading(false);
    }
  };

  const submitMessage = (content: string) => {
    if (!content) return;

    const nearbyCategory = extractNearbyCategory(content);
    const explicitDestination = extractDestinationFromMessage(content);
    const shouldTreatAsPendingAddress =
      pendingRoutePrompt &&
      !looksLikeDistanceRequest(content) &&
      !nearbyCategory &&
      looksLikeAddressResponse(content);
    const shouldAskForAddress =
      looksLikeDistanceRequest(content) && !explicitDestination && !nearbyCategory;
    const routeDestination = shouldTreatAsPendingAddress ? content.trim() : explicitDestination;

    messageIdRef.current += 1;
    const nextUserMessage: ChatMessage = {
      id: `user-${messageIdRef.current}`,
      role: "user",
      content,
    };

    const pushAssistantMessage = (reply: string) => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${messageIdRef.current + 1}`,
          role: "assistant",
          content: reply,
        },
      ]);
      messageIdRef.current += 1;
    };

    startTransition(() => {
      setMessages((current) => [...current, nextUserMessage]);
      setValue("");
      setShowCommandPalette(false);
      setAttachments([]);
      adjustHeight(true);
      setIsTyping(true);
      setPendingRoutePrompt(shouldAskForAddress);

      if (shouldAskForAddress) {
        pushAssistantMessage(buildQuickAddressReply());
        setPendingRoutePrompt(false);
        setIsTyping(false);
        return;
      }

      if (routeDestination) {
        void fetchAssistantMap({ mode: "route", destinationQuery: routeDestination })
          .then((result) => {
            if (result) {
              pushAssistantMessage(buildMapToolReply(result));
            } else {
              pushAssistantMessage("Je n'ai pas pu charger la carte pour ce trajet.");
            }
          })
          .finally(() => {
            setIsTyping(false);
          });
        setPendingRoutePrompt(false);
        return;
      }

      if (nearbyCategory) {
        void fetchAssistantMap({ mode: "nearby", category: nearbyCategory })
          .then((result) => {
            if (result) {
              pushAssistantMessage(buildMapToolReply(result));
            } else {
              pushAssistantMessage("Je n'ai pas pu charger la carte des lieux a proximite.");
            }
          })
          .finally(() => {
            setIsTyping(false);
          });
        setPendingRoutePrompt(false);
        return;
      }

      void fetch("/api/myexperience-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-6),
        }),
      })
        .then(async (response) => {
          const payload = (await response.json()) as { reply?: string; error?: string };
          if (!response.ok || typeof payload.reply !== "string" || !payload.reply.trim()) {
            throw new Error(payload.error || "Une erreur est survenue.");
          }

          pushAssistantMessage(payload.reply.trim());
        })
        .catch((error: unknown) => {
          const fallback =
            error instanceof Error
              ? error.message
              : "MyAssistant n'a pas pu repondre pour le moment.";

          setMessages((current) => [
            ...current,
            {
              id: `assistant-error-${messageIdRef.current + 1}`,
              role: "assistant",
              content: fallback,
            },
          ]);
          messageIdRef.current += 1;
        })
        .finally(() => {
          setIsTyping(false);
        });
    });
  };

  const handleSendMessage = () => {
    submitMessage(value.trim());
  };

  const handleQuickPrompt = (question: string, label: string) => {
    setRecentCommand(label);
    window.setTimeout(() => setRecentCommand(null), 2200);
    submitMessage(question);
  };

  const handleScrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (paletteVisible) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((current) =>
          current < commandSuggestions.length - 1 ? current + 1 : 0,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((current) =>
          current > 0 ? current - 1 : commandSuggestions.length - 1,
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const targetIndex = activeSuggestion >= 0 ? activeSuggestion : matchedSuggestionIndex;
        if (targetIndex >= 0) selectCommandSuggestion(targetIndex);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setShowCommandPalette(false);
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachFile = () => {
    const mockFileName = `document-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments((current) => [...current, mockFileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section className="lab-bg relative overflow-hidden rounded-[28px] border border-transparent bg-transparent px-5 py-8 text-black shadow-none md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,48,140,0.18),transparent_36%)]" />
        <div className="absolute left-[12%] top-[10%] h-52 w-52 rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute bottom-[4%] right-[14%] h-56 w-56 rounded-full bg-fuchsia-500/8 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="space-y-3 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-medium tracking-[-0.05em] text-black md:text-5xl">
              Comment puis-je vous aider ?
            </h2>
            <div className="mx-auto h-px w-28 bg-gradient-to-r from-transparent via-black/18 to-transparent md:w-48" />
            <p className="text-sm text-black/70 md:text-lg">
              AI sur votre projet Mésange
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
          className="relative w-full rounded-[24px] border border-black/8 bg-white/[0.12] shadow-[0_16px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        >
          <AnimatePresence>
            {paletteVisible ? (
              <motion.div
                ref={commandPaletteRef}
                className="absolute inset-x-4 bottom-full z-20 mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-2xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
              >
                {commandSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.prefix}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      (activeSuggestion >= 0 ? activeSuggestion : matchedSuggestionIndex) === index
                        ? "bg-black/8 text-black"
                        : "text-black/88 hover:bg-black/5",
                    )}
                    onClick={() => selectCommandSuggestion(index)}
                  >
                    <span className="text-black">{suggestion.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{suggestion.label}</span>
                      <span className="block truncate text-xs text-black/60">
                        {suggestion.description}
                      </span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-black/55">
                      {suggestion.prefix}
                    </span>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="px-5 pb-5 pt-5 md:px-8 md:pt-7">
            {messages.length > 0 ? (
              <div
                ref={messageViewportRef}
                className="mb-5 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 md:text-[15px]",
                      message.role === "user"
                        ? "self-end bg-black text-white"
                        : "self-start border border-black/8 bg-white/75 text-black",
                    )}
                  >
                    {message.content}
                  </div>
                ))}

                {isTyping ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="self-start rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-black"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-black px-2 text-[10px] font-semibold tracking-[0.08em] text-white">
                        MyAssistant
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm text-black/80">
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        MyAssistant reflechit...
                      </span>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            ) : null}

            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className="min-h-[42px] resize-none border-none bg-transparent px-0 py-0 text-lg text-black placeholder:text-black/45 focus-visible:ring-0 md:text-[22px]"
              style={{ overflow: "hidden" }}
            />

            <AnimatePresence>
              {attachments.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {attachments.map((file, index) => (
                    <div
                      key={`${file}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] text-black/85"
                    >
                      <span>{file}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                          className="text-black/65 transition-colors hover:text-black"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-black/8 px-4 py-4 md:px-5">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAttachFile}
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-stone-200 bg-white/78 text-stone-900 hover:bg-stone-50"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                data-command-button
                onClick={() => setShowCommandPalette((current) => !current)}
                variant="outline"
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-xl border-stone-200 bg-white/78 hover:bg-stone-50",
                  paletteVisible ? "text-stone-950" : "text-stone-900",
                )}
              >
                <Command className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isMapLoading || mapData ? (
                <Button
                  onClick={handleScrollToMap}
                  variant="secondary"
                  size="default"
                  className={cn(
                    "min-h-11 rounded-xl px-4",
                    mapData
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "bg-sky-100 text-sky-700 hover:bg-sky-200",
                  )}
                >
                  Voir la map
                </Button>
              ) : null}

              <Button
                onClick={handleSendMessage}
                disabled={isTyping || isPending || !value.trim()}
                variant={value.trim() ? "default" : "secondary"}
                size="default"
                className={cn(
                  "min-h-11 rounded-xl px-5 text-base",
                  value.trim()
                    ? "bg-stone-950 text-stone-50 hover:bg-stone-900"
                    : "bg-stone-100 text-stone-400 hover:bg-stone-100",
                )}
              >
                {isTyping ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
                <span>Envoyer</span>
              </Button>
            </div>
          </div>

          {recentCommand ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-4 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/70"
            >
              {recentCommand}
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.3 }}
        >
          <GradientPromptButtons
            items={quickPrompts.map((prompt) => ({
              label: prompt.label,
              icon: prompt.icon,
              gradientFrom: prompt.gradientFrom,
              gradientTo: prompt.gradientTo,
              onClick: () => handleQuickPrompt(prompt.question, prompt.label),
            }))}
          />
        </motion.div>

        {isMapLoading || mapData ? (
          <div ref={mapSectionRef} className="w-full">
            {isMapLoading ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/[0.04] px-4 py-2 text-sm text-black/75">
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Chargement de la carte...
              </div>
            ) : null}

            {mapData ? (
              <div className={cn(isMapLoading ? "mt-4" : "")}>
                <MyExperienceAssistantMap data={mapData} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
