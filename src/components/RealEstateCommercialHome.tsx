import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";

import { RealEstateNavigation } from "@/components/RealEstateNavigation";

export function RealEstateCommercialHome({ locale }: { locale: Locale }) {
  const listingsHref = withLocalePath(locale, "/immobilier/biens");

  return (
    <>
      <RealEstateNavigation locale={locale} active="home" />
      <main className="siteMain realEstateSitePage realEstateCommercialHome">
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
          <Image src="/immobilier/hero-promotion.png" alt="Villa contemporaine avec vue sur un lac et les Alpes" fill priority sizes="(max-width: 760px) 100vw, 64vw" />
        </div>
      </section>

      <section className="realEstateCommercialProcess" aria-labelledby="commercial-process-title">
        <p className="realEstateCommercialEyebrow">Notre accompagnement</p>
        <h2 id="commercial-process-title">Vous construisez.<br />On s’occupe du reste.</h2>
        <div className="realEstateCommercialSteps">
          <div><span>01</span><strong>Positionnement & stratégie</strong><p>Clarifier le projet, son marché et la manière de le présenter.</p></div>
          <div><span>02</span><strong>Images 3D & contenus</strong><p>Créer les visuels, plans et supports qui rendent le projet désirable.</p></div>
          <div><span>03</span><strong>Site web & commercialisation</strong><p>Mettre en ligne une expérience claire pour présenter et vendre les lots.</p></div>
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
    </>
  );
}
