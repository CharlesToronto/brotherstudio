import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

import { RealEstateNavigation } from "@/components/RealEstateNavigation";

export function RealEstateCommercialStudio({ locale }: { locale: Locale }) {
  const contactHref = withLocalePath(locale, "/contact");
  return (
    <>
      <RealEstateNavigation locale={locale} active="studio" />
      <main className="siteMain realEstateSitePage realEstateCommercialStudio">
      <section className="realEstateStudioIntro">
        <p className="realEstateCommercialEyebrow">Studio de commercialisation</p>
        <h1>Votre projet mérite<br />une vraie expérience de vente.</h1>
        <p>Nous réunissons stratégie, image et outils digitaux pour accompagner la commercialisation de promotions immobilières, de la première idée jusqu’au dernier lot.</p>
      </section>
      <section className="realEstateStudioServices">
        <div><span>01</span><h2>Positionnement</h2><p>Nous clarifions le message, le public cible et la valeur distinctive du projet.</p></div>
        <div><span>02</span><h2>Images & vidéos</h2><p>Nous créons des rendus 3D, images, plans et contenus qui permettent de se projeter.</p></div>
        <div><span>03</span><h2>Commercialisation</h2><p>Nous construisons les supports et l’expérience en ligne qui facilitent la prise de décision.</p></div>
      </section>
      <section className="realEstateStudioDeliverables">
        <div><p className="realEstateCommercialEyebrow">Ce que nous créons</p><h2>Tout ce qu’il faut pour présenter, expliquer et vendre.</h2></div>
        <ul><li>Identité et direction artistique du projet</li><li>Images 3D photoréalistes et vidéos</li><li>Site web ou landing page dédiée</li><li>Brochure, plans et supports commerciaux</li><li>Présentation des lots et disponibilités</li></ul>
      </section>
      <section className="realEstateCommercialCta"><div><p className="realEstateCommercialEyebrow">Un projet ?</p><h2>Parlons de votre projet.</h2></div><Link href={contactHref}>Prendre contact <span aria-hidden="true">↗</span></Link></section>
      </main>
    </>
  );
}
