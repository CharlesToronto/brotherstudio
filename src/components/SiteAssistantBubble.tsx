"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteAssistantPanelContent } from "@/components/SiteAssistantPanelContent";
import { type AssistantLocale } from "@/lib/siteAssistantKnowledge";
import { DEFAULT_LOCALE, getLocaleFromPathname } from "@/lib/i18n";

type SiteAssistantBubbleProps = {
  hasMobileMenu?: boolean;
};

function buildCopy(locale: AssistantLocale) {
  return locale === "fr"
    ? {
        bubbleLabel: "Q&A",
        dockLabel: "MyAssitant",
        openAria: "Ouvrir l'assistant",
      }
    : {
        bubbleLabel: "Q&A",
        dockLabel: "MyAssitant",
        openAria: "Open assistant",
      };
}

export function SiteAssistantBubble({ hasMobileMenu = true }: SiteAssistantBubbleProps) {
  const pathname = usePathname();
  const locale = (getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE) as AssistantLocale;
  const copy = buildCopy(locale);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
    };

    window.addEventListener("site-assistant:open", handleOpenAssistant);

    return () => {
      window.removeEventListener("site-assistant:open", handleOpenAssistant);
    };
  }, []);

  return (
    <div
      className="siteAssistant"
      data-open={isOpen ? "true" : "false"}
      data-mobile-menu={hasMobileMenu ? "true" : "false"}
    >
      {isOpen ? (
        <SiteAssistantPanelContent
          locale={locale}
          showCloseButton
          onClose={() => setIsOpen(false)}
        />
      ) : null}

      <button
        type="button"
        className="siteAssistantBubbleButton"
        aria-label={copy.openAria}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="siteAssistantBubbleButtonMark">?</span>
        <span className="siteAssistantBubbleButtonLabel">{copy.bubbleLabel}</span>
        <span className="siteAssistantBubbleButtonDockLabel">{copy.dockLabel}</span>
      </button>
    </div>
  );
}
