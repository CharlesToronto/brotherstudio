"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calculator, ChevronLeft, FileText, Map, MapPin, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import type { PublicEstateProperty } from "@/lib/estate";
import { EstateVisitForm } from "@/components/EstateVisitForm";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { realEstateText } from "@/lib/realEstateTranslations";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { RealEstateFooter } from "@/components/RealEstateFooter";

export function RealEstateProjectProfile({ locale, project }: { locale: Locale; project: PublicEstateProperty }) {
  const [activeImage, setActiveImage] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const gallery = project.images?.length ? project.images : [project.image];
  const isFrench = locale === "fr";
  const t = (value: string) => realEstateText(value, locale);
  const priceDigits = project.price.replace(/[^0-9]/g, "");
  const calculatorHref = {
    pathname: withLocalePath(locale, "/immobilier/calculateur-hypothecaire"),
    query: { ...(priceDigits ? { price: priceDigits } : {}), property: t(project.title) },
  };

  return (
    <>
      <RealEstateNavigation locale={locale} active="listings" />
      <main className="siteMain realEstateSitePage realEstateProfilePage">
      <div className="realEstateProfileShell">
        <nav className="realEstateProfileBreadcrumbs" aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}>
          <Link href={withLocalePath(locale, "/immobilier/biens")}><ChevronLeft aria-hidden="true" size={14} /> {isFrench ? "Retour aux biens" : "Back to properties"}</Link>
          <span aria-hidden="true">/</span>
          <span>{t(project.title)}</span>
        </nav>

        <header className="realEstateProfileHeader">
          <div>
            <span className="realEstateProfileBadge"><Sparkles aria-hidden="true" size={12} /> {t(project.status)}</span>
            <h1>{t(project.title)}</h1>
            <p><MapPin aria-hidden="true" size={17} /> {t(project.location)}</p>
          </div>
          <div className="realEstateProfileHeaderAside">
            <p className="realEstateProfilePriceLabel">{isFrench ? "Prix de vente" : "Sale price"}</p>
            <p className="realEstateProfilePrice">{t(project.price)}</p>
          </div>
        </header>

        <section id="gallery" className="realEstateProfileGallery" data-single-image={gallery.length === 1 ? "true" : "false"} aria-label={isFrench ? "Galerie du projet" : "Project gallery"}>
          <div
            className="realEstateProfileHeroImage"
            role="group"
            tabIndex={gallery.length > 1 ? 0 : undefined}
            aria-label={isFrench ? "Photos du bien : balayez ou utilisez les flèches du clavier" : "Property photos: swipe or use the arrow keys"}
            onKeyDown={(event) => {
              if (gallery.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
              event.preventDefault();
              setActiveImage((current) => (current + (event.key === "ArrowRight" ? 1 : -1) + gallery.length) % gallery.length);
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
            }}
            onTouchMove={(event) => {
              if (event.touches.length !== 1) touchStart.current = null;
            }}
            onTouchCancel={() => { touchStart.current = null; }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              const touch = event.changedTouches[0];
              if (!start || !touch || event.touches.length || gallery.length < 2) return;
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;
              if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
              setActiveImage((current) => (current + (dx < 0 ? 1 : -1) + gallery.length) % gallery.length);
            }}
          >
            <Image unoptimized={gallery[activeImage].startsWith("https:")} src={gallery[activeImage]} alt={t(project.title)} fill priority sizes="(max-width: 800px) 100vw, 58vw" draggable={false} />
            {gallery.length > 1 ? <span className="realEstateProfilePhotoCount" aria-live="polite">{activeImage + 1} / {gallery.length}</span> : null}
          </div>
          {gallery.length > 1 ? (
            <div className="realEstateProfileGalleryRail">
              {gallery.map((image, index) => (
                <button className={`realEstateProfileGalleryThumb${activeImage === index ? " is-active" : ""}`} key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`${isFrench ? "Voir la photo" : "View photo"} ${index + 1}`}>
                  <Image unoptimized={image.startsWith("https:")} src={image} alt="" fill sizes="(max-width: 800px) 25vw, 20vw" />
                </button>
              ))}
              <button className="realEstateProfileAllPhotos" type="button" onClick={() => setActiveImage(0)}><span>{gallery.length}</span> {isFrench ? "Toutes les photos" : "All photos"} <ArrowUpRight aria-hidden="true" size={15} /></button>
            </div>
          ) : null}
        </section>

        <div className="realEstateProfileTabs" role="tablist">
          <a className="is-active" href="#property">{isFrench ? "Le bien" : "Property"}</a>
          <a href="#gallery">{isFrench ? "Galerie" : "Gallery"}</a>
          <a href="#parcel">{isFrench ? "Parcelle" : "Parcel"}</a>
          <a href="#documents">{isFrench ? "Documents" : "Documents"}</a>
        </div>

        <div className="realEstateProfileLayout">
          <div className="realEstateProfileContent">
            <section id="property" className="realEstateProfileFacts" aria-label={isFrench ? "Résumé du bien" : "Property summary"}>
              <div><Ruler aria-hidden="true" size={20} /><strong>{t(project.rooms)}</strong><span>{isFrench ? "Configuration" : "Layout"}</span></div>
              <div><Ruler aria-hidden="true" size={20} /><strong>{project.area ? t(project.area) : (isFrench ? "À compléter" : "To be confirmed")}</strong><span>{isFrench ? "Surface habitation" : "Living area"}</span></div>
              <div><Map aria-hidden="true" size={20} /><strong>{project.outdoorArea ? t(project.outdoorArea) : (isFrench ? "À compléter" : "To be confirmed")}</strong><span>{isFrench ? "Surface extérieure" : "Outdoor area"}</span></div>
            </section>

            <section className="realEstateProfileSection">
              <p className="realEstateProfileOverline">{t(project.category)}</p>
              <h2>{isFrench ? "Un projet à découvrir" : "A project to discover"}</h2>
              <p>{t(project.description)}</p>
            </section>

            <section className="realEstateProfileSection realEstateProfileCharacteristics">
              <h2>{isFrench ? "Caractéristiques" : "Features"}</h2>
              <dl>{project.facts.map((fact) => <div key={fact.label}><dt>{t(fact.label)}</dt><dd>{t(fact.value)}</dd></div>)}</dl>
            </section>

            <section id="parcel" className="realEstateProfileSection realEstateProfileParcel">
              <h2>{isFrench ? "Informations de la parcelle" : "Parcel information"}</h2>
              <div className="realEstateProfileParcelCard"><Map aria-hidden="true" size={28} /><span>{isFrench ? "Plan cadastral et données de parcelle à compléter" : "Cadastral plan and parcel details to be added"}</span></div>
            </section>

            <section id="documents" className="realEstateProfileSection realEstateProfileDocuments">
              <h2>{isFrench ? "Documents" : "Documents"}</h2>
              {project.documents.length === 0 ? <p>{isFrench ? "Aucun document listé" : "No documents listed"}</p> : project.documents.map((document) => {
                const content = <><FileText aria-hidden="true" size={21} /><div><strong>{document.title}</strong><span>{document.type} · {document.href ? (isFrench ? "Ouvrir dans le navigateur" : "Open in browser") : (isFrench ? "À venir" : "Coming soon")}</span></div><span>{document.href ? (isFrench ? "Consulter" : "View") : (isFrench ? "À venir" : "Coming soon")} <ArrowUpRight aria-hidden="true" size={15} /></span></>;
                return document.href ? <a className="realEstateProfileDocument" href={document.href} key={document.title} target="_blank" rel="noreferrer">{content}</a> : <div className="realEstateProfileDocument" key={document.title}>{content}</div>;
              })}
            </section>
          </div>

          <aside className="realEstateProfileContact">
            <p className="realEstateProfilePriceLabel">{isFrench ? "Prix de vente" : "Sale price"}</p>
            <strong>{t(project.price)}</strong>
            <Link className="realEstateMortgageCta" href={calculatorHref}>
              <span><Calculator aria-hidden="true" size={17} /><span><small>{isFrench ? "Financement" : "Financing"}</small><strong>{isFrench ? "Calculer mon financement" : "Calculate my financing"}</strong></span></span>
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
            <hr />
            <h2>{isFrench ? "Visiter ce bien" : "Visit this property"}</h2>
            <p>{isFrench ? "Planifiez une visite et découvrez cette propriété." : "Schedule a visit and discover this property."}</p>
            <EstateVisitForm locale={locale} propertyId={project.id} />
            <div className="realEstateProfileTrust"><ShieldCheck aria-hidden="true" size={17} /> {isFrench ? "Réponse personnalisée par Brother Studio" : "Personal reply from Brother Studio"}</div>
          </aside>
        </div>
      </div>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}
