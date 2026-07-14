"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  getLocaleFromPathname,
  stripLocaleFromPathname,
  withLocalePath,
} from "@/lib/i18n";

type Theme = "light" | "dark";
const THEME_COOKIE_KEY = "theme";
const MOBILE_NAV_BREAKPOINT = 980;

type SiteHeaderProps = {
  initialTheme: Theme;
};

export function SiteHeader({ initialTheme }: SiteHeaderProps) {
  const pathname = usePathname();
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);
  const localeFromPath = getLocaleFromPathname(pathname);
  const locale = localeFromPath ?? DEFAULT_LOCALE;
  const subpath = stripLocaleFromPathname(pathname);
  const messages = getMessages(locale).header;
  const isGalleryPage = subpath === "/";
  const activeNavKey = isGalleryPage
    ? "gallery"
    : subpath === "/services" || subpath === "/price"
        ? "price"
      : subpath === "/myreview" ||
          subpath === "/mystudio" ||
          subpath === "/myproject" ||
          subpath === "/mywebsite"
        ? "mystudio"
        : subpath === "/about"
        ? "about"
        : subpath === "/contact"
          ? "contact"
          : null;

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > MOBILE_NAV_BREAKPOINT) return;
    const nav = mobileNavRef.current;
    if (!nav) return;

    const centerActiveItem = (behavior: ScrollBehavior) => {
      const activeItem =
        activeNavKey !== null
          ? nav.querySelector<HTMLElement>(`[data-nav-key="${activeNavKey}"]`)
          : null;

      if (!activeItem) return;

      const targetLeft =
        activeItem.offsetLeft - nav.clientWidth / 2 + activeItem.clientWidth / 2;

      nav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior,
      });
    };

    const frame = window.requestAnimationFrame(() => {
      centerActiveItem("auto");
    });

    const handleResize = () => {
      centerActiveItem("auto");
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frame);
    };
  }, [activeNavKey, pathname, theme]);

  useEffect(() => {
    if (!openSubmenuKey) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (headerRef.current?.contains(event.target)) return;
      setOpenSubmenuKey(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenSubmenuKey(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openSubmenuKey]);

  const localizedHref = (target: string) => withLocalePath(locale, target);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  };

  const navItems = [
    {
      key: "gallery",
      label: messages.nav.gallery,
      href: localizedHref("/"),
      isCurrent: isGalleryPage,
      kind: "link" as const,
    },
    {
      key: "mystudio",
      label: "MYSTUDIO",
      isCurrent:
        subpath === "/myreview" ||
        subpath === "/mystudio" ||
        subpath === "/myproject" ||
        subpath === "/mywebsite",
      kind: "submenu" as const,
      children: [
        {
          label: "MyReview™",
          href: "/myreview",
          isCurrent:
            subpath === "/myreview" || subpath === "/mystudio" || subpath === "/myproject",
        },
        {
          label: "MyWebsite",
          href: localizedHref("/mywebsite"),
          isCurrent: subpath === "/mywebsite",
        },
      ],
    },
    {
      key: "price",
      label: messages.nav.price,
      href: localizedHref("/price"),
      isCurrent: subpath === "/price" || subpath === "/services",
      kind: "link" as const,
    },
    {
      key: "about",
      label: messages.nav.about,
      href: localizedHref("/about"),
      isCurrent: subpath === "/about",
      kind: "link" as const,
    },
    {
      key: "contact",
      label: messages.nav.contact,
      href: localizedHref("/contact"),
      isCurrent: subpath === "/contact",
      kind: "link" as const,
    },
    {
      key: "book-meeting",
      label: "Book a meeting",
      href: CALENDLY_MEETING_URL,
      kind: "anchor" as const,
      target: "_blank" as const,
    },
    {
      key: "theme",
      label: theme === "dark" ? messages.themeLabels.dark : messages.themeLabels.light,
      kind: "button" as const,
    },
  ];

  const mobileNavItems = [
    ...navItems.filter((item) => item.key !== "theme"),
    navItems.find((item) => item.key === "theme"),
  ].filter((item) => item !== undefined);
  const mobileBookingItem = mobileNavItems.find((item) => item.key === "book-meeting");
  const mobileThemeItem = mobileNavItems.find((item) => item.key === "theme");
  const mobilePrimaryItems = mobileNavItems.filter(
    (item) => item.key !== "theme" && item.key !== "book-meeting",
  );

  const renderNavItems = (items: typeof navItems, isMobile = false) =>
    items.map((item) => {
      const commonProps = {
        className: `siteNavLink${item.kind === "button" ? " themeToggle" : ""}`,
        "data-nav-key": item.key,
      };

      if (item.kind === "link") {
        return (
          <Link
            key={item.key}
            {...commonProps}
            href={item.href}
            aria-current={item.isCurrent ? "page" : undefined}
            onClick={() => setOpenSubmenuKey(null)}
          >
            {item.label}
          </Link>
        );
      }

      if (item.kind === "anchor") {
        return (
          <a
            key={item.key}
            {...commonProps}
            href={item.href}
            target={item.target}
            rel={item.target === "_blank" ? "noreferrer" : undefined}
            onClick={() => setOpenSubmenuKey(null)}
          >
            {item.label}
          </a>
        );
      }

      if (item.kind === "submenu") {
        const isOpen = openSubmenuKey === item.key;

        return (
          <div
            key={item.key}
            className="siteNavSubmenu"
            data-nav-key={item.key}
            data-open={isOpen ? "true" : "false"}
            data-mobile={isMobile ? "true" : "false"}
          >
            <button
              type="button"
              className="siteNavLink siteNavSubmenuTrigger"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              data-current={item.isCurrent ? "true" : "false"}
              onClick={() =>
                setOpenSubmenuKey((current) => (current === item.key ? null : item.key))
              }
            >
              <span>{item.label}</span>
            </button>

            {isMobile ? null : (
              <div className="siteNavSubmenuPanel" role="menu" aria-label={item.label}>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    className="siteNavSublink"
                    href={child.href}
                    role="menuitem"
                    aria-current={child.isCurrent ? "page" : undefined}
                    onClick={() => setOpenSubmenuKey(null)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={item.key}
          {...commonProps}
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          aria-pressed={theme === "dark"}
        >
          {item.label}
        </button>
      );
    });

  return (
    <header ref={headerRef} className="siteHeader">
      <div className="siteHeaderMain">
        <Link className="siteLogo" href={localizedHref("/")}>
          <Image
            className="siteLogoImage siteLogoImageBlack"
            src="/bs-logo-menu-cropped.png"
            alt={site.name}
            width={2565}
            height={570}
            priority
          />
          <Image
            className="siteLogoImage siteLogoImageWhite"
            src="/bs-logo-menu-white.png"
            alt=""
            width={2511}
            height={585}
            priority
            aria-hidden="true"
          />
        </Link>

        <nav className="siteNav siteNavDesktop" aria-label="Primary">
          {renderNavItems(navItems.filter((item) => item.key !== "book-meeting"))}
        </nav>

        <a
          className="siteHeaderBookingCta"
          href={CALENDLY_MEETING_URL}
          target="_blank"
          rel="noreferrer"
        >
          Book a meeting
        </a>
      </div>

      <nav ref={mobileNavRef} className="siteNavMobile" aria-label="Primary">
        {mobileBookingItem ? renderNavItems([mobileBookingItem], true) : null}
        {renderNavItems(mobilePrimaryItems, true)}
        {mobileThemeItem ? renderNavItems([mobileThemeItem], true) : null}
      </nav>

      {openSubmenuKey === "mystudio" ? (
        <div className="siteNavMobileSubmenuPanel" role="menu" aria-label="MYSTUDIO">
          <Link
            className="siteNavMobileSublink"
            href="/myreview"
            role="menuitem"
            aria-current={
              subpath === "/myreview" ||
              subpath === "/mystudio" ||
              subpath === "/myproject"
                ? "page"
                : undefined
            }
            onClick={() => setOpenSubmenuKey(null)}
          >
            <span>MyReview™</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link
            className="siteNavMobileSublink"
            href={localizedHref("/mywebsite")}
            role="menuitem"
            aria-current={subpath === "/mywebsite" ? "page" : undefined}
            onClick={() => setOpenSubmenuKey(null)}
          >
            <span>MyWebsite</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : null}
    </header>
  );
}
