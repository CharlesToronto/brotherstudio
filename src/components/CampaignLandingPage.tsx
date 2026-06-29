"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  MessageCircle,
  Play,
} from "lucide-react";

import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { PriceOfferTabs } from "@/components/PriceOfferTabs";
import { SiteAssistantPanelContent } from "@/components/SiteAssistantPanelContent";
import { SiteFooter } from "@/components/SiteFooter";
import { CALENDLY_MEETING_URL } from "@/lib/calendly";
import type { AssistantLocale } from "@/lib/siteAssistantKnowledge";
import type { Locale } from "@/lib/i18n";

type LandingImage = {
  id: string;
  src: string;
  alt: string;
  project: string;
};

type LandingService = {
  name: string;
  price?: string;
  options?: Array<{
    name: string;
    price?: string;
  }>;
};

type LandingPackage = {
  name: string;
  price: string;
  comparePrice?: string;
  period?: string;
  badge?: string;
  summary?: string;
  featured?: boolean;
  sections?: Array<{
    title: string;
    items: string[];
  }>;
  included?: string[];
  delivery?: string[];
  note?: string;
};

type LandingPricingData = {
  imagesTitle: string;
  videosTitle: string;
  walkthroughTitle: string;
  websiteTitle: string;
  adsTitle: string;
  packagesTitle: string;
  includedLabel: string;
  deliveryLabel: string;
  imageNote: string;
  images: LandingService[];
  videos: LandingService[];
  walkthroughs: LandingService[];
  websites: LandingService[];
  ads: LandingService[];
  packages: LandingPackage[];
};

type CampaignLandingPageProps = {
  locale: Locale;
  images: LandingImage[];
  pricing: LandingPricingData;
};

type FormStatus = {
  state: "idle" | "sending" | "success" | "error";
  message: string;
};

