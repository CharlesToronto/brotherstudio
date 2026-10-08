import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";

import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { LandingBackgroundTransition } from "@/components/LandingBackgroundTransition";
import { RealEstateFooter } from "@/components/RealEstateFooter";

export function RealEstateCommercialHome({ locale }: { locale: Locale }) {
  const listingsHref = withLocalePath(locale, "/immobilier/biens");

  return (
    <>
      <RealEstateNavigation locale={locale} active="home" />
      <main id="real-estate-home" className="siteMain realEstateSitePage realEstateCommercialHome">
      <LandingBackgroundTransition pageId="real-estate-home" triggerSelector=".realEstateCommercialProcess" />
      <section className="realEstateCommercialHero">
        <div className="realEstateCommercialHeroCopy">
          <p className="realEstateCommercialEyebrow">Promotion immobilière</p>
          <h1>De l’idée à la vente.</h1>
          <span className="realEstateCommercialRule" aria-hidden="true" />
          <div className="realEstateHeroActions">
            <Link className="realEstateHeroActionPrimary" href={listingsHref}>Découvrir nos biens <span aria-hidden="true">↗</span></Link>
            <a className="realEstateHeroActionSecondary realEstateHeroActionNeon" href="https://brotherstudio.ch" target="_blank" rel="noreferrer">Commercialiser mon projet <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="realEstateCommercialHeroImage">
          <Image src="/immobilier/hero-lac-alpes.webp" alt="Résidence contemporaine avec terrasses donnant sur un lac et les Alpes" fill priority sizes="(max-width: 760px) 100vw, 64vw" />
        </div>
      </section>

      <section className="realEstateCommercialProcess" aria-labelledby="commercial-process-title">
        <p className="realEstateCommercialEyebrow">Notre accompagnement</p>
        <h2 id="commercial-process-title">Vous achetez, vendez ou construisez.<br />On vous accompagne.</h2>
        <div className="realEstateCommercialSteps">
          <div><span>01</span><strong>Acheter un bien</strong><p>Nous vous aidons à trouver le lieu qui correspond à vos envies et vous accompagnons à chaque étape de l’achat.</p></div>
          <div><span>02</span><strong>Vendre votre bien</strong><p>Nous mettons votre bien en valeur et définissons avec vous une stratégie de commercialisation adaptée.</p></div>
          <div><span>03</span><strong>Commercialiser votre projet</strong><p>Nous créons les images 3D, les supports et le site web pour mettre en valeur votre projet et accompagner la vente des lots.</p></div>
          <div><span>04</span><strong>Accompagnement à la vente</strong><p>Nous trouvons l’acheteur, organisons les visites et vous accompagnons dans les négociations et les démarches jusqu’à la signature.</p></div>
        </div>
      </section>

      <section className="realEstateCommercialCta">
        <div><p className="realEstateCommercialEyebrow">Un projet ?</p><h2>Parlons de votre projet.</h2></div>
        <a href={CALENDLY_MEETING_URL} target="_blank" rel="noreferrer">Planifier un appel vidéo <span aria-hidden="true">↗</span></a>
      </section>

      <section className="realEstateCommercialListingsTeaser">
        <div><p className="realEstateCommercialEyebrow">À découvrir</p><h2 className="realEstateNeonText">Nos biens immobiliers.</h2></div>
        <Link href={listingsHref}>Voir tous les biens <span aria-hidden="true">↗</span></Link>
      </section>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}
