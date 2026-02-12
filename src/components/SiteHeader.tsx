"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { site } from "@/content/site";

type Theme = "light" | "dark";
const THEME_COOKIE_KEY = "theme";

type SiteHeaderProps = {
  initialTheme: Theme;
};

export function SiteHeader({ initialTheme }: SiteHeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>(initialTheme);

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
      <Link className="siteLogo" href="/">
        {site.name}
      </Link>

      <nav className="siteNav" aria-label="Primary">
        <Link
          className="siteNavLink"
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          Gallery
        </Link>
        <a className="siteNavLink" href={site.instagramUrl}>
          Instagram
        </a>
        <Link
          className="siteNavLink"
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
        >
          Contact
        </Link>
        <button
          className="siteNavLink themeToggle"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? "ON" : "OFF"}
        </button>
      </nav>
    </header>
  );
}
