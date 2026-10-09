import { ArrowUpRight, Play } from "lucide-react";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { LandingBackgroundTransition } from "@/components/LandingBackgroundTransition";
import { LandingContactForm } from "@/components/LandingContactForm";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { LandingFaq } from "@/components/LandingFaq";
import { RealEstateFooter } from "@/components/RealEstateFooter";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";

import type { Locale } from "@/lib/i18n";

type CampaignLandingPageProps = {
  locale: Locale;
  heroVideoSrc?: string;
  analyticsEnabled?: boolean;
};

export function CampaignLandingPage({ locale, heroVideoSrc, analyticsEnabled = false }: CampaignLandingPageProps) {
  const isFrench = locale === "fr";
  const steps = isFrench
    ? [
        { title: "Estimation gratuite", description: "Évaluer votre bien et comprendre son potentiel sur le marché." },
        { title: "Stratégie de vente", description: "Définir le positionnement et la manière de présenter votre bien." },
        { title: "Mise en valeur", description: "Créer les images et les supports qui révèlent ses atouts." },
        { title: "Diffusion ciblée", description: "Présenter votre bien aux acheteurs qui recherchent ce type de propriété." },
        { title: "Visites & échanges", description: "Accompagner les visites et répondre aux questions des acheteurs." },
        { title: "Suivi jusqu’à la vente", description: "Vous accompagner dans les échanges et les étapes de la vente." },
      ]
    : [
        { title: "Free valuation", description: "Assess your property and understand its potential on the market." },
        { title: "Sales strategy", description: "Define its positioning and the best way to present your property." },
        { title: "Property presentation", description: "Create imagery and materials that highlight its strengths." },
        { title: "Targeted promotion", description: "Present your property to buyers looking for this type of home." },
        { title: "Viewings & enquiries", description: "Support viewings and answer prospective buyers’ questions." },
        { title: "Support through the sale", description: "Guide you through discussions and each stage of the sale." },
      ];

  return (
    <>
      <RealEstateNavigation locale={locale} active="sell" />
    <main id="valuation-funnel" className="campaignLanding campaignLandingValuation">
      <LandingBackgroundTransition />

      <section className="campaignLandingValuationHero" aria-labelledby="landing-hero-title">
        <div className="campaignLandingValuationCopy">
          <p className="campaignLandingEyebrow campaignLandingEyebrowDark">{isFrench ? "BrotherStudio · Immobilier" : "BrotherStudio · Real Estate"}</p>
          <h1 id="landing-hero-title" className={isFrench ? "campaignLandingHeroTitleTwoLines" : undefined}>
            {isFrench ? <><span>Estimation gratuite</span>{" "}<span>en Suisse romande</span></> : "Free valuation in French-speaking Switzerland"}
          </h1>
          <p className="campaignLandingHeroSubtitle">{isFrench ? "Obtenez une pré-estimation gratuite de votre bien avant la visite. Présentez-nous votre projet en deux étapes simples." : "Get a free preliminary valuation before the visit. Tell us about your property in two simple steps."}</p>
          <div className="campaignLandingHeroActions">
            <a className="campaignLandingButton campaignLandingButtonDark" href="#contact">
              {isFrench ? "Estimer mon bien gratuitement" : "Request my valuation"}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="campaignLandingSquareVideo">
          {heroVideoSrc ? (
            <video poster="/videos/landing-estimation-poster.webp" width={1080} height={1080} controls playsInline preload="metadata" aria-label={isFrench ? "Présentation de notre accompagnement immobilier" : "Our property services"}>
              <source src={heroVideoSrc} type="video/mp4" />
            </video>
          ) : (
            <div className="campaignLandingVideoPending" role="img" aria-label={isFrench ? "Emplacement de la vidéo de présentation" : "Presentation video placeholder"}>
              <Play size={36} strokeWidth={1.25} aria-hidden="true" />
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="campaignLandingContact" aria-labelledby="landing-contact-title">
        <LandingContactForm locale={locale} analyticsEnabled={analyticsEnabled} />
        <div className="campaignLandingContactIntro">
          <p className="campaignLandingEyebrow campaignLandingEyebrowDark">Contact</p>
          <h2 id="landing-contact-title">{isFrench ? "Parlons de votre bien." : "Let’s discuss your property."}</h2>
          <p>{isFrench ? "Décrivez-nous votre bien et votre projet. Nous vous recontacterons pour préparer votre estimation gratuite." : "Tell us about your property and your plans. We will contact you to prepare your free valuation."}</p>
        </div>
      </section>

      <section id="services" className="homeProcessSection campaignLandingProcess" aria-labelledby="landing-process-title">
        <div className="homeProcessHeader">
          <h2 id="landing-process-title" className="homeProcessTitle">
            {isFrench ? "Ce que nous faisons pour vous" : "What we do for you"}
          </h2>
        </div>
        <div className="homeProcessList" role="list">
          {steps.map((step, index) => (
            <div key={step.title} className="homeProcessStepGroup" role="listitem">
              <div className="homeProcessStep">
                <span className="homeProcessNumber">{String(index + 1).padStart(2, "0")}</span>
                <div className="homeProcessStepCopy">
                  <h3 className="homeProcessStepTitle">{step.title}</h3>
                  <p className="homeProcessStepDescription">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 ? <span className="homeProcessArrow" aria-hidden="true">→</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section id="booking" className="campaignLandingBooking" aria-labelledby="landing-booking-title">
        <div className="campaignLandingBookingIntro">
          <p className="campaignLandingEyebrow">{isFrench ? "Prise de rendez-vous" : "Book a meeting"}</p>
          <h2 id="landing-booking-title">{isFrench ? "Réservez votre rendez-vous." : "Book your appointment."}</h2>
          <p>{isFrench ? "Choisissez directement un créneau pour discuter de votre bien et de son estimation. Vous recevrez la confirmation et le lien de l’appel vidéo." : "Choose a time to discuss your property and its valuation. You will receive a confirmation and a video call link."}</p>
          <a className="campaignLandingButton campaignLandingButtonLight" href={CALENDLY_MEETING_URL} target="_blank" rel="noopener noreferrer">{isFrench ? "Ouvrir l’agenda" : "Open the calendar"}<ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
        <CalendlyEmbed title={isFrench ? "Rendez-vous BrotherStudio" : "BrotherStudio appointment"} url={CALENDLY_MEETING_URL} />
      </section>
      <LandingFaq locale={locale} />
    </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}

