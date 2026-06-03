"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
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
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const localeFromPath = getLocaleFromPathname(pathname);
  const locale = localeFromPath ?? DEFAULT_LOCALE;
  const subpath = stripLocaleFromPathname(pathname);
  const messages = getMessages(locale).header;
  const headerNotice =
    locale === "fr"
      ? "New : des 4 images commandees, site web de vente inclu dans la livraison"
      : "New: from 4 images ordered, a sales website is included in the delivery";
  const isGalleryPage = subpath === "/";
  const activeNavKey = isGalleryPage
    ? "gallery"
    : subpath === "/services"
      ? "services"
      : subpath === "/price"
        ? "price"
      : subpath === "/mystudio" || subpath === "/myproject"
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
      label: "myStudio",
      href: "/mystudio",
      isCurrent: subpath === "/mystudio" || subpath === "/myproject",
      kind: "link" as const,
    },
    {
      key: "services",
      label: messages.nav.services,
      href: localizedHref("/services"),
      isCurrent: subpath === "/services",
      kind: "link" as const,
    },
    {
      key: "price",
      label: messages.nav.price,
      href: localizedHref("/price"),
      isCurrent: subpath === "/price",
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
      key: "instagram",
      label: messages.nav.instagram,
      href: site.instagramUrl,
      kind: "anchor" as const,
    },
    {
      key: "theme",
      label: theme === "dark" ? messages.themeLabels.dark : messages.themeLabels.light,
      kind: "button" as const,
    },
  ];

  const mobileNavItems = [
    navItems.find((item) => item.key === "theme"),
    ...navItems.filter((item) => item.key !== "theme"),
  ].filter((item) => item !== undefined);

  const renderNavItems = (items: typeof navItems) =>
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
          >
            {item.label}
          </Link>
        );
      }

      if (item.kind === "anchor") {
        return (
          <a key={item.key} {...commonProps} href={item.href}>
            {item.label}
          </a>
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
    <header className="siteHeader">
      <div className="siteHeaderNotice">
        <span className="siteHeaderNoticeText">{headerNotice}</span>
      </div>

      <div className="siteHeaderMain">
        <Link className="siteLogo" href={localizedHref("/")}>
          <Image
            className="siteLogoImage siteLogoImageBlack"
            src="/bs-logo-black.png"
            alt={site.name}
            width={891}
            height={165}
            priority
          />
          <Image
            className="siteLogoImage siteLogoImageWhite"
            src="/bs-logo-white.png"
            alt=""
            width={892}
            height={166}
            priority
            aria-hidden="true"
          />
        </Link>

        <nav className="siteNav siteNavDesktop" aria-label="Primary">
          {renderNavItems(navItems)}
        </nav>
      </div>

      <nav ref={mobileNavRef} className="siteNavMobile" aria-label="Primary">
        {renderNavItems(mobileNavItems)}
      </nav>
    </header>
  );
}
