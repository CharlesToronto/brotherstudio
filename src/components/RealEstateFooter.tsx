import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

export function RealEstateFooter({ locale }: { locale: Locale }) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/immobilier/biens");
  const valuationHref = withLocalePath(locale, "/immobilier/vendre");
  const studioHref = withLocalePath(locale, "/immobilier/commercialisation");
  const mortgageHref = withLocalePath(locale, "/immobilier/calculateur-hypothecaire");

  return (
    <footer id="site-footer" className="realEstateFooter">
      <div className="realEstateFooterTop">
        <Link className="realEstateFooterLogo" href={homeHref} aria-label={locale === "fr" ? "Brother Studio Immobilier" : "Brother Studio Real Estate"}>
          {locale === "fr" ? "brother studio immobilier." : "brother studio real estate."}
        </Link>
        <p>{locale === "fr" ? "Des lieux à vivre. Des projets à vendre." : "Places to live. Projects to sell."}</p>
      </div>
      <div className="realEstateFooterGrid">
        <div>
          <p className="realEstateFooterLabel">{locale === "fr" ? "Immobilier" : "Real estate"}</p>
          <nav aria-label={locale === "fr" ? "Navigation immobilière" : "Real estate navigation"}>
            <Link href={homeHref}>{locale === "fr" ? "Accueil" : "Home"}</Link>
            <Link href={listingsHref}>{locale === "fr" ? "Nos biens immobiliers" : "Our properties"}</Link>
            <Link href={mortgageHref}>{locale === "fr" ? "Calculateur hypothécaire" : "Mortgage calculator"}</Link>
            <Link href={valuationHref}>{locale === "fr" ? "Vendre mon bien" : "Sell my property"}</Link>
            <Link href={studioHref}>{locale === "fr" ? "Commercialiser mon projet" : "Market my development"}</Link>
          </nav>
        </div>
        <div>
          <p className="realEstateFooterLabel">Contact</p>
          <a href="mailto:info@brotherstudio.ca">info@brotherstudio.ca</a>
          <a href="tel:+14376773212">+1 437 677 3212</a>
        </div>
        <div>
          <p className="realEstateFooterLabel">Brother Studio</p>
          <p>{locale === "fr" ? "Suisse / Canada" : "Switzerland / Canada"}</p>
          <a href={`https://brotherstudio.ch/${locale}`} target="_blank" rel="noreferrer">{locale === "fr" ? "Site principal ↗" : "Main website ↗"}</a>
          <Link href="/admin/immobilier">Admin</Link>
        </div>
      </div>
      <div className="realEstateFooterBottom">
        <span>© {new Date().getFullYear()} {locale === "fr" ? "Brother Studio Immobilier" : "Brother Studio Real Estate"}</span>
        <span>{locale === "fr" ? "Créer de la valeur pour les lieux de demain." : "Creating value for the places of tomorrow."}</span>
      </div>
    </footer>
  );
}
