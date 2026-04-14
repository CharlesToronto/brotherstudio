import Link from "next/link";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

const footerLocation = "Suisse / Canada";

export function SiteFooter({ locale }: { locale: Locale }) {
  const messages = getMessages(locale).header;
  const footerLabels =
    locale === "fr"
      ? {
          studio: "High-End Visualizations",
          navigation: "Navigation",
          access: "Acces",
          admin: "Admin",
          contact: "Contact",
        }
      : {
          studio: "High-End Visualizations",
          navigation: "Navigation",
          access: "Access",
          admin: "Admin",
          contact: "Contact",
        };
  const navigationLinks = [
    { label: messages.nav.gallery, href: withLocalePath(locale, "/") },
    { label: messages.nav.services, href: withLocalePath(locale, "/services") },
    { label: messages.nav.about, href: withLocalePath(locale, "/about") },
    { label: messages.nav.contact, href: withLocalePath(locale, "/contact") },
  ];
  const accessLinks = [
    { label: "myStudio", href: "/mystudio" },
    { label: "myBrochure", href: "/mybrochure" },
  ];
  const adminLinks = [
    { label: "Team", href: withLocalePath(locale, "/team/call") },
    { label: "myStudio Admin", href: "/admin/client-projects" },
  ];
  const contactLinks = [
    { label: site.contact.phone, href: `tel:${site.contact.phone}` },
    { label: site.contact.email, href: `mailto:${site.contact.email}` },
    { label: "Instagram", href: site.instagramUrl, external: true },
  ];
  const footerGroups = [
    { title: footerLabels.navigation, links: navigationLinks },
    { title: footerLabels.access, links: accessLinks },
    { title: footerLabels.admin, links: adminLinks },
    { title: footerLabels.contact, links: contactLinks },
  ];

  const renderFooterLink = (link: {
    label: string;
    href: string;
    external?: boolean;
  }) => {
    if (link.external) {
      return (
        <a
          key={link.href}
          className="siteFooterLink"
          href={link.href}
          target="_blank"
          rel="noreferrer"
        >
          {link.label}
        </a>
      );
    }

    if (link.href.startsWith("/")) {
      return (
        <Link key={link.href} className="siteFooterLink" href={link.href}>
          {link.label}
        </Link>
      );
    }

    return (
      <a key={link.href} className="siteFooterLink" href={link.href}>
        {link.label}
      </a>
    );
  };

  return (
    <footer id="site-footer" className="siteFooter">
      <div className="siteFooterBrand">
        <p className="siteFooterGroupTitle">{footerLabels.studio}</p>
        <p className="siteFooterName">{site.name}</p>
        <p className="siteFooterText">{footerLocation}</p>
      </div>

      {footerGroups.map((group) => (
        <div key={group.title} className="siteFooterGroup siteFooterGroupDesktop">
          <p className="siteFooterGroupTitle">{group.title}</p>
          <div className="siteFooterList">
            {group.links.map((link) => renderFooterLink(link))}
          </div>
        </div>
      ))}

      <div className="siteFooterAccordions">
        {footerGroups.map((group) => (
          <details key={group.title} className="siteFooterAccordion">
            <summary className="siteFooterAccordionSummary">{group.title}</summary>
            <div className="siteFooterList siteFooterAccordionBody">
              {group.links.map((link) => renderFooterLink(link))}
            </div>
          </details>
        ))}
      </div>
    </footer>
  );
}
