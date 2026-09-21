"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpRight, CalendarDays, Check, Clock3, Columns3, Flame, List, Mail, MessageSquare, Phone, Plus, RefreshCw, Search, Users, X } from "lucide-react";
import { activityKinds, csvCell, hasDueToday, nextDue, prospectDraft, prospectStatuses, statusLabel, toLocalDateTime, type ActivityKind, type Prospect, type ProspectDraft, type ProspectStatus } from "@/lib/projectProspects";
import "./project-prospects.css";

type Props = { projectId: string; adminMode?: boolean; projectName?: string };
type View = "table" | "pipeline" | "agenda";
type QuickFilter = "all" | "new" | "today" | "overdue" | "hot";
const dateFormat = new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const displayDate = (value: string | null) => value ? dateFormat.format(new Date(value)) : "Non renseigné";
const temperatureLabels = { cold: "À découvrir", warm: "En réflexion", hot: "Prêt à avancer" };
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function Status({ value }: { value: ProspectStatus }) { return <span className="crm-status" data-status={value}>{statusLabel(value)}</span>; }

export function ProjectProspects({ projectId, adminMode = false, projectName = "Ce projet" }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<View>("table");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(prospectDraft);
  const [activity, setActivity] = useState({ kind: "call" as ActivityKind, content: "", outcome: "", occurred_at: "" });
  const [task, setTask] = useState({ title: "", due_at: "" });
  const [now, setNow] = useState(() => Date.now());
  const detailRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);
  const selected = prospects.find((item) => item.id === selectedId) ?? null;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/project/${projectId}/prospects`, { cache: "no-store", signal });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.prospects)) throw new Error(payload.error || "Chargement impossible.");
      setProspects(payload.prospects);
    } catch (cause) {
      if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => void load(controller.signal);
    window.addEventListener("brotherstudio-admin-unlocked", refresh);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => { controller.abort(); window.removeEventListener("brotherstudio-admin-unlocked", refresh); window.clearInterval(timer); };
  }, [load]);

  const active = prospects.filter((item) => item.status !== "not_interested");
  const metrics = {
    all: prospects.length,
    new: prospects.filter((item) => item.status === "new").length,
    today: active.filter((item) => hasDueToday(item, new Date(now))).length,
    overdue: active.filter((item) => { const date = nextDue(item); return date && Date.parse(date) < now; }).length,
    hot: active.filter((item) => item.temperature === "hot").length,
  };
  const sources = [...new Set(prospects.map((item) => item.source).filter(Boolean))].sort();
  const visible = useMemo(() => {
    const found = prospects.filter((item) => {
      const due = nextDue(item);
      return (status === "all" || status === item.status)
        && (source === "all" || source === item.source)
        && normalized(`${item.name} ${item.email} ${item.phone} ${item.source} ${item.interest} ${item.owner}`).includes(normalized(query))
        && (quick === "all" || (quick === "new" && item.status === "new") || (quick === "today" && hasDueToday(item, new Date(now))) || (quick === "overdue" && due && Date.parse(due) < now) || (quick === "hot" && item.temperature === "hot" && item.status !== "not_interested"));
    });
    return found.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "followup") return (Date.parse(nextDue(a) || "") || Infinity) - (Date.parse(nextDue(b) || "") || Infinity) || a.name.localeCompare(b.name);
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }, [prospects, query, quick, sort, source, status, now]);
  const resetFilters = () => { setQuery(""); setQuick("all"); setStatus("all"); setSource("all"); setPage(1); };
  const changeQuick = (value: QuickFilter) => { setQuick(value); setPage(1); };
  const open = (item: Prospect) => { setSelectedId(item.id); setEditing(false); setError(""); setNotice(""); setActivity({ kind: "call", content: "", outcome: "", occurred_at: toLocalDateTime(new Date().toISOString()) }); setTask({ title: "", due_at: "" }); window.requestAnimationFrame(() => detailRef.current?.focus()); };
  const create = () => { setSelectedId(null); setDraft({ ...prospectDraft }); setEditing(true); setError(""); setNotice(""); };
  const edit = () => {
    if (!selected) return;
    setDraft({ ...selected, next_follow_up_at: toLocalDateTime(selected.next_follow_up_at) });
    setEditing(true); setError("");
  };
  const mutate = async (body: Record<string, unknown>, method = "PATCH", target = selected) => {
    if (!adminMode || saving) return false;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/project/${projectId}/prospects`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(target ? { id: target.id, updated_at: target.updated_at } : {}), ...body }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Enregistrement impossible.");
      if (method === "DELETE") { setProspects((current) => current.filter((item) => item.id !== target?.id)); setSelectedId(null); setPage(1); }
      else { setProspects((current) => [payload.prospect, ...current.filter((item) => item.id !== payload.prospect.id)]); if (method === "POST") setSelectedId(payload.prospect.id); }
      setPage(1);
      setNotice(method === "DELETE" ? "Prospect supprimé." : "Modifications enregistrées.");
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible. Réessayez."); return false; }
    finally { setSaving(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (await mutate({ ...draft, next_follow_up_at: draft.next_follow_up_at ? new Date(draft.next_follow_up_at).toISOString() : null }, selected ? "PATCH" : "POST")) setEditing(false);
  };
  const exportCsv = () => {
    const rows = [["Nom", "Courriel", "Téléphone", "Statut", "Source", "Intérêt", "Budget", "Délai d’achat", "Responsable", "Niveau d’intérêt", "Dernier contact", "Prochaine échéance", "Créé le"], ...visible.map((item) => [item.name, item.email, item.phone, statusLabel(item.status), item.source, item.interest, item.budget, item.timeline, item.owner, temperatureLabels[item.temperature], item.last_contacted_at, nextDue(item), item.created_at])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `prospects-${projectId}.csv`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const dueBadge = (item: Prospect) => { const due = nextDue(item); return due ? <span className="crm-due" data-late={Date.parse(due) < now}><Clock3 size={13} />{displayDate(due)}</span> : <span className="crm-muted">À planifier</span>; };
  const field = (key: keyof ProspectDraft, label: string, type = "text", placeholder = "") => <label className="crm-field"><span>{label}</span><input type={type} required={key === "name"} maxLength={300} value={draft[key]} placeholder={placeholder} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>;
  const info = (label: string, value: string | null) => <div><dt>{label}</dt><dd>{value || "Non renseigné"}</dd></div>;
  const agenda = visible.flatMap((item) => item.status === "not_interested" ? [] : [
    ...(item.next_follow_up_at ? [{ prospect: item, id: "followup", title: "Relancer le prospect", due: item.next_follow_up_at }] : []),
    ...item.tasks.filter((entry) => !entry.completed_at).map((entry) => ({ prospect: item, id: entry.id, title: entry.title, due: entry.due_at })),
  ]).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));

  return <section className="prospectCRM" aria-label="Suivi des prospects">
    <header className="crm-header">
      <div><p className="crm-eyebrow">MYREVIEW / SUIVI COMMERCIAL</p><h2>Vos prospects, au bon moment.</h2><p className="crm-muted">{projectName} <span aria-hidden="true">·</span> Centralisez les demandes et préparez chaque prochain contact.</p></div>
      <div className="crm-actions"><button className="crm-button" type="button" onClick={() => void load()} disabled={loading || saving}><RefreshCw size={15} />Actualiser</button>{adminMode ? <button className="crm-button crm-primary" type="button" disabled={Boolean(loadError) || loading} onClick={create}><Plus size={16} />Ajouter un prospect</button> : <span className="crm-access">Consultation</span>}</div>
    </header>

    <div className="crm-metrics">
      {([
        ["all", "Tous les prospects", "Vue complète du projet", Users],
        ["new", "Nouvelles demandes", "Premier contact à préparer", MessageSquare],
        ["today", "À suivre aujourd’hui", "Échéances du jour", CalendarDays],
        ["overdue", "En retard", "Contacts à prioriser", Clock3],
        ["hot", "Prêts à avancer", "Intérêt confirmé", Flame],
      ] as const).map(([key, title, subtitle, Icon]) => <button key={key} type="button" className="crm-metric" aria-pressed={quick === key} onClick={() => changeQuick(key)}><span>{title}<Icon size={17} /></span><strong>{loading || loadError ? "—" : metrics[key]}</strong><small>{subtitle}</small></button>)}
    </div>

    <div className="crm-workspace">
      <div className="crm-workspace-heading"><div><h3>Carnet de prospects</h3><p className="crm-muted">{adminMode ? "Ajoutez vos contacts, consignez les échanges et organisez les relances." : "Consultez les fiches et les suivis. Les modifications se font dans MyReview Admin."}</p></div><div className="crm-actions"><div className="crm-segment" aria-label="Affichage">{([["table", "Liste", List], ["pipeline", "Pipeline", Columns3], ["agenda", "Relances", CalendarDays]] as const).map(([key, label, Icon]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}><Icon size={15} />{label}</button>)}</div><button type="button" className="crm-button" onClick={exportCsv} disabled={!visible.length || loading || Boolean(loadError)}><ArrowDownToLine size={15} />Exporter</button></div></div>
      <div className="crm-toolbar">
        <label className="crm-search"><Search size={17} /><input aria-label="Rechercher un prospect" placeholder="Nom, courriel, téléphone, source…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <select aria-label="Filtrer par statut" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">Tous les statuts</option>{prospectStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Filtrer par source" value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}><option value="all">Toutes les sources</option>{sources.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Trier les prospects" value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Plus récents</option><option value="followup">Prochaine échéance</option><option value="name">Nom A–Z</option></select>
      </div>
      {(query || quick !== "all" || status !== "all" || source !== "all") && <div className="crm-filter-summary"><span>{visible.length} résultat(s)</span><button type="button" onClick={resetFilters}>Réinitialiser les filtres</button></div>}
      {loadError ? <div className="crm-error crm-load-error" role="alert"><strong>Les prospects ne sont pas disponibles.</strong><p>{loadError}</p><button className="crm-button" type="button" onClick={() => void load()}>Réessayer</button></div> : loading ? <div className="crm-empty" role="status"><RefreshCw size={26} /><h4>Chargement des prospects…</h4></div> : <>
        {view === "table" && (visible.length ? <><div className="crm-table-scroll"><table className="crm-table"><thead><tr><th>Prospect</th><th>Statut</th><th>Source</th><th>Intérêt / budget</th><th>Dernier contact</th><th>Prochaine action</th><th><span className="visuallyHidden">Fiche</span></th></tr></thead><tbody>{visible.slice((page - 1) * 20, page * 20).map((item) => <tr key={item.id}><td><button className="crm-person" type="button" onClick={() => open(item)}><span className="crm-avatar">{item.name.slice(0, 1).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.email || item.phone || "Coordonnées à compléter"}</small></span></button></td><td><Status value={item.status} /></td><td>{item.source || "—"}</td><td><span>{item.interest || "—"}</span><small className="crm-cell-sub">{item.budget || "Budget non précisé"}</small></td><td>{item.last_contacted_at ? displayDate(item.last_contacted_at) : "Pas encore contacté"}</td><td>{dueBadge(item)}</td><td><button className="crm-icon-button" type="button" aria-label={`Ouvrir la fiche de ${item.name}`} onClick={() => open(item)}><ArrowUpRight size={18} /></button></td></tr>)}</tbody></table></div><div className="crm-pagination"><span>{visible.length} prospect(s)</span><div><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Précédent</button><span>{page} / {Math.max(1, Math.ceil(visible.length / 20))}</span><button type="button" disabled={page * 20 >= visible.length} onClick={() => setPage((value) => value + 1)}>Suivant</button></div></div></> : <div className="crm-empty"><span className="crm-empty-icon"><Users size={28} /></span><h4>{prospects.length ? "Aucun résultat pour ces filtres" : "Votre prochain client commence ici."}</h4><p>{prospects.length ? "Ajustez votre recherche pour retrouver un prospect." : "Chaque prospect aura sa fiche, son historique et une prochaine action. Les contacts sont ajoutés manuellement depuis l’administration."}</p>{prospects.length ? <button className="crm-button" onClick={resetFilters}>Effacer les filtres</button> : adminMode ? <button className="crm-button crm-primary" onClick={create}><Plus size={16} />Ajouter le premier prospect</button> : <a className="crm-button" href={`/admin/client-projects/${projectId}`}>Ouvrir MyReview Admin<ArrowUpRight size={15} /></a>}</div>)}
        {view === "pipeline" && <div className="crm-board">{prospectStatuses.map(([key, label]) => { const items = visible.filter((item) => item.status === key); return <section className="crm-column" key={key}><h4><span className="crm-dot" data-status={key} />{label}<span>{items.length}</span></h4>{items.length ? items.map((item) => <article className="crm-kanban-card" key={item.id}><button type="button" onClick={() => open(item)}><strong>{item.name}</strong><small>{item.interest || "Intérêt à préciser"}</small></button><p>{item.source || "Source non précisée"}</p>{dueBadge(item)}{adminMode && <select disabled={saving} aria-label={`Statut de ${item.name}`} value={item.status} onChange={(event) => void mutate({ status: event.target.value }, "PATCH", item)}>{prospectStatuses.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select>}</article>) : <p className="crm-column-empty">Aucun prospect à cette étape</p>}</section>; })}</div>}
        {view === "agenda" && (agenda.length ? <div className="crm-agenda">{agenda.map((entry) => <article key={`${entry.prospect.id}-${entry.id}`}><span className="crm-agenda-icon"><CalendarDays size={20} /></span><div><button className="crm-text-button" onClick={() => open(entry.prospect)}>{entry.prospect.name}</button><p>{entry.title}</p><span className="crm-due" data-late={Date.parse(entry.due) < now}>{displayDate(entry.due)}{Date.parse(entry.due) < now ? " · En retard" : ""}</span></div>{adminMode && <button className="crm-button" disabled={saving} onClick={() => void mutate(entry.id === "followup" ? { action: "complete_follow_up" } : { action: "complete_task", task_id: entry.id }, "PATCH", entry.prospect)}><Check size={15} />Terminer</button>}</article>)}</div> : <div className="crm-empty"><CalendarDays size={28} /><h4>Aucune relance à afficher</h4><p>Les prochaines actions et relances planifiées dans les fiches apparaîtront ici.</p></div>)}
      </>}
    </div>

    <div className="crm-bottom-grid"><section className="crm-insight"><p className="crm-eyebrow">ORIGINE DES DEMANDES</p><h3>D’où viennent vos prospects ?</h3>{loadError || loading ? <p className="crm-muted">Données indisponibles</p> : prospects.length ? [...new Set(prospects.map((item) => item.source || "Non précisée"))].map((name) => { const count = prospects.filter((item) => (item.source || "Non précisée") === name).length; return <div className="crm-source-row" key={name}><div><span>{name}</span><strong>{count}</strong></div><meter min={0} max={prospects.length} value={count} aria-label={`${name} : ${count} prospects`} /></div>; }) : <p className="crm-muted">Sites web, recommandations, réseaux sociaux… Les sources seront regroupées dès l’ajout de vos premiers contacts.</p>}</section><section className="crm-insight crm-guide"><p className="crm-eyebrow">UN SUIVI SIMPLE</p><h3>Un contact. Une prochaine étape.</h3><ol><li><strong>Centraliser</strong><span>Coordonnées, provenance, budget et délai d’achat.</span></li><li><strong>Échanger</strong><span>Consignez les appels, les courriels et les visites.</span></li><li><strong>Relancer</strong><span>Fixez une échéance et retrouvez vos priorités.</span></li></ol></section></div>
    {!selected && error && <p className="crm-error" role="alert">{error}</p>}
    {notice && <p className="crm-notice" role="status">{notice}</p>}

    {selected && !editing && <section className="crm-detail" ref={detailRef} tabIndex={-1} aria-label={`Fiche de ${selected.name}`}>
      <header><div><p className="crm-eyebrow">FICHE PROSPECT</p><h3>{selected.name}</h3><Status value={selected.status} /></div><div className="crm-actions">{adminMode && <button className="crm-button" onClick={edit}>Modifier la fiche</button>}<button className="crm-icon-button" aria-label="Fermer la fiche" onClick={() => setSelectedId(null)}><X /></button></div></header>
      <div className="crm-detail-grid"><div className="crm-profile"><h4>Coordonnées & projet</h4><div className="crm-contact-links">{selected.email && <a href={`mailto:${selected.email}`}><Mail size={16} />{selected.email}</a>}{selected.phone && <a href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}><Phone size={16} />{selected.phone}</a>}</div><dl>{info("Source", selected.source)}{info("Bien recherché", selected.interest)}{info("Budget", selected.budget)}{info("Délai d’achat", selected.timeline)}{info("Niveau d’intérêt", temperatureLabels[selected.temperature])}{info("Responsable", selected.owner)}{info("Langue", selected.language)}{info("Ajouté le", displayDate(selected.created_at))}{info("Dernier contact", selected.last_contacted_at ? displayDate(selected.last_contacted_at) : "Pas encore contacté")}</dl><h4>Demande initiale</h4><p className="crm-preserve">{selected.message || "Aucun message renseigné."}</p><h4>Notes de qualification</h4><p className="crm-preserve">{selected.notes || "Aucune note renseignée."}</p>{adminMode && <button className="crm-delete" disabled={saving} onClick={() => { if (window.confirm(`Supprimer la fiche de ${selected.name} et son historique ?`)) void mutate({}, "DELETE"); }}>Supprimer ce prospect</button>}</div>
      <div className="crm-tracking"><h4>Prochaines actions</h4>{selected.next_follow_up_at && <div className="crm-task"><div><strong>Relancer le prospect</strong><small>{displayDate(selected.next_follow_up_at)}</small></div>{adminMode && <button className="crm-button" disabled={saving} onClick={() => void mutate({ action: "complete_follow_up" })}>Terminer</button>}</div>}{selected.tasks.map((entry) => <div className="crm-task" data-done={Boolean(entry.completed_at)} key={entry.id}><div><strong>{entry.title}</strong><small>{displayDate(entry.due_at)}{entry.completed_at ? " · Terminée" : ""}</small></div>{adminMode && !entry.completed_at && <button className="crm-button" disabled={saving} onClick={() => void mutate({ action: "complete_task", task_id: entry.id })}>Terminer</button>}</div>)}{!selected.tasks.length && !selected.next_follow_up_at && <p className="crm-muted">Aucune prochaine action planifiée.</p>}
        {adminMode && <form className="crm-task-form" onSubmit={async (event) => { event.preventDefault(); if (await mutate({ action: "task", title: task.title, due_at: new Date(task.due_at).toISOString() })) setTask({ title: "", due_at: "" }); }}><label className="crm-field"><span>Prochaine action</span><input required maxLength={300} placeholder="Ex. Rappeler pour organiser une visite" value={task.title} onChange={(event) => setTask({ ...task, title: event.target.value })} /></label><label className="crm-field"><span>Échéance</span><input type="datetime-local" required value={task.due_at} onChange={(event) => setTask({ ...task, due_at: event.target.value })} /></label><button className="crm-button" disabled={saving}><Plus size={15} />Planifier</button></form>}
        <h4>Historique des échanges</h4>
        {adminMode && <form className="crm-activity-form" onSubmit={async (event) => { event.preventDefault(); if (await mutate({ ...activity, action: "activity", occurred_at: new Date(activity.occurred_at).toISOString() })) setActivity({ kind: "call", content: "", outcome: "", occurred_at: toLocalDateTime(new Date().toISOString()) }); }}><div className="crm-form-grid"><label className="crm-field"><span>Type d’échange</span><select value={activity.kind} onChange={(event) => setActivity({ ...activity, kind: event.target.value as ActivityKind })}>{activityKinds.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="crm-field"><span>Date et heure</span><input type="datetime-local" required max={toLocalDateTime(new Date().toISOString())} value={activity.occurred_at} onChange={(event) => setActivity({ ...activity, occurred_at: event.target.value })} /></label><label className="crm-field crm-full"><span>Résultat</span><input maxLength={300} placeholder="Ex. Joint, sans réponse, visite confirmée…" value={activity.outcome} onChange={(event) => setActivity({ ...activity, outcome: event.target.value })} /></label><label className="crm-field crm-full"><span>Compte rendu</span><textarea rows={3} required maxLength={10000} placeholder="Ce qui a été discuté et la suite à donner…" value={activity.content} onChange={(event) => setActivity({ ...activity, content: event.target.value })} /></label></div><button className="crm-button crm-primary" disabled={saving}>Consigner l’échange</button></form>}
        <ol className="crm-timeline">{[...selected.activities].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)).map((entry) => <li key={entry.id}><span className="crm-timeline-dot" /><div><header><strong>{entry.kind === "system" ? "Suivi de la fiche" : activityKinds.find(([key]) => key === entry.kind)?.[1]}</strong><time dateTime={entry.occurred_at}>{displayDate(entry.occurred_at)}</time></header>{entry.outcome && <span className="crm-outcome">{entry.outcome}</span>}<p className="crm-preserve">{entry.content}</p></div></li>)}</ol>{!selected.activities.length && <p className="crm-muted">Aucun échange consigné.</p>}
      </div></div>{error && <p className="crm-error" role="alert">{error}</p>}
    </section>}

    {editing && adminMode && <ProspectDialog title={selected ? `Modifier ${selected.name}` : "Ajouter un prospect"} onClose={() => { if (!saving) setEditing(false); }}><form onSubmit={save}><fieldset disabled={saving}><legend className="visuallyHidden">Fiche prospect</legend><p className="crm-muted">Rattachement : {projectName}. Seul le nom est obligatoire.</p><div className="crm-form-grid">{field("name", "Nom complet *", "text", "Prénom et nom")}{field("email", "Courriel", "email", "nom@exemple.com")}{field("phone", "Téléphone", "tel")}{field("source", "Source du prospect", "text", "Site du projet, Meta, recommandation…")}{field("interest", "Bien recherché", "text", "Appartement, nombre de pièces…")}{field("budget", "Budget et devise", "text", "Ex. 750 000 CHF")}{field("timeline", "Délai d’achat", "text", "Immédiat, 3 à 6 mois…")}{field("owner", "Responsable du suivi")}{field("language", "Langue de contact")}<label className="crm-field"><span>Statut</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProspectStatus })}>{prospectStatuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="crm-field"><span>Niveau d’intérêt</span><select value={draft.temperature} onChange={(event) => setDraft({ ...draft, temperature: event.target.value as Prospect["temperature"] })}>{Object.entries(temperatureLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{field("next_follow_up_at", "Prochaine relance", "datetime-local")}<label className="crm-field crm-full"><span>Demande initiale</span><textarea rows={3} maxLength={10000} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} /></label><label className="crm-field crm-full"><span>Notes de qualification</span><textarea rows={3} maxLength={10000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label></div>{draft.email && prospects.some((item) => item.id !== selectedId && item.email.toLowerCase() === draft.email.trim().toLowerCase()) && <p className="crm-warning">Ce courriel existe déjà dans ce projet. Vérifiez qu’il ne s’agit pas d’un doublon.</p>}{error && <p className="crm-error" role="alert">{error}</p>}<footer className="crm-dialog-actions"><button type="button" className="crm-button" onClick={() => setEditing(false)}>Annuler</button><button className="crm-button crm-primary" type="submit">{saving ? "Enregistrement…" : "Enregistrer le prospect"}</button></footer></fieldset></form></ProspectDialog>}
  </section>;
}

function ProspectDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog className="crm-dialog" ref={dialog} aria-labelledby="crm-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}><header><h3 id="crm-dialog-title">{title}</h3><button className="crm-icon-button" type="button" aria-label="Fermer" onClick={onClose}><X size={20} /></button></header>{children}</dialog>;
}
