import Link from "next/link";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

const footerLocation = "Suisse / Canada";

export function SiteFooter({ locale }: { locale: Locale }) {
  const messages = getMessages(locale).header;
  const pageLinks = [
    { label: messages.nav.gallery, href: withLocalePath(locale, "/") },
    { label: messages.nav.services, href: withLocalePath(locale, "/services") },
    { label: messages.nav.about, href: withLocalePath(locale, "/about") },
    { label: messages.nav.contact, href: withLocalePath(locale, "/contact") },
    { label: "Team", href: withLocalePath(locale, "/team/client") },
    {
      label: "myStudio",
      href: "/myproject",
    },
    {
      label: "myStudio Admin",
      href: "/admin/client-projects",
    },
  ];

  return (
    <footer className="siteFooter">
      <span className="siteFooterText">{footerLocation}</span>
      {pageLinks.map((link) => (
        <Link key={link.href} className="siteFooterLink" href={link.href}>
          {link.label}
        </Link>
      ))}
      <a className="siteFooterLink" href={`tel:${site.contact.phone}`}>
        {site.contact.phone}
      </a>
      <a className="siteFooterLink" href={`mailto:${site.contact.email}`}>
        {site.contact.email}
      </a>
      <a
        className="siteFooterLink"
        href={site.instagramUrl}
        target="_blank"
        rel="noreferrer"
      >
        Instagram
      </a>
    </footer>
  );
}
