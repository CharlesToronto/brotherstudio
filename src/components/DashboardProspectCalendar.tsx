"use client";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { isOpenProspect, valuationDateKey, type ValuationRequest } from "@/lib/valuationRequests";

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`));
}
export function shiftMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}
export type CalendarMode = "received" | "followup";
export function DashboardProspectCalendar({ requests, month, selectedDay, mode, onMonth, onDay, onMode }: {
  requests: ValuationRequest[]; month: string; selectedDay: string | null; mode: CalendarMode;
  onMonth: (month: string) => void; onDay: (day: string | null) => void; onMode: (mode: CalendarMode) => void;
}) {
  const start = new Date(`${month}-01T12:00:00Z`);
  const leadingDays = (start.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const counts = new Map<string, { received: number; followup: number }>();
  for (const request of requests) {
    const day = valuationDateKey(request.created_at);
    const received = counts.get(day) ?? { received: 0, followup: 0 };
    received.received++;
    counts.set(day, received);
    if (request.next_follow_up && isOpenProspect(request)) {
      const followup = counts.get(request.next_follow_up) ?? { received: 0, followup: 0 };
      followup.followup++;
      counts.set(request.next_follow_up, followup);
    }
  }
  const today = valuationDateKey(new Date());
  return <section className="prospectCalendar" aria-label="Calendrier mensuel des prospects">
    <div className="prospectCalendarHeader">
      <div><p className="valuationEyebrow">Calendrier mensuel</p><h3><CalendarDays size={22} aria-hidden="true" />{monthLabel(month)}</h3></div>
      <div className="prospectMonthActions">
        <button type="button" aria-label="Mois précédent" onClick={() => onMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => { onMonth(today.slice(0, 7)); onDay(null); }}>Aujourd’hui</button>
        <button type="button" aria-label="Mois suivant" onClick={() => onMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
      </div>
    </div>
    <div className="prospectCalendarControls">
      <div className="prospectModeSwitch" aria-label="Événements du calendrier">
        <button type="button" aria-pressed={mode === "received"} onClick={() => onMode("received")}>Formulaires reçus</button>
        <button type="button" aria-pressed={mode === "followup"} onClick={() => onMode("followup")}>Relances à faire</button>
      </div>
      {selectedDay ? <button type="button" className="prospectClearDay" onClick={() => onDay(null)}>Effacer le jour sélectionné</button> : null}
    </div>
    <div className="prospectCalendarGrid">
      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => <span className="prospectWeekday" key={day}>{day}</span>)}
      {Array.from({ length: cellCount }, (_, index) => {
        const day = index - leadingDays + 1;
        if (day < 1 || day > daysInMonth) return <div key={index} className="prospectCalendarBlank" aria-hidden="true" />;
        const key = `${month}-${String(day).padStart(2, "0")}`;
        const count = counts.get(key) ?? { received: 0, followup: 0 };
        const label = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
        return <button type="button" key={key} className="prospectCalendarDay" data-today={today === key} aria-pressed={selectedDay === key}
          aria-label={`${label} : ${count.received} formulaire${count.received > 1 ? "s" : ""}, ${count.followup} relance${count.followup > 1 ? "s" : ""}`}
          onClick={() => onDay(selectedDay === key ? null : key)}>
          <span className="prospectDayNumber">{day}</span>
          {count[mode] > 0 ? <span className={`prospectDayCount ${mode === "followup" ? "is-followup" : ""}`}><strong>{count[mode]}</strong><span>{mode === "received" ? "reçu" : "relance"}{count[mode] > 1 ? "s" : ""}</span></span> : null}
          {mode === "received" && count.followup > 0 ? <span className="prospectFollowupDot" title={`${count.followup} relance(s)`} /> : null}
        </button>;
      })}
    </div>
    <p className="prospectCalendarHint">Cliquez sur un jour pour afficher {mode === "received" ? "les formulaires reçus" : "les prospects à relancer"}. Comptage selon les filtres · heure de Toronto.</p>
  </section>;
}
