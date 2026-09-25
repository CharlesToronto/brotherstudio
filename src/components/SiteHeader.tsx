"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  getLocaleFromPathname,
  stripLocaleFromPathname,
  type Locale,
  withLocalePath,
} from "@/lib/i18n";

type SiteHeaderProps = {
  locale?: Locale;
};

export function SiteHeader({ locale: layoutLocale }: SiteHeaderProps) {
  const pathname = usePathname();
  const localeFromPath = getLocaleFromPathname(pathname);
  const locale = localeFromPath ?? layoutLocale ?? DEFAULT_LOCALE;
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

  const navItems = [
    {
      key: "home",
      label: messages.nav.home,
      href: localizedHref("/"),
      isCurrent: isGalleryPage,
      kind: "link" as const,
    },
    {
      key: "gallery",
      label: messages.nav.gallery,
      href: `${localizedHref("/")}#home-gallery-section`,
      isCurrent: false,
      kind: "link" as const,
    },
    {
      key: "mystudio",
      label: "MYSTUDIO",
      href: localizedHref("/mystudio"),
      isCurrent:
        subpath === "/myreview" ||
        subpath === "/mystudio" ||
        subpath === "/myproject" ||
        subpath === "/mywebsite",
      kind: "link" as const,
    },
    {
      key: "real-estate",
      label: messages.nav.realEstate,
      href: localizedHref("/immobilier"),
      isCurrent: subpath === "/immobilier",
      kind: "anchor" as const,
      target: "_blank" as const,
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
      label: locale === "fr" ? "Planifier un appel" : "Book a meeting",
      href: CALENDLY_MEETING_URL,
      kind: "anchor" as const,
      target: "_blank" as const,
    },
  ];

  const mobileNavItems = navItems;
  const mobileBookingItem = mobileNavItems.find((item) => item.key === "book-meeting");
  const mobilePrimaryItems = mobileNavItems.filter(
    (item) => item.key !== "book-meeting",
  );

  const renderNavItems = (items: typeof navItems) =>
    items.map((item) => {
      const commonProps = {
        className: "siteNavLink",
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
          <a
            key={item.key}
            {...commonProps}
            href={item.href}
            target={item.target}
            rel={item.target === "_blank" ? "noreferrer" : undefined}
          >
            {item.label}
          </a>
        );
      }

      return null;
    });

  return (
    <header className="siteHeader">
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
          {locale === "fr" ? "Planifier un appel" : "Book a meeting"}
        </a>
      </div>

      <nav className="siteNavMobile" aria-label="Primary">
        {mobileBookingItem ? renderNavItems([mobileBookingItem]) : null}
        {renderNavItems(mobilePrimaryItems)}
      </nav>

    </header>
  );
}
