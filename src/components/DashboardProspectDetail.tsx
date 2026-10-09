"use client";
import { useEffect, useState } from "react";
import { VISIT_STATUSES } from "@/lib/estate";
import { Mail, Phone, Save, CalendarClock } from "lucide-react";
import { VALUATION_STATUSES, VALUATION_TIME_ZONE, type ValuationRequest, type ValuationStatus } from "@/lib/valuationRequests";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: VALUATION_TIME_ZONE });
const moneyFormatter = new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 });
export function DashboardProspectDetail({ request, onSaved, onDirty, visits = false }: {
  visits?: boolean; request: ValuationRequest; onSaved: (request: ValuationRequest) => void; onDirty: (dirty: boolean) => void;
}) {
  const [status, setStatus] = useState<ValuationStatus>(request.status);
  const [notes, setNotes] = useState(request.notes);
  const [followup, setFollowup] = useState(request.next_follow_up ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = status !== request.status || notes !== request.notes || followup !== (request.next_follow_up ?? "");
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${visits ? "/api/estate/visits" : "/api/dashboard/valuation-requests"}/${request.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes, nextFollowUp: followup || null, updatedAt: request.updated_at }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Enregistrement impossible.");
      setNotes(payload.request.notes);
      onSaved(payload.request);
      setMessage("Suivi enregistré.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }
  return <section className="valuationDetail" aria-label="Fiche et suivi du prospect">
    <p className="valuationEyebrow">Fiche prospect</p><h3>{request.first_name} {request.last_name}</h3>
    <p className="valuationDate">Formulaire reçu le {dateFormatter.format(new Date(request.created_at))} · Toronto</p>
    <div className="valuationContact">
      <a href={`mailto:${request.email}`}><Mail size={16} aria-hidden="true" />{request.email}</a>
      {request.phone ? <a href={`tel:${request.phone.replace(/[^+\d]/g, "")}`}><Phone size={16} aria-hidden="true" />{request.phone}</a> : null}
    </div>
    <form className="prospectFollowupForm" onSubmit={save}>
      <h4><CalendarClock size={18} aria-hidden="true" /> Suivi commercial</h4>
      <label>Statut<select value={status} disabled={saving} onChange={event => setStatus(event.target.value as ValuationStatus)}>{(visits ? VISIT_STATUSES : VALUATION_STATUSES).map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      <label>Prochaine relance<input type="date" value={followup} disabled={saving} onChange={event => setFollowup(event.target.value)} /></label>
      <label>Notes internes<textarea rows={4} maxLength={20000} value={notes} disabled={saving} onChange={event => setNotes(event.target.value)} placeholder="Compte rendu d’appel, besoins, prochaine action…" /></label>
      <div className="prospectSaveRow"><button type="submit" disabled={saving || !dirty}><Save size={16} aria-hidden="true" />{saving ? "Enregistrement…" : "Enregistrer le suivi"}</button><span>{dirty ? "Modifications non enregistrées" : "À jour"}</span></div>
      {message ? <p className="prospectSuccess" role="status">{message}</p> : null}{error ? <p className="valuationError" role="alert">{error}</p> : null}
    </form>
    <h4 className="prospectAnswersHeading">Réponses du formulaire</h4>
    {visits ? <p className="prospectSource">Demande envoyée depuis le bien : <strong>{request.property_address}</strong><br /><a href={`/fr/immobilier/${request.property_slug}`} target="_blank" rel="noopener noreferrer">Voir le bien</a> · Formulaire {request.locale === "en" ? "anglais" : "français"}</p> : null}
    <dl>{(visits ? [["Nom complet", `${request.first_name} ${request.last_name}`], ["Email", request.email], ["Téléphone", request.phone], ["Bien concerné", request.property_address], ["Référence du bien", request.property_slug]] : [
      ["Prénom", request.first_name], ["Nom", request.last_name], ["Email", request.email], ["Téléphone", request.phone],
      ["Type de bien", request.property_type], ["Adresse du bien", request.property_address], ["Nombre de pièces", request.room_count],
      ["Surface approximative", request.approximate_area ? `${request.approximate_area} m²` : null],
      ["Prix souhaité", request.desired_price_chf != null ? moneyFormatter.format(request.desired_price_chf) : null],
      ["Délai de vente", request.sale_timeline], ["Créneau de contact préféré", request.contact_time],
    ]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Non renseigné"}</dd></div>)}</dl>
    <p className="valuationDate">Dernière mise à jour : {dateFormatter.format(new Date(request.updated_at))}</p>
  </section>;
}
