"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MessageCircle,
  Play,
} from "lucide-react";

import { SiteAssistantPanelContent } from "@/components/SiteAssistantPanelContent";
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
  price: string;
};

type LandingPackage = {
  name: string;
  price: string;
  comparePrice?: string;
  details?: string[];
};

type LandingPricingData = {
  imagesTitle: string;
  videosTitle: string;
  walkthroughTitle: string;
  websiteTitle: string;
  packagesTitle: string;
  images: LandingService[];
  videos: LandingService[];
  walkthroughs: LandingService[];
  websites: LandingService[];
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
      heroMetricOne: "Jusqu’à 6K",
      heroMetricOneText: "Images prêtes pour le marketing",
      heroMetricTwo: "3 révisions",
      heroMetricTwoText: "Incluses dans le processus",
      aboutEyebrow: "Qui suis-je",
      aboutTitle: "Une expertise architecturale au service de votre communication.",
      aboutText:
        "Je suis Charles, dessinateur en architecture diplômé en Suisse et fondateur de BrotherStudio. Je combine précision technique, sens de la composition et visual storytelling pour donner à chaque projet une présence claire, crédible et désirable.",
      aboutPointOne: "Formation et expérience en architecture",
      aboutPointTwo: "Approche photoréaliste orientée vente",
      aboutPointThree: "Suivi des révisions avec MyReview",
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
        "Choisissez votre date et votre heure préférées. Vous recevrez une confirmation par email.",
      bookingDate: "Date souhaitée",
      bookingTime: "Heure souhaitée",
      bookingTimezone: "Fuseau horaire",
      bookingNote: "Sujet de l’appel",
      bookingNotePlaceholder: "Quelques mots sur le projet…",
      bookingSubmit: "Demander ce créneau",
      bookingSending: "Réservation…",
      bookingSuccess: "Votre demande de rendez-vous a été envoyée.",
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
    heroMetricOne: "Up to 6K",
    heroMetricOneText: "Marketing-ready imagery",
    heroMetricTwo: "3 revisions",
    heroMetricTwoText: "Included in the process",
    aboutEyebrow: "Who I am",
    aboutTitle: "Architectural expertise serving your communication.",
    aboutText:
      "I am Charles, a Swiss-trained architectural draftsman and the founder of BrotherStudio. I combine technical precision, composition, and visual storytelling to give every project a clear, credible, and desirable presence.",
    aboutPointOne: "Architectural training and experience",
    aboutPointTwo: "Sales-focused photorealistic approach",
    aboutPointThree: "Revision tracking through MyReview",
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
    bookingText: "Choose your preferred date and time. You will receive confirmation by email.",
    bookingDate: "Preferred date",
    bookingTime: "Preferred time",
    bookingTimezone: "Time zone",
    bookingNote: "Call topic",
    bookingNotePlaceholder: "A few words about the project…",
    bookingSubmit: "Request this time",
    bookingSending: "Booking…",
    bookingSuccess: "Your meeting request has been sent.",
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
  const [showPricing, setShowPricing] = useState(false);
  const [contactStatus, setContactStatus] = useState<FormStatus>({
    state: "idle",
    message: "",
  });
  const [bookingStatus, setBookingStatus] = useState<FormStatus>({
    state: "idle",
    message: "",
  });

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

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    const timezone = String(formData.get("timezone") ?? "");
    const note = String(formData.get("note") ?? "");
    const hiddenMessage = form.elements.namedItem("message") as HTMLTextAreaElement | null;

    if (hiddenMessage) {
      hiddenMessage.value = [
        "Discovery call request",
        `Preferred date: ${date}`,
        `Preferred time: ${time}`,
        `Time zone: ${timezone}`,
        `Topic: ${note || "-"}`,
      ].join("\n");
    }

    setBookingStatus({ state: "sending", message: "" });

    try {
      await submitLandingForm(form, "campaign-landing-booking", copy.formError);
      form.reset();
      setBookingStatus({ state: "success", message: copy.bookingSuccess });
    } catch (error) {
      setBookingStatus({
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
          <div>
            <strong>{copy.heroMetricTwo}</strong>
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
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 760px) 82vw, 52vw"
                />
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
            <video
              src="/myexperience-hero/mesange-hero-loop.mp4"
              muted
              loop
              playsInline
              controls
              poster="/myexperience-hero-night.webp"
            />
            <div className="campaignLandingVideoLabel">
              <Play size={15} fill="currentColor" />
              <span>{copy.videoOne}</span>
            </div>
          </article>
          <article className="campaignLandingVideoPlaceholder">
            <span className="campaignLandingPlayMark">
              <Play size={21} fill="currentColor" />
            </span>
            <strong>{copy.videoTwo}</strong>
            <small>{copy.videoPlaceholder}</small>
          </article>
        </div>
      </section>

      <section id="services" className="campaignLandingServices">
        <div className="campaignLandingServicesIntro">
          <p className="campaignLandingEyebrow">{copy.servicesEyebrow}</p>
          <h2>{copy.servicesTitle}</h2>
          <p>{copy.servicesText}</p>
          <button
            type="button"
            className="campaignLandingButton campaignLandingButtonGhost"
            onClick={() => setShowPricing((current) => !current)}
            aria-expanded={showPricing}
            aria-controls="campaignLandingPricingPanel"
          >
            {showPricing ? copy.servicesToggleOpen : copy.servicesToggleClosed}
            <ChevronDown
              size={17}
              className={showPricing ? "campaignLandingChevronOpen" : undefined}
            />
          </button>
          <a className="campaignLandingButton campaignLandingButtonLight" href="#contact">
            {copy.servicesCta}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div
          id="campaignLandingPricingPanel"
          className="campaignLandingPricingPanel"
          data-open={showPricing ? "true" : "false"}
        >
          {showPricing ? (
            <div className="campaignLandingPricingGroups">
              {[
                { title: pricing.imagesTitle, items: pricing.images },
                { title: pricing.videosTitle, items: pricing.videos },
                { title: pricing.walkthroughTitle, items: pricing.walkthroughs },
                { title: pricing.websiteTitle, items: pricing.websites },
              ].map((group) => (
                <section key={group.title} className="campaignLandingPricingGroup">
                  <header className="campaignLandingPricingGroupHeader">
                    <p>{group.title}</p>
                  </header>
                  <ol className="campaignLandingServiceList">
                    {group.items.map((service, index) => (
                      <li key={`${group.title}-${service.name}-${service.price}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{service.name}</strong>
                        <em>{service.price}</em>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}

              <section className="campaignLandingPricingGroup campaignLandingPricingGroup--packages">
                <header className="campaignLandingPricingGroupHeader">
                  <p>{pricing.packagesTitle}</p>
                </header>
                <div className="campaignLandingPackageGrid">
                  {pricing.packages.map((item) => (
                    <article
                      key={`${item.name}-${item.price}`}
                      className="campaignLandingPackageCard"
                    >
                      <div className="campaignLandingPackageTop">
                        <strong>{item.name}</strong>
                        <span>{item.price}</span>
                      </div>
                      {item.comparePrice ? (
                        <p className="campaignLandingPackageCompare">{item.comparePrice}</p>
                      ) : null}
                      {item.details?.length ? (
                        <ul className="campaignLandingPackageDetails">
                          {item.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
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
          <div className="campaignLandingBookingMeta">
            <span>
              <Clock3 size={16} />
              30 min
            </span>
            <span>
              <CalendarDays size={16} />
              Google Meet / Phone
            </span>
          </div>
        </div>
        <form className="campaignLandingBookingForm" onSubmit={handleBookingSubmit}>
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
          <label>
            <span>{copy.bookingDate}</span>
            <input name="date" type="date" required />
          </label>
          <label>
            <span>{copy.bookingTime}</span>
            <input name="time" type="time" required />
          </label>
          <label>
            <span>{copy.bookingTimezone}</span>
            <select name="timezone" defaultValue="America/Toronto">
              <option value="America/Toronto">Toronto · EST/EDT</option>
              <option value="Europe/Zurich">Suisse · CET/CEST</option>
              <option value="America/Vancouver">Vancouver · PST/PDT</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="campaignLandingFormWide">
            <span>{copy.bookingNote}</span>
            <textarea name="note" rows={3} placeholder={copy.bookingNotePlaceholder} />
          </label>
          <textarea className="campaignLandingHoneypot" name="message" readOnly aria-hidden />
          <input className="campaignLandingHoneypot" name="website" tabIndex={-1} aria-hidden />
          <button
            className="campaignLandingButton campaignLandingButtonBlue campaignLandingFormWide"
            type="submit"
            disabled={bookingStatus.state === "sending"}
          >
            {bookingStatus.state === "sending" ? copy.bookingSending : copy.bookingSubmit}
            <ArrowUpRight size={17} />
          </button>
          {bookingStatus.message ? (
            <p
              className="campaignLandingFormWide campaignLandingFormStatus"
              data-state={bookingStatus.state}
            >
              {bookingStatus.message}
            </p>
          ) : null}
        </form>
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

      <footer className="campaignLandingFooter">
        <Image
          src="/bs-logo-menu-cropped.png"
          alt="BrotherStudio"
          width={2565}
          height={570}
        />
        <p>{copy.footer}</p>
        <span>© {new Date().getFullYear()} BrotherStudio</span>
      </footer>
    </main>
  );
}
