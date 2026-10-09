import Link from "next/link";
import theme from "./RealEstateTheme.module.css";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

type RealEstateNavigationProps = {
  locale: Locale;
  active?: "home" | "listings" | "studio" | "sell";
};

export function RealEstateNavigation({ locale, active = "home" }: RealEstateNavigationProps) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/immobilier/biens");
  const valuationHref = withLocalePath(locale, "/immobilier/vendre");

  return (
    <header className="realEstateLocalHeader">
      <span className={theme.theme} hidden aria-hidden="true" />
      <div className="realEstateLocalHeaderInner">
        <Link className="realEstateLocalLogo" href={homeHref} aria-label={locale === "fr" ? "Brother Studio Immobilier" : "Brother Studio Real Estate"}>
          {locale === "fr" ? "brother studio immobilier." : "brother studio real estate."}
        </Link>
        <nav className="realEstateLocalNav" aria-label={locale === "fr" ? "Navigation immobilière" : "Real estate navigation"}>
          <Link className={active === "home" ? "is-active" : ""} href={homeHref}>{locale === "fr" ? "Accueil" : "Home"}</Link>
          <Link className={active === "listings" ? "is-active" : ""} href={listingsHref}>{locale === "fr" ? "Nos biens immobiliers" : "Our properties"}</Link>
          <Link className={active === "sell" ? "is-active" : ""} href={valuationHref}>{locale === "fr" ? "Vendre mon bien" : "Sell my property"}</Link>
          <a href="#site-footer">Contact</a>
        </nav>
      </div>
    </header>
  );
}

