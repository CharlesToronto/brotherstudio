import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

type RealEstateNavigationProps = {
  locale: Locale;
  active?: "home" | "listings" | "studio";
};

export function RealEstateNavigation({ locale, active = "home" }: RealEstateNavigationProps) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/immobilier/biens");

  return (
    <header className="realEstateLocalHeader">
      <div className="realEstateLocalHeaderInner">
        <Link className="realEstateLocalLogo" href={homeHref} aria-label="Brother Studio Immobilier">
          brother studio immobilier.
        </Link>
        <nav className="realEstateLocalNav" aria-label="Navigation immobilier">
          <Link className={active === "home" ? "is-active" : ""} href={homeHref}>Home</Link>
          <Link className={active === "listings" ? "is-active" : ""} href={listingsHref}>Nos biens immobiliers</Link>
          <a className={`realEstateLocalNavCta${active === "studio" ? " is-active" : ""}`} href="https://brotherstudio.ch" target="_blank" rel="noreferrer">Studio de commercialisation <span aria-hidden="true">↗</span></a>
          <a href="#site-footer">Contact</a>
        </nav>
      </div>
    </header>
  );
}
