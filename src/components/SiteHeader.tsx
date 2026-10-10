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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const desktopRealEstateTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileRealEstateTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopMoreTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMoreTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, [locale]);

  useEffect(() => {
    if (openSubmenu !== "real-estate" && openSubmenu !== "more") return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setOpenSubmenu(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenSubmenu(null);
        const isMobile = window.matchMedia("(max-width: 980px)").matches;
        const trigger = openSubmenu === "real-estate"
          ? (isMobile ? mobileRealEstateTriggerRef.current : desktopRealEstateTriggerRef.current)
          : (isMobile ? mobileMoreTriggerRef.current : desktopMoreTriggerRef.current);
        trigger?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openSubmenu]);

  useEffect(() => {
    const header = headerRef.current;
    const nav = header?.querySelector<HTMLElement>(".siteNavMobile");
    if (!header || !nav) return;

    const mobileQuery = window.matchMedia("(max-width: 980px)");
    let frame = 0;

    const syncFooterContrast = () => {
      frame = 0;
      const navRect = nav.getBoundingClientRect();
      const sampleY = navRect.top + navRect.height / 2;
      const overFooter = mobileQuery.matches && navRect.height > 0 &&
        Array.from(document.querySelectorAll<HTMLElement>("footer, .siteFooter")).some((footer) => {
          const rect = footer.getBoundingClientRect();
          return rect.height > 0 && rect.top <= sampleY && rect.bottom >= sampleY;
        });
      header.dataset.mobileNavOverFooter = String(overFooter);
    };
    const scheduleSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncFooterContrast);
    };

    syncFooterContrast();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    const observer = new ResizeObserver(scheduleSync);
    observer.observe(document.body);
    observer.observe(nav);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      observer.disconnect();
      delete header.dataset.mobileNavOverFooter;
    };
  }, [pathname]);

  const localizedHref = (target: string) => withLocalePath(locale, target);

  const realEstateSubmenuItems = [
    {
      label: locale === "fr" ? "Accueil" : "Home",
      href: localizedHref("/immobilier"),
    },
    {
      label: locale === "fr" ? "Nos biens" : "Properties",
      href: localizedHref("/immobilier/biens"),
    },
    {
      label: locale === "fr" ? "Vendre mon bien" : "Sell my property",
      href: localizedHref("/immobilier/vendre"),
    },
  ];

  const moreSubmenuItems = [
    {
      key: "insights",
      label: "Insights",
      href: localizedHref("/insights"),
      isCurrent: subpath === "/insights",
    },
    {
      key: "about",
      label: messages.nav.about,
      href: localizedHref("/about"),
      isCurrent: subpath === "/about",
    },
    {
      key: "price",
      label: messages.nav.price,
      href: localizedHref("/price"),
      isCurrent: subpath === "/price" || subpath === "/services",
    },
  ];

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
      kind: "link" as const,
    },
    {
      key: "more",
      label: locale === "fr" ? "Plus" : "More",
      href: localizedHref("/insights"),
      isCurrent: moreSubmenuItems.some((submenuItem) => submenuItem.isCurrent),
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

  const renderNavItems = (items: typeof navItems, isMobile = false) =>
    items.map((item) => {
      const commonProps = {
        className: "siteNavLink",
        "data-nav-key": item.key,
      };

      if (item.key === "real-estate" || item.key === "more") {
        const isOpen = openSubmenu === item.key;
        const submenuItems = item.key === "real-estate" ? realEstateSubmenuItems : moreSubmenuItems;
        const isCurrent = item.key === "real-estate"
          ? subpath.startsWith("/immobilier")
          : moreSubmenuItems.some((submenuItem) => submenuItem.isCurrent);
        const panelId = item.key === "real-estate"
          ? (isMobile ? "mobile-real-estate-submenu" : "real-estate-submenu")
          : (isMobile ? "mobile-more-submenu" : "more-submenu");
        const triggerRef = item.key === "real-estate"
          ? (isMobile ? mobileRealEstateTriggerRef : desktopRealEstateTriggerRef)
          : (isMobile ? mobileMoreTriggerRef : desktopMoreTriggerRef);

        return (
          <div
            key={item.key}
            className="siteNavSubmenu"
            data-nav-key={item.key}
            data-open={isOpen}
          >
            <button
              ref={triggerRef}
              type="button"
              className="siteNavSubmenuTrigger"
              data-current={isCurrent}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenSubmenu(isOpen ? null : item.key)}
            >
              {item.label}
            </button>
            {!isMobile ? (
              <div
                id={panelId}
                className="siteNavSubmenuPanel"
                aria-hidden={!isOpen}
                inert={!isOpen}
              >
                {submenuItems.map((submenuItem) => (
                  <Link
                    key={submenuItem.href}
                    className="siteNavSublink"
                    href={submenuItem.href}
                    aria-current={(submenuItem.isCurrent ?? (subpath === submenuItem.href.replace(`/${locale}`, ""))) ? "page" : undefined}
                    onClick={() => setOpenSubmenu(null)}
                  >
                    {submenuItem.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      }

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
    <header className="siteHeader" ref={headerRef}>
      <div className="siteHeaderMain">
        <Link className="siteLogo" href={localizedHref("/")}>
          <Image
            className="siteLogoImage siteLogoImageBlack"
            src="/bs-logo-menu-cropped.webp"
            alt={site.name}
            width={2565}
            height={570}
            priority
          />
          <Image
            className="siteLogoImage siteLogoImageWhite"
            src="/bs-logo-menu-white.webp"
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
        {mobileBookingItem ? renderNavItems([mobileBookingItem], true) : null}
        {renderNavItems(mobilePrimaryItems, true)}
      </nav>

      {openSubmenu === "real-estate" || openSubmenu === "more" ? (
        <nav
          id={openSubmenu === "real-estate" ? "mobile-real-estate-submenu" : "mobile-more-submenu"}
          className="siteNavMobileSubmenuPanel"
          aria-label={
            openSubmenu === "real-estate"
              ? (locale === "fr" ? "Pages immobilières" : "Real estate pages")
              : (locale === "fr" ? "Pages supplémentaires" : "More pages")
          }
        >
          {(openSubmenu === "real-estate" ? realEstateSubmenuItems : moreSubmenuItems).map((submenuItem) => (
            <Link
              key={submenuItem.href}
              className="siteNavMobileSublink"
              href={submenuItem.href}
              aria-current={(submenuItem.isCurrent ?? (subpath === submenuItem.href.replace(`/${locale}`, ""))) ? "page" : undefined}
              onClick={() => setOpenSubmenu(null)}
            >
              {submenuItem.label}
            </Link>
          ))}
        </nav>
      ) : null}

    </header>
  );
}
