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
          <p className="realEstateCommercialEyebrow">{locale === "fr" ? "Promotion immobilière" : "Property development"}</p>
          <h1>{locale === "fr" ? "De l’idée à la vente." : "From idea to sale."}</h1>
          <span className="realEstateCommercialRule" aria-hidden="true" />
          <div className="realEstateHeroActions">
            <Link className="realEstateHeroActionPrimary" href={listingsHref}>{locale === "fr" ? "Découvrir nos biens" : "Explore our properties"} <span aria-hidden="true">↗</span></Link>
            <a className="realEstateHeroActionSecondary realEstateHeroActionNeon" href={`https://brotherstudio.ch/${locale}`} target="_blank" rel="noreferrer">{locale === "fr" ? "Commercialiser mon projet" : "Market my development"} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="realEstateCommercialHeroImage">
          <Image src="/immobilier/hero-lac-alpes.webp" alt={locale === "fr" ? "Résidence contemporaine avec terrasses donnant sur un lac et les Alpes" : "Contemporary residence with terraces overlooking a lake and the Alps"} fill priority sizes="(max-width: 760px) 100vw, 64vw" />
        </div>
      </section>

      <section className="realEstateCommercialProcess" aria-labelledby="commercial-process-title">
        <p className="realEstateCommercialEyebrow">{locale === "fr" ? "Notre accompagnement" : "How we help"}</p>
        <h2 id="commercial-process-title">{locale === "fr" ? "Vous achetez, vendez ou construisez." : "Buying, selling or building."}<br />{locale === "fr" ? "On donne vie à votre projet." : "We bring your project to life."}</h2>
        <div className="realEstateCommercialSteps">
          <div><span>01</span><strong>{locale === "fr" ? "Acheter un bien" : "Buy a property"}</strong><p>{locale === "fr" ? "Nous vous aidons à trouver le lieu qui correspond à vos envies et vous accompagnons à chaque étape de l’achat." : "We help you find the right place and guide you through every step of the purchase."}</p></div>
          <div><span>02</span><strong>{locale === "fr" ? "Vendre votre bien" : "Sell your property"}</strong><p>{locale === "fr" ? "Nous mettons votre bien en valeur et définissons avec vous une stratégie de commercialisation adaptée." : "We showcase your property and work with you to define the right marketing strategy."}</p></div>
          <div><span>03</span><strong>{locale === "fr" ? "Commercialiser votre projet" : "Market your development"}</strong><p>{locale === "fr" ? "Nous créons les images 3D, les supports et le site web pour mettre en valeur votre projet et accompagner la vente des lots." : "We create CGI, sales materials and a website to showcase your development and support unit sales."}</p></div>
          <div><span>04</span><strong>{locale === "fr" ? "Accompagnement à la vente" : "Sales support"}</strong><p>{locale === "fr" ? "Nous trouvons l’acheteur, organisons les visites et vous accompagnons dans les négociations et les démarches jusqu’à la signature." : "We find a buyer, arrange viewings and guide you through negotiations and the steps leading to signing."}</p></div>
        </div>
      </section>

      <section className="realEstateCommercialCta">
        <div><h2>{locale === "fr" ? "Parlons de votre projet." : "Let’s discuss your project."}</h2></div>
        <a href={CALENDLY_MEETING_URL} target="_blank" rel="noreferrer">{locale === "fr" ? "Planifier un appel vidéo" : "Book a video call"} <span aria-hidden="true">↗</span></a>
      </section>

      <section className="realEstateCommercialListingsTeaser">
        <div><h2 className="realEstateNeonText">{locale === "fr" ? "Nos biens immobiliers." : "Our properties."}</h2></div>
        <Link href={listingsHref}>{locale === "fr" ? "Voir tous les biens" : "View all properties"} <span aria-hidden="true">↗</span></Link>
      </section>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}