function getCopy(locale: Locale) {
  if (locale === "fr") {
    return {
      nav: {
        work: "Travail",
        services: "Services & prix",
        testimonials: "Témoignages",
        contact: "Contact",
        viewSite: "Voir mon site",
      },
      heroEyebrow: "Visualisation architecturale · Suisse / Canada",
      heroTitle: "Des images qui font ressentir le projet avant sa construction.",
      heroText:
        "BrotherStudio transforme vos plans en images, vidéos et expériences digitales conçues pour présenter, convaincre et vendre.",
      heroPrimary: "Booker un appel",
      heroSecondary: "Voir mon travail",
      heroMetricOne: "300+",
      heroMetricOneText: "images realisees pour des clients",
      heroMetricTwoText: "personnes visitent le site en ce moment",
      aboutEyebrow: "Qui suis-je",
      aboutTitle: "Une expertise architecturale au service de votre communication.",
      aboutText:
        "Je suis Charles, dessinateur en architecture diplômé en Suisse et fondateur de BrotherStudio. Je combine précision technique, sens de la composition et visual storytelling pour donner à chaque projet une présence claire, crédible et désirable.",
      aboutPointOne: "Formation et expérience en architecture",
      aboutPointTwo: "Approche photoréaliste orientée vente",
      aboutPointThree: "Suivi des révisions avec MyReview™",
      workEyebrow: "Mon travail",
      workTitle: "Des univers visuels construits autour de votre projet.",
      workText:
        "Faites défiler une sélection récente. Chaque image conserve son format original.",
      videoTitle: "Le projet en mouvement",
      videoText:
        "Deux espaces dédiés aux walkthroughs, vidéos marketing et présentations cinématiques.",
      videoOne: "Walkthrough · Mésange",
      videoTwo: "Vidéo projet 02",
      videoPlaceholder: "Espace vidéo à compléter",
      servicesEyebrow: "Services & prix",
      servicesTitle: "Une offre lisible, adaptée à chaque étape de vente.",
      servicesText:
        "Prix indicatifs en CHF. Un devis précis est préparé selon les plans, le volume et le délai.",
      servicesCta: "Demander un devis",
      servicesToggleClosed: "Voir les prix",
      servicesToggleOpen: "Masquer les prix",
      testimonialsEyebrow: "Témoignages clients",
      testimonialsTitle: "La parole aux personnes qui travaillent avec nous.",
      testimonialPlaceholder: "Témoignage vidéo",
      contactEyebrow: "Contact",
      contactTitle: "Parlons de votre prochain projet.",
      contactText:
        "Envoyez vos plans, votre délai et le type de visuel recherché. Je vous répondrai avec une recommandation claire.",
      formName: "Nom",
      formEmail: "Email",
      formPhone: "Téléphone",
      formProject: "Votre projet",
      formProjectPlaceholder: "Type de projet, nombre d’images, échéance…",
      formSend: "Envoyer ma demande",
      formSending: "Envoi…",
      formSuccess: "Votre demande a bien été envoyée.",
      formError: "La demande n’a pas pu être envoyée.",
      bookingEyebrow: "Agenda",
      bookingTitle: "Réserver un appel découverte.",
      bookingText:
        "Bloque un creneau en ligne et recois automatiquement le lien Google Meet pour discuter de ton projet.",
      bookingFrameTitle: "Reservation Calendly BrotherStudio",
      chatTitle: "Une question avant l’appel ?",
      chatText:
        "MyAssistant répond aux questions courantes sur les délais, les prix et les livrables.",
      footer: "Visualisation architecturale pour présenter et vendre.",
    };
  }

  return {
    nav: {
      work: "Work",
      services: "Services & pricing",
      testimonials: "Testimonials",
      contact: "Contact",
      viewSite: "View my site",
    },
    heroEyebrow: "Architectural visualization · Switzerland / Canada",
    heroTitle: "Images that make people feel the project before it is built.",
    heroText:
      "BrotherStudio transforms plans into images, videos, and digital experiences designed to present, convince, and sell.",
    heroPrimary: "Book a call",
    heroSecondary: "View my work",
    heroMetricOne: "300+",
    heroMetricOneText: "images delivered for clients",
    heroMetricTwoText: "people visiting the site right now",
    aboutEyebrow: "Who I am",
    aboutTitle: "Architectural expertise serving your communication.",
    aboutText:
      "I am Charles, a Swiss-trained architectural draftsman and the founder of BrotherStudio. I combine technical precision, composition, and visual storytelling to give every project a clear, credible, and desirable presence.",
    aboutPointOne: "Architectural training and experience",
    aboutPointTwo: "Sales-focused photorealistic approach",
    aboutPointThree: "Revision tracking through MyReview™",
    workEyebrow: "My work",
    workTitle: "Visual worlds built around your project.",
    workText: "Browse a recent selection. Every image preserves its original format.",
    videoTitle: "Projects in motion",
    videoText: "Two dedicated spaces for walkthroughs, marketing films, and cinematic presentations.",
    videoOne: "Walkthrough · Mésange",
    videoTwo: "Project video 02",
    videoPlaceholder: "Video space to complete",
    servicesEyebrow: "Services & pricing",
    servicesTitle: "A clear offer for every stage of the sales process.",
    servicesText:
      "Indicative prices in CHF. A precise quote is prepared according to plans, volume, and timeline.",
    servicesCta: "Request a quote",
    servicesToggleClosed: "View pricing",
    servicesToggleOpen: "Hide pricing",
    testimonialsEyebrow: "Client testimonials",
    testimonialsTitle: "Hear from the people who work with us.",
    testimonialPlaceholder: "Video testimonial",
    contactEyebrow: "Contact",
    contactTitle: "Let’s discuss your next project.",
    contactText:
      "Send your plans, timeline, and desired deliverables. I will reply with a clear recommendation.",
    formName: "Name",
    formEmail: "Email",
    formPhone: "Phone",
    formProject: "Your project",
    formProjectPlaceholder: "Project type, number of images, deadline…",
    formSend: "Send my request",
    formSending: "Sending…",
    formSuccess: "Your request has been sent.",
    formError: "The request could not be sent.",
    bookingEyebrow: "Calendar",
    bookingTitle: "Book a discovery call.",
    bookingText:
      "Pick a time online and automatically receive a Google Meet link to discuss your project.",
    bookingFrameTitle: "BrotherStudio Calendly booking",
    chatTitle: "A question before the call?",
    chatText: "MyAssistant answers common questions about timelines, pricing, and deliverables.",
    footer: "Architectural visualization designed to present and sell.",
  };
}

async function submitLandingForm(
  form: HTMLFormElement,
  source: string,
  fallbackError: string,
) {
  const formData = new FormData(form);
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
      source,
      project: "Campaign landing page",
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? fallbackError);
  }
}

