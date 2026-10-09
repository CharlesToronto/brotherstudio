"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Search, House, Download, CalendarDays, List, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { VALUATION_STATUSES, VALUATION_TIME_ZONE, isOpenProspect, statusLabel, valuationDateKey, type ValuationRequest } from "@/lib/valuationRequests";
import { DashboardProspectCalendar, monthLabel, shiftMonth, type CalendarMode } from "@/components/DashboardProspectCalendar";
import { buildValuationCsv } from "@/lib/valuationCsv";
import { DashboardProspectDetail } from "@/components/DashboardProspectDetail";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: VALUATION_TIME_ZONE });
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function exportCsv(requests: ValuationRequest[]) {
  const csv = buildValuationCsv(requests);
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `prospects-immobiliers-${valuationDateKey(new Date())}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DashboardValuationRequests({ onUnsavedChange }: { onUnsavedChange?: (dirty: boolean) => void }) {
  const [requests, setRequests] = useState<ValuationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState(() => valuationDateKey(new Date()).slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [mode, setMode] = useState<CalendarMode>("received");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [allDates, setAllDates] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const dirtyRef = useRef(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const onDirty = useCallback((dirty: boolean) => { dirtyRef.current = dirty; onUnsavedChange?.(dirty); }, [onUnsavedChange]);
  function change(action: () => void) {
    if (dirtyRef.current && !window.confirm("Les modifications du suivi ne sont pas enregistrées. Continuer sans les enregistrer ?")) return;
    if (dirtyRef.current) setEditorVersion(value => value + 1);
    dirtyRef.current = false;
    action();
  }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/dashboard/valuation-requests", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Impossible de charger les demandes.");
        if (!controller.signal.aborted) setRequests(payload.requests);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Connexion impossible."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("brotherstudio-admin-unlocked", refresh);
    return () => { controller.abort(); window.removeEventListener("brotherstudio-admin-unlocked", refresh); };
  }, [revision]);

  const today = valuationDateKey(new Date());
  const overdue = requests.filter(request => isOpenProspect(request) && request.next_follow_up && request.next_follow_up < today);
  const followupsToday = requests.filter(request => isOpenProspect(request) && request.next_follow_up === today);
  const monthRequests = requests.filter(request => valuationDateKey(request.created_at).startsWith(month));
  const previousCount = requests.filter(request => valuationDateKey(request.created_at).startsWith(shiftMonth(month, -1))).length;
  const changePercent = previousCount ? Math.round((monthRequests.length - previousCount) / previousCount * 100) : null;
  const baseFiltered = requests.filter(request => {
    const text = normalize(`${request.first_name} ${request.last_name} ${request.email} ${request.phone} ${request.property_address}`);
    return (!propertyType || request.property_type === propertyType) && (!statusFilter || request.status === statusFilter)
      && text.includes(normalize(search.trim())) && (!overdueOnly || overdue.some(item => item.id === request.id));
  });
  const filtered = baseFiltered.filter(request => {
    if (overdueOnly) return true;
    const date = mode === "received" ? valuationDateKey(request.created_at) : isOpenProspect(request) ? request.next_follow_up : null;
    return date && (selectedDay ? date === selectedDay : allDates ? true : date.startsWith(month));
  });
  const types = [...new Set(requests.map(request => request.property_type))].sort();
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1));
  const visible = filtered.slice(currentPage * 20, (currentPage + 1) * 20);
  const selected = requests.find(request => request.id === selectedId) ?? visible[0];
  const trend = Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(month, index - 5);
    return { key, count: requests.filter(request => valuationDateKey(request.created_at).startsWith(key)).length };
  });
  const maxTrend = Math.max(1, ...trend.map(item => item.count));
  function changeMonth(value: string) { change(() => { setMonth(value); setSelectedDay(null); setAllDates(false); setOverdueOnly(false); setPage(0); setSelectedId(null); }); }
  function resetFilters() { change(() => { setMode("received"); setSearch(""); setPropertyType(""); setStatusFilter(""); setSelectedDay(null); setAllDates(true); setOverdueOnly(false); setPage(0); setSelectedId(null); }); }

  return <div className="valuationWorkspace" aria-busy={loading}>
    <div className="valuationHeading"><div><p className="valuationEyebrow">Vendre un bien · gestion des prospects</p><h2>Votre suivi immobilier</h2><p>Réception des demandes, suivi commercial et prochaines actions.</p></div>
      <div className="prospectHeaderActions"><button type="button" className="valuationRefresh" disabled={loading || !!error || !filtered.length} onClick={() => exportCsv(filtered)}><Download size={16} aria-hidden="true" /> Exporter la sélection</button>
        <button type="button" className="valuationRefresh" disabled={loading} onClick={() => change(() => setRevision(value => value + 1))}><RefreshCw size={16} aria-hidden="true" />Actualiser</button></div>
    </div>
    {error ? <p className="valuationError" role="alert">{error}</p> : null}
    {loading ? <p role="status">Chargement des prospects…</p> : error ? null : <>
      <div className="prospectStats">
        <article><span>Total des formulaires</span><strong>{requests.length}</strong><small>Toutes les demandes reçues</small></article>
        <article className="is-blue"><span>Formulaires ce mois</span><strong>{monthRequests.length}</strong><small>{monthLabel(month)} · {changePercent != null ? `${changePercent >= 0 ? "+" : ""}${changePercent} % vs mois précédent` : previousCount === 0 && monthRequests.length > 0 ? "Aucune demande le mois précédent" : "Aucune demande sur ces deux mois"}</small></article>
        <article><span>Nouveaux prospects</span><strong>{requests.filter(request => request.status === "new").length}</strong><small>À prendre en charge</small></article>
        <article className="is-amber"><span>Relances aujourd’hui</span><strong>{followupsToday.length}</strong><small>{overdue.length} relance{overdue.length > 1 ? "s" : ""} en retard</small></article>
      </div>
      <div className="prospectOverview">
        <section className="prospectTrend"><div className="prospectSectionTitle"><h3>Formulaires reçus par mois</h3><span>{changePercent != null ? <>{changePercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{changePercent}%</> : "6 mois"}</span></div>
          <div className="prospectTrendBars">{trend.map(item => <button type="button" key={item.key} aria-label={`${monthLabel(item.key)} : ${item.count} formulaires. Afficher ce mois.`} onClick={() => changeMonth(item.key)} data-current={item.key === month}>
            <strong>{item.count}</strong><span className="prospectBarTrack"><span style={{ height: `${item.count ? Math.max(5, item.count / maxTrend * 100) : 0}%` }} /></span><small>{new Intl.DateTimeFormat("fr-CA", { month: "short", timeZone: "UTC" }).format(new Date(`${item.key}-01T12:00:00Z`))}</small>
          </button>)}</div>
        </section>
        <section className="prospectPipeline"><h3>Avancement des prospects</h3><p>Tous les prospects · cliquez pour filtrer</p><div>{VALUATION_STATUSES.map(item => <button type="button" key={item.value} data-status={item.value} aria-pressed={statusFilter === item.value} onClick={() => change(() => { setStatusFilter(statusFilter === item.value ? "" : item.value); setSelectedId(null); setPage(0); setAllDates(true); setSelectedDay(null); setOverdueOnly(false); })}><span className="prospectStatusDot" /><span>{item.label}</span><strong>{requests.filter(request => request.status === item.value).length}</strong></button>)}</div></section>
      </div>
      {overdue.length > 0 ? <div className="prospectOverdueAlert"><span><strong>{overdue.length} relance{overdue.length > 1 ? "s" : ""} en retard.</strong> Reprenez contact avec ces prospects.</span><button type="button" onClick={() => change(() => { setOverdueOnly(true); setMode("followup"); setSearch(""); setPropertyType(""); setStatusFilter(""); setView("list"); setSelectedId(null); setPage(0); })}>Voir les relances</button></div> : null}
      <div className="valuationFilters">
        <label className="valuationSearch"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher un prospect</span><input type="search" placeholder="Nom, email, téléphone ou adresse…" value={search} onChange={event => { const value = event.target.value; change(() => { setSearch(value); setPage(0); setSelectedId(null); }); }} /></label>
        <label><span className="sr-only">Type de bien</span><select value={propertyType} onChange={event => { const value = event.target.value; change(() => { setPropertyType(value); setPage(0); setSelectedId(null); }); }}><option value="">Tous les types de biens</option>{types.map(type => <option key={type}>{type}</option>)}</select></label>
        <label><span className="sr-only">Statut du prospect</span><select value={statusFilter} onChange={event => { const value = event.target.value; change(() => { setStatusFilter(value); setPage(0); setSelectedId(null); }); }}><option value="">Tous les statuts</option>{VALUATION_STATUSES.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      </div>
      <div className="prospectViewToolbar"><div className="prospectModeSwitch" aria-label="Affichage des prospects"><button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}><CalendarDays size={16} /> Calendrier</button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} /> Liste</button></div>
        <div className="prospectDateScope"><label><input type="checkbox" checked={allDates} onChange={event => { const checked = event.target.checked; change(() => { setAllDates(checked); setSelectedDay(null); setOverdueOnly(false); setSelectedId(null); setPage(0); }); }} />Toutes les dates</label><button type="button" onClick={resetFilters}>Réinitialiser les filtres</button></div>
      </div>
      {view === "calendar" ? <DashboardProspectCalendar requests={baseFiltered} month={month} selectedDay={selectedDay} mode={mode} onMonth={changeMonth}
        onDay={day => change(() => { setSelectedDay(day); setAllDates(false); setOverdueOnly(false); setPage(0); setSelectedId(null); })}
        onMode={value => change(() => { setMode(value); setOverdueOnly(false); setSelectedId(null); setPage(0); })} /> : <div className="prospectListScope"><select aria-label="Type de date" value={mode} onChange={event => { const value = event.target.value as CalendarMode; change(() => { setMode(value); setSelectedId(null); setPage(0); }); }}><option value="received">Formulaires reçus</option><option value="followup">Relances à faire</option></select><input aria-label="Mois affiché" type="month" value={month} onChange={event => changeMonth(event.target.value || today.slice(0, 7))} /></div>}
      <div className="valuationColumns"><div>
        <div className="prospectResultsHeading"><h3>{overdueOnly ? "Relances en retard" : selectedDay ? new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selectedDay}T12:00:00Z`)) : allDates ? "Toutes les demandes" : monthLabel(month)}</h3><span>{filtered.length} prospect{filtered.length > 1 ? "s" : ""} · {mode === "received" ? "réception" : "relance"}</span></div>
        {filtered.length === 0 ? <div className="valuationEmpty"><House size={28} aria-hidden="true" /><h3>{requests.length ? "Aucun prospect sur cette sélection" : "Aucune demande pour le moment"}</h3><p>{requests.length ? "Choisissez une autre date ou réinitialisez les filtres." : "Les réponses au formulaire « Vendre un bien » apparaîtront ici."}</p>{requests.length ? <button type="button" className="valuationRefresh" onClick={resetFilters}>Voir toutes les demandes</button> : null}</div> : <ul className="valuationList">{visible.map(request => <li key={request.id}><button type="button" aria-pressed={selected?.id === request.id} onClick={() => change(() => setSelectedId(request.id))}>
          <span className="valuationListTop"><strong>{request.first_name} {request.last_name}</strong><span>{request.property_type}</span></span><span className="valuationAddress">{request.property_address}</span>
          <span className="prospectStatusBadge" data-status={request.status}>{statusLabel(request.status)}</span>
          <span className="valuationListBottom"><time dateTime={request.created_at}>{dateFormatter.format(new Date(request.created_at))}</time><span>Vente : {request.sale_timeline}</span></span>
          {request.next_follow_up && isOpenProspect(request) ? <span className="prospectCardFollowup" data-overdue={request.next_follow_up < today}>Relance : {request.next_follow_up.split("-").reverse().join("/")}</span> : null}
        </button></li>)}</ul>}
        {filtered.length > 20 ? <div className="valuationPagination"><button type="button" disabled={currentPage === 0} onClick={() => change(() => { setPage(currentPage - 1); setSelectedId(null); })}>Précédent</button><span>Page {currentPage + 1} / {Math.ceil(filtered.length / 20)}</span><button type="button" disabled={(currentPage + 1) * 20 >= filtered.length} onClick={() => change(() => { setPage(currentPage + 1); setSelectedId(null); })}>Suivant</button></div> : null}
      </div>{selected ? <DashboardProspectDetail key={`${selected.id}-${editorVersion}`} request={selected} onDirty={onDirty} onSaved={updated => { setRequests(current => current.map(request => request.id === updated.id ? updated : request)); setSelectedId(updated.id); }} /> : <section className="prospectNoSelection"><h3>La fiche complète, au même endroit</h3><p>Sélectionnez un prospect pour consulter ses réponses, enregistrer vos notes et planifier une relance.</p></section>}</div>
      <details className="prospectHelp"><summary>Comment utiliser cet espace ?</summary><ol><li>Consultez le calendrier pour voir quand les formulaires ont été remplis et combien ont été reçus chaque jour.</li><li>Ouvrez un prospect, contactez-le par email ou téléphone, puis passez son statut à « Contacté ».</li><li>Ajoutez vos notes et une date de prochaine relance, puis enregistrez le suivi.</li><li>Retrouvez les actions planifiées dans « Relances à faire ». Les dossiers « Vendu » et « Sans suite » quittent les relances actives.</li><li>Suivez le volume mensuel et l’avancement des dossiers. L’export CSV contient les prospects de la sélection actuelle.</li></ol><p>Les relances sont affichées dans cet espace ; aucun email ni rappel automatique n’est envoyé.</p></details>
    </>}
  </div>;
}
