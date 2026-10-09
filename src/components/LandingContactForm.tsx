"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { track } from "@vercel/analytics";
import styles from "./LandingContactForm.module.css";

type FormStatus = { state: "idle" | "sending" | "success" | "error"; message: string };

export function LandingContactForm({ locale, analyticsEnabled = false }: { locale: Locale; analyticsEnabled?: boolean }) {
  const isFrench = locale === "fr";
  const [status, setStatus] = useState<FormStatus>({ state: "idle", message: "" });

  const [step, setStep] = useState<1 | 2>(1);
  const [propertyType, setPropertyType] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [approximateArea, setApproximateArea] = useState("");
  const skipsRoomCount = ["Terrain", "Immeuble", "Grange"].includes(propertyType);
  const skipsRoomAndArea = propertyType === "Terrain" || propertyType === "Immeuble";
  const started = useRef(false);
  const completedProperty = useRef(false);
  const submissionId = useRef<string | null>(null);
  function record(name: string) {
    if (analyticsEnabled) {
      try { track(name, { locale }); } catch { /* Analytics must never block a request. */ }
    }
  }
  function changeStep(form: HTMLFormElement, next: 1 | 2) {
    setStep(next);
    requestAnimationFrame(() => form.querySelector<HTMLInputElement | HTMLSelectElement>(`fieldset[data-step="${next}"] input, fieldset[data-step="${next}"] select`)?.focus({ preventScroll: true }));
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "sending") return;
    const form = event.currentTarget;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`fieldset[data-step="${step}"] input, fieldset[data-step="${step}"] select`));
    const invalid = fields.find(field => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    if (step === 1) {
      if (!completedProperty.current) { record("landing_property_completed"); completedProperty.current = true; }
      changeStep(form, 2);
      return;
    }
    const data = new FormData(form);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const submittedRoomCount = skipsRoomCount ? "0" : String(data.get("roomCount") ?? "").trim();
    const desiredPrice = String(data.get("desiredPrice") ?? "").trim();
    const submittedArea = skipsRoomAndArea ? "0" : String(data.get("approximateArea") ?? "").trim();
    const message = [
      `Nom : ${lastName}`,
      `Prénom : ${firstName}`,
      `Type de bien : ${String(data.get("propertyType") ?? "")}`,
      `Adresse du bien : ${String(data.get("propertyAddress") ?? "").trim()}`,
      `Nombre de pièces : ${submittedRoomCount}`,
      `Surface approximative : ${skipsRoomAndArea ? "0 m²" : submittedArea ? `${submittedArea} m²` : "Non renseignée"}`,
      `Créneau de contact préféré : ${String(data.get("contactTime") ?? "Sans préférence")}`,
      `Délai de vente souhaité : ${String(data.get("saleMonths") ?? "")}`,
      `Prix souhaité : ${desiredPrice ? `${desiredPrice} CHF` : "Non renseigné"}`,
    ].join("\n");
    setStatus({ state: "sending", message: "" });
    try {
      submissionId.current ??= crypto.randomUUID();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          message,
          website: String(data.get("website") ?? ""),
          interest: "Estimation immobilière gratuite",
          source: "campaign-landing-valuation",
          project: "Estimation immobilière",
          submissionId: submissionId.current,
          valuation: {
            firstName,
            lastName,
            propertyType: String(data.get("propertyType") ?? ""),
            propertyAddress: String(data.get("propertyAddress") ?? "").trim(),
            roomCount: submittedRoomCount,
            approximateArea: submittedArea,
            contactTime: String(data.get("contactTime") ?? "Sans préférence"),
            saleTimeline: String(data.get("saleMonths") ?? ""),
            desiredPriceChf: desiredPrice,
          },
        }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
      if (!response.ok || !payload?.ok) throw new Error("Contact request failed");
      record("landing_form_submitted");
      form.reset();
      setPropertyType("");
      setRoomCount("");
      setApproximateArea("");
      submissionId.current = null;
      setStatus({ state: "success", message: isFrench ? "Votre demande a bien été envoyée. Nous vous recontacterons pour votre estimation." : "Your request has been sent. We will contact you about your valuation." });
    } catch {
      record("landing_form_error");
      setStatus({ state: "error", message: isFrench ? "Votre demande n’a pas pu être envoyée. Réessayez ou réservez un rendez-vous ci-dessous." : "Your request could not be sent. Please try again or book a meeting below." });
    }
  }

  if (status.state === "success") return (
    <div className={styles.form} role="status" aria-live="polite">
      <div className={styles.header}>
        <h3>{isFrench ? "Merci pour votre demande !" : "Thank you for your request!"}</h3>
        <p>{isFrench
          ? "Votre demande a bien été envoyée. Nous vous recontacterons rapidement pour votre estimation. Vous pouvez aussi réserver directement un appel vidéo via notre agenda en ligne."
          : "Your request has been sent. We’ll get back to you shortly about your valuation. You can also book a video call directly through our online calendar."}</p>
        <p className={styles.contactHighlight}>{isFrench
          ? "Votre personne de contact sera Charles de Guigne, qui vous contactera au +14376773212."
          : "Your contact person will be Charles de Guigne, who will reach you at +14376773212."}</p>
      </div>
      <a className="campaignLandingButton campaignLandingButtonDark" href="#booking">{isFrench ? "Réserver un appel vidéo" : "Book a video call"}<ArrowUpRight size={17} aria-hidden="true" /></a>
    </div>
  );

  return (
    <form className={`campaignLandingForm ${styles.form}`} noValidate onSubmit={handleSubmit} onChange={() => { if (!started.current) { started.current = true; record("landing_form_started"); } }} aria-busy={status.state === "sending"} aria-labelledby="landing-form-title">
      <div className={styles.header}>
        <h3 id="landing-form-title">{isFrench ? "Votre estimation gratuite" : "Your free valuation"}</h3>
        <p>{isFrench ? "Ces informations nous permettent de vous donner une pré-estimation de votre bien avant la visite." : "This information allows us to provide a preliminary valuation of your property before the visit."}</p>
      </div>

      <div className={styles.progress} aria-live="polite"><span>{isFrench ? `Étape ${step} sur 2 · ${step === 1 ? "Votre bien" : "Vos coordonnées"}` : `Step ${step} of 2 · ${step === 1 ? "Your property" : "Your contact details"}`}</span><div aria-hidden="true"><i style={{ width: `${step * 50}%` }} /></div></div>
      <fieldset className={styles.group} data-step="2" hidden={step !== 2}>
        <legend><span aria-hidden="true">02</span>{isFrench ? "Vos coordonnées" : "Your contact details"}</legend>
        <div className={styles.fields}>
          <label><span>{isFrench ? "Nom" : "Last name"}</span><input name="lastName" autoComplete="family-name" required maxLength={60} placeholder={isFrench ? "Votre nom" : "Your last name"} /></label>
          <label><span>{isFrench ? "Prénom" : "First name"}</span><input name="firstName" autoComplete="given-name" required maxLength={60} placeholder={isFrench ? "Votre prénom" : "Your first name"} /></label>
          <label><span>{isFrench ? "E-mail" : "Email"}</span><input name="email" type="email" autoComplete="email" required maxLength={200} placeholder={isFrench ? "vous@exemple.ch" : "you@example.ch"} /></label>
          <label><span>{isFrench ? "Téléphone" : "Phone number"}</span><input name="phone" type="tel" autoComplete="tel" required maxLength={40} placeholder="+41 79 123 45 67" /></label>
        </div>
      </fieldset>

      <fieldset className={styles.group} data-step="2" hidden={step !== 2}>
        <legend>{isFrench ? "Votre préférence de contact" : "Your contact preference"}</legend>
        <div className={styles.fields}>
          <label className="campaignLandingFormWide">
            <span>{isFrench ? "Quand préférez-vous être contacté ?" : "When would you prefer to be contacted?"}</span>
            <select name="contactTime" defaultValue="Sans préférence">
              <option value="Sans préférence">{isFrench ? "Sans préférence" : "No preference"}</option>
              {["08:00 – 10:00", "10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00"].map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.group} data-step="1" hidden={step !== 1}>
        <legend>{isFrench ? "Votre bien" : "Your property"}</legend>
        <div className={styles.fields}>
          <label className="campaignLandingFormWide">
            <span>{isFrench ? "Type de bien" : "Property type"}</span>
            <select name="propertyType" required value={propertyType} onChange={event => {
              const nextType = event.target.value;
              setPropertyType(nextType);
              setRoomCount(["Terrain", "Immeuble", "Grange"].includes(nextType) ? "0" : "");
              setApproximateArea(nextType === "Terrain" ? "0" : "");
            }}>
              <option value="" disabled>{isFrench ? "Sélectionnez un type de bien" : "Select a property type"}</option>
              {[
                ["Appartement", "Apartment"], ["Maison / villa", "House / villa"],
                ["Immeuble", "Building"], ["Raccard", "Traditional granary"], ["Grange", "Barn"], ["Terrain", "Land"],
                ["Local commercial", "Commercial property"], ["Autre", "Other"],
              ].map(([fr, en]) => <option key={fr} value={fr}>{isFrench ? fr : en}</option>)}
            </select>
          </label>
          <label className="campaignLandingFormWide"><span>{isFrench ? "Adresse du bien" : "Property address"}</span><input name="propertyAddress" autoComplete="section-property street-address" required maxLength={500} placeholder={isFrench ? "Rue, numéro, code postal et ville" : "Street, number, postal code and city"} /></label>
          <label hidden={skipsRoomCount}>
            <span>{isFrench ? "Nombre de pièces" : "Number of rooms"}</span>
            <select name="roomCount" required={!skipsRoomCount} disabled={skipsRoomCount} value={roomCount} onChange={event => setRoomCount(event.target.value)}>
              <option value="" disabled>{isFrench ? "Sélectionnez" : "Select"}</option>
              {Array.from({ length: 11 }, (_, index) => 1 + index * 0.5).map(count => (
                <option key={count} value={count}>{count.toLocaleString(isFrench ? "fr-CH" : "en-CH")}</option>
              ))}
              <option value="6+">{isFrench ? "6 pièces ou plus" : "6 rooms or more"}</option>
            </select>
          </label>
          <label hidden={skipsRoomAndArea}>
            <span>{isFrench ? "Surface approximative" : "Approximate area"}<em>{isFrench ? "Facultatif" : "Optional"}</em></span>
            <select name="approximateArea" disabled={skipsRoomAndArea} value={approximateArea} onChange={event => setApproximateArea(event.target.value)} aria-label={isFrench ? "Surface approximative en m² (facultatif)" : "Approximate area in m² (optional)"}>
              <option value="">{isFrench ? "Sélectionnez" : "Select"}</option>
              {Array.from({ length: 15 }, (_, index) => index * 10).map(minimum => (
                <option key={minimum} value={`${minimum}–${minimum + 10}`}>{minimum}–{minimum + 10} m²</option>
              ))}
              <option value="150+">+150 m²</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.group} data-step="1" hidden={step !== 1}>
        <legend>{isFrench ? "Votre projet de vente" : "Your sales plans"}</legend>
        <div className={styles.fields}>
          <label>
            <span>{isFrench ? "Délai de vente" : "Time until sale"}</span>
            <select name="saleMonths" required defaultValue="">
              <option value="" disabled>{isFrench ? "Sélectionnez" : "Select"}</option>
              <option value={isFrench ? "0–3 mois" : "0–3 months"}>{isFrench ? "0–3 mois" : "0–3 months"}</option>
              <option value={isFrench ? "3–6 mois" : "3–6 months"}>{isFrench ? "3–6 mois" : "3–6 months"}</option>
              <option value={isFrench ? "6–12 mois" : "6–12 months"}>{isFrench ? "6–12 mois" : "6–12 months"}</option>
              <option value={isFrench ? "12 mois ou plus" : "12 months or more"}>{isFrench ? "12 mois ou plus" : "12 months or more"}</option>
            </select>
          </label>
          <label>
            <span>{isFrench ? "Prix souhaité" : "Desired price"}<em>{isFrench ? "Facultatif" : "Optional"}</em></span>
            <div className={styles.inputWithUnit}>
              <input name="desiredPrice" type="number" inputMode="decimal" min={0} step="0.01" placeholder="850000" aria-label={isFrench ? "Prix souhaité en CHF (facultatif)" : "Desired price in CHF (optional)"} />
              <span aria-hidden="true">CHF</span>
            </div>
          </label>
        </div>
      </fieldset>

      <label className="campaignLandingHoneypot" aria-hidden="true"><span>{isFrench ? "Site web" : "Website"}</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
      {step === 2 ? <button className={styles.back} type="button" disabled={status.state === "sending"} onClick={event => { if (event.currentTarget.form) changeStep(event.currentTarget.form, 1); }}>{isFrench ? "← Modifier les informations du bien" : "← Edit property details"}</button> : null}
      <button className="campaignLandingButton campaignLandingButtonDark campaignLandingFormWide realEstateContinueNeon" type="submit" disabled={status.state === "sending"}>
        {status.state === "sending" ? (isFrench ? "Envoi…" : "Sending…") : step === 1 ? (isFrench ? "Continuer vers mes coordonnées" : "Continue to my contact details") : (isFrench ? "Recevoir mon estimation gratuite" : "Request my free valuation")}
        <ArrowUpRight size={17} aria-hidden="true" />
      </button>
      <p className="campaignLandingFormWide campaignLandingFormStatus" data-state={status.state} role="status" aria-live="polite">{status.message}</p>
    </form>
  );
}

