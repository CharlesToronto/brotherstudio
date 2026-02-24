"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

type SiteHeaderProps = {
  initialTheme: Theme;
};

export function SiteHeader({ initialTheme }: SiteHeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const localeFromPath = getLocaleFromPathname(pathname);
  const locale = localeFromPath ?? DEFAULT_LOCALE;
  const subpath = stripLocaleFromPathname(pathname);
  const messages = getMessages(locale).header;
  const isGalleryPage = subpath === "/";

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, [locale]);

  const localizedHref = (target: string) => withLocalePath(locale, target);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  };

  return (
    <header className="siteHeader">
      <Link className="siteLogo" href={localizedHref("/")}>
        {site.name}
      </Link>

      <nav className="siteNav" aria-label="Primary">
        <Link
          className="siteNavLink"
          href={localizedHref("/")}
          aria-current={isGalleryPage ? "page" : undefined}
        >
          {messages.nav.gallery}
        </Link>
        <a className="siteNavLink" href={site.instagramUrl}>
          {messages.nav.instagram}
        </a>
        <Link
          className="siteNavLink"
          href={localizedHref("/services")}
          aria-current={subpath === "/services" ? "page" : undefined}
        >
          {messages.nav.services}
        </Link>
        <Link
          className="siteNavLink"
          href={localizedHref("/contact")}
          aria-current={subpath === "/contact" ? "page" : undefined}
        >
          {messages.nav.contact}
        </Link>
        <button
          className="siteNavLink themeToggle"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? messages.themeLabels.dark : messages.themeLabels.light}
        </button>
      </nav>
    </header>
  );
}
