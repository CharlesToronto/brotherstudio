import { site } from "@/content/site";

const footerLocation = "Suisse / Canada";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <span className="siteFooterText">{footerLocation}</span>
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
