import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { RealEstateFooter } from "@/components/RealEstateFooter";

export function RealEstateCommercialStudio({ locale }: { locale: Locale }) {
  const contactHref = withLocalePath(locale, "/contact");
  return (
    <>
      <RealEstateNavigation locale={locale} active="studio" />
      <main className="siteMain realEstateSitePage realEstateCommercialStudio">
      <section className="realEstateStudioIntro">
        <p className="realEstateCommercialEyebrow">{locale === "fr" ? "Commercialiser mon projet" : "Market my development"}</p>
        <h1>{locale === "fr" ? "Votre projet mérite" : "Your development deserves"}<br />{locale === "fr" ? "une vraie expérience de vente." : "a compelling sales experience."}</h1>
        <p>{locale === "fr" ? "Nous réunissons stratégie, image et outils digitaux pour accompagner la commercialisation de promotions immobilières, de la première idée jusqu’au dernier lot." : "We combine strategy, imagery and digital tools to market property developments, from the first idea to the final unit."}</p>
      </section>
      <section className="realEstateStudioServices">
        <div><span>01</span><h2>{locale === "fr" ? "Positionnement" : "Positioning"}</h2><p>{locale === "fr" ? "Nous clarifions le message, le public cible et la valeur distinctive du projet." : "We clarify the message, target audience and distinctive value of your development."}</p></div>
        <div><span>02</span><h2>{locale === "fr" ? "Images & vidéos" : "Images & videos"}</h2><p>{locale === "fr" ? "Nous créons des rendus 3D, images, plans et contenus qui permettent de se projeter." : "We create CGI, images, plans and content that help buyers picture themselves in the property."}</p></div>
        <div><span>03</span><h2>{locale === "fr" ? "Commercialisation" : "Property marketing"}</h2><p>{locale === "fr" ? "Nous construisons les supports et l’expérience en ligne qui facilitent la prise de décision." : "We build sales materials and an online experience that help buyers make decisions."}</p></div>
      </section>
      <section className="realEstateStudioDeliverables">
        <div><p className="realEstateCommercialEyebrow">{locale === "fr" ? "Ce que nous créons" : "What we create"}</p><h2>{locale === "fr" ? "Tout ce qu’il faut pour présenter, expliquer et vendre." : "Everything you need to present, explain and sell."}</h2></div>
        <ul><li>{locale === "fr" ? "Identité et direction artistique du projet" : "Project identity and art direction"}</li><li>{locale === "fr" ? "Images 3D photoréalistes et vidéos" : "Photorealistic CGI and videos"}</li><li>{locale === "fr" ? "Site web ou page de destination dédiée" : "Dedicated website or landing page"}</li><li>{locale === "fr" ? "Brochure, plans et supports commerciaux" : "Brochure, plans and sales materials"}</li><li>{locale === "fr" ? "Présentation des lots et disponibilités" : "Unit listings and availability"}</li></ul>
      </section>
      <section className="realEstateCommercialCta"><div><p className="realEstateCommercialEyebrow">{locale === "fr" ? "Un projet ?" : "Have a project?"}</p><h2>{locale === "fr" ? "Parlons de votre projet." : "Let’s discuss your project."}</h2></div><Link href={contactHref}>{locale === "fr" ? "Prendre contact" : "Get in touch"} <span aria-hidden="true">↗</span></Link></section>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}