export function CampaignLandingPage({
  locale,
  images,
  pricing,
}: CampaignLandingPageProps) {
  const copy = getCopy(locale);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [liveVisitors, setLiveVisitors] = useState(3);
  const [contactStatus, setContactStatus] = useState<FormStatus>({
    state: "idle",
    message: "",
  });

  useEffect(() => {
    const intervals = [3000, 8000, 20000];
    let timeoutId: number | null = null;

    const scheduleNextTick = () => {
      const nextDelay = intervals[Math.floor(Math.random() * intervals.length)];
      timeoutId = window.setTimeout(() => {
        setLiveVisitors((current) => {
          let nextValue = current;
          while (nextValue === current) {
            nextValue = Math.floor(Math.random() * 5) + 1;
          }
          return nextValue;
        });
        scheduleNextTick();
      }, nextDelay);
    };

    scheduleNextTick();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.72,
      behavior: "smooth",
    });
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setContactStatus({ state: "sending", message: "" });

    try {
      await submitLandingForm(form, "campaign-landing-contact", copy.formError);
      form.reset();
      setContactStatus({ state: "success", message: copy.formSuccess });
    } catch (error) {
      setContactStatus({
        state: "error",
        message: error instanceof Error ? error.message : copy.formError,
      });
    }
  };

  return (
    <main className="campaignLanding">
      <header className="campaignLandingNav">
        <Link className="campaignLandingLogo" href={`/${locale}`}>
          <Image
            src="/bs-logo-menu-cropped.png"
            alt="BrotherStudio"
            width={2565}
            height={570}
            priority
          />
        </Link>
        <nav aria-label="Landing page">
          <a href="#work">{copy.nav.work}</a>
          <a href="#services">{copy.nav.services}</a>
          <a href="#testimonials">{copy.nav.testimonials}</a>
          <a href="#contact">{copy.nav.contact}</a>
        </nav>
        <div className="campaignLandingNavActions">
          <Link className="campaignLandingNavSecondary" href={`/${locale}`}>
            {copy.nav.viewSite}
          </Link>
          <a className="campaignLandingNavCta" href="#booking">
            {copy.heroPrimary}
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <section className="campaignLandingHero">
        <div className="campaignLandingHeroImage">
          <Image
            src={images[0]?.src ?? "/myexperience-hero-night.webp"}
            alt={images[0]?.alt ?? "BrotherStudio architectural visualization"}
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="campaignLandingHeroShade" />
        <div className="campaignLandingHeroContent">
          <p className="campaignLandingEyebrow">{copy.heroEyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="campaignLandingHeroText">{copy.heroText}</p>
          <div className="campaignLandingHeroActions">
            <a className="campaignLandingButton campaignLandingButtonLight" href="#booking">
              {copy.heroPrimary}
              <ArrowUpRight size={17} />
            </a>
            <a className="campaignLandingTextLink" href="#work">
              {copy.heroSecondary}
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
        <div className="campaignLandingMetrics">
          <div>
            <strong>{copy.heroMetricOne}</strong>
            <span>{copy.heroMetricOneText}</span>
          </div>
          <div data-live="true">
            <strong>{liveVisitors}</strong>
            <span>{copy.heroMetricTwoText}</span>
          </div>
        </div>
      </section>

      <section className="campaignLandingAbout">
        <div className="campaignLandingAboutPortrait">
          <Image
            src="/about-portrait-charles-2026.webp"
            alt="Charles, founder of BrotherStudio"
            fill
            sizes="(max-width: 760px) 100vw, 42vw"
          />
        </div>
        <div className="campaignLandingSectionCopy">
          <p className="campaignLandingEyebrow campaignLandingEyebrowDark">
            {copy.aboutEyebrow}
          </p>
          <h2>{copy.aboutTitle}</h2>
          <p>{copy.aboutText}</p>
          <ul className="campaignLandingCheckList">
            {[copy.aboutPointOne, copy.aboutPointTwo, copy.aboutPointThree].map((item) => (
              <li key={item}>
                <Check size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="work" className="campaignLandingWork">
        <div className="campaignLandingSectionHeading">
          <div>
            <p className="campaignLandingEyebrow campaignLandingEyebrowDark">
              {copy.workEyebrow}
            </p>
            <h2>{copy.workTitle}</h2>
          </div>
          <div className="campaignLandingHeadingSide">
            <p>{copy.workText}</p>
            <div className="campaignLandingCarouselControls">
              <button type="button" onClick={() => scrollCarousel(-1)} aria-label="Previous images">
                <ArrowLeft size={18} />
              </button>
              <button type="button" onClick={() => scrollCarousel(1)} aria-label="Next images">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div ref={carouselRef} className="campaignLandingCarousel">
          {images.map((image, index) => (
            <figure key={image.id} className="campaignLandingWorkCard">
              <div className="campaignLandingWorkImage">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </div>
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{image.project}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="campaignLandingVideoHeading">
          <h3>{copy.videoTitle}</h3>
          <p>{copy.videoText}</p>
        </div>
        <div className="campaignLandingVideoGrid">
          <article className="campaignLandingVideoCard">
            <video src="/videos/bs-maretset-2.mp4" muted loop playsInline controls />
          </article>
        </div>
      </section>

      <section id="services" className="campaignLandingServices">
        <div className="campaignLandingServicesIntro">
          <p className="campaignLandingEyebrow">{copy.servicesEyebrow}</p>
          <h2>{copy.servicesTitle}</h2>
          <p>{copy.servicesText}</p>
          <a className="campaignLandingButton campaignLandingButtonLight" href="#contact">
            {copy.servicesCta}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div id="campaignLandingPricingPanel" className="campaignLandingPricingPanel">
          <PriceOfferTabs
            packagesTitle={pricing.packagesTitle}
            packagesTitleId="campaignLandingPackagesTitle"
            packages={pricing.packages}
            includedLabel={pricing.includedLabel}
            deliveryLabel={pricing.deliveryLabel}
            classicLabel="Prix classique"
            classicTitleId="campaignLandingClassicTitle"
            imageTitle={pricing.imagesTitle}
            imageNote={pricing.imageNote}
            images={pricing.images}
            videoTitle={pricing.videosTitle}
            videos={pricing.videos}
            walkthroughTitle={pricing.walkthroughTitle}
            walkthroughs={pricing.walkthroughs}
            websiteTitle={pricing.websiteTitle}
            websites={pricing.websites}
            adsTitle={pricing.adsTitle}
            ads={pricing.ads}
          />
        </div>
      </section>

      <section id="testimonials" className="campaignLandingTestimonials">
        <div className="campaignLandingSectionHeading">
          <div>
            <p className="campaignLandingEyebrow campaignLandingEyebrowDark">
              {copy.testimonialsEyebrow}
            </p>
            <h2>{copy.testimonialsTitle}</h2>
          </div>
        </div>
        <div className="campaignLandingTestimonialGrid">
          {[1, 2, 3].map((item) => (
            <article key={item} className="campaignLandingTestimonialCard">
              <span className="campaignLandingTestimonialNumber">0{item}</span>
              <span className="campaignLandingPlayMark campaignLandingPlayMarkLight">
                <Play size={20} fill="currentColor" />
              </span>
              <strong>{copy.testimonialPlaceholder}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="campaignLandingContact">
        <div className="campaignLandingContactIntro">
          <p className="campaignLandingEyebrow campaignLandingEyebrowDark">
            {copy.contactEyebrow}
          </p>
          <h2>{copy.contactTitle}</h2>
          <p>{copy.contactText}</p>
          <div className="campaignLandingContactLinks">
            <a href="mailto:info@brotherstudio.ca">
              <Mail size={16} />
              info@brotherstudio.ca
            </a>
            <a href="#landing-assistant">
              <MessageCircle size={16} />
              MyAssistant
            </a>
          </div>
        </div>
        <form className="campaignLandingForm" onSubmit={handleContactSubmit}>
          <label>
            <span>{copy.formName}</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            <span>{copy.formEmail}</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>{copy.formPhone}</span>
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="campaignLandingFormWide">
            <span>{copy.formProject}</span>
            <textarea
              name="message"
              rows={5}
              required
              placeholder={copy.formProjectPlaceholder}
            />
          </label>
          <input className="campaignLandingHoneypot" name="website" tabIndex={-1} aria-hidden />
          <button
            className="campaignLandingButton campaignLandingButtonDark campaignLandingFormWide"
            type="submit"
            disabled={contactStatus.state === "sending"}
          >
            {contactStatus.state === "sending" ? copy.formSending : copy.formSend}
            <ArrowUpRight size={17} />
          </button>
          {contactStatus.message ? (
            <p
              className="campaignLandingFormWide campaignLandingFormStatus"
              data-state={contactStatus.state}
            >
              {contactStatus.message}
            </p>
          ) : null}
        </form>
      </section>

      <section id="booking" className="campaignLandingBooking">
        <div className="campaignLandingBookingIntro">
          <p className="campaignLandingEyebrow">{copy.bookingEyebrow}</p>
          <h2>{copy.bookingTitle}</h2>
          <p>{copy.bookingText}</p>
        </div>
        <CalendlyEmbed title={copy.bookingFrameTitle} url={CALENDLY_MEETING_URL} />
      </section>

      <section id="landing-assistant" className="campaignLandingChatCta">
        <div className="campaignLandingChatIntro">
          <p className="campaignLandingEyebrow">{copy.chatTitle}</p>
          <h2>{copy.chatText}</h2>
          <p className="campaignLandingChatIntroText">
            {locale === "fr"
              ? "Posez directement votre question, ou utilisez l'onglet Questions pour parcourir les categories les plus utiles."
              : "Ask your question directly, or use the Questions tab to browse the most useful categories."}
          </p>
        </div>
        <div className="campaignLandingChatPanel">
          <SiteAssistantPanelContent
            locale={locale as AssistantLocale}
            embedded
            showContactPageLink={false}
          />
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
