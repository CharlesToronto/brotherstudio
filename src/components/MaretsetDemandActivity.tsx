"use client";

import { useState } from "react";

type MaretsetDemandActivityProps = {
  locale: "fr" | "en";
};

type DemandActivity = {
  activeRequests: number;
  lastRequestDate: Date;
  nextUpdateDate: Date;
};

const UPDATE_PATTERN_DAYS = [3, 5, 4, 3, 5, 4, 3];
const MIN_REQUESTS = 3;
const MAX_REQUESTS = 9;
const START_DATE_UTC = Date.UTC(2026, 6, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

function getDemandActivity(now = new Date()): DemandActivity {
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceStart = Math.max(0, Math.floor((nowUtc - START_DATE_UTC) / DAY_MS));

  let elapsedDays = 0;
  let updateIndex = 0;

  while (elapsedDays + UPDATE_PATTERN_DAYS[updateIndex % UPDATE_PATTERN_DAYS.length] <= daysSinceStart) {
    elapsedDays += UPDATE_PATTERN_DAYS[updateIndex % UPDATE_PATTERN_DAYS.length];
    updateIndex += 1;
  }

  const currentIntervalDays = UPDATE_PATTERN_DAYS[updateIndex % UPDATE_PATTERN_DAYS.length];
  const activeRequests = Math.min(MAX_REQUESTS, MIN_REQUESTS + updateIndex);
  const lastRequestDate = new Date(START_DATE_UTC + elapsedDays * DAY_MS);
  const nextUpdateDate = new Date(START_DATE_UTC + (elapsedDays + currentIntervalDays) * DAY_MS);

  return {
    activeRequests,
    lastRequestDate,
    nextUpdateDate,
  };
}

function formatDate(date: Date, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function MaretsetDemandActivity({ locale }: MaretsetDemandActivityProps) {
  const [activity] = useState<DemandActivity>(() => getDemandActivity());
  const isFr = locale === "fr";

  return (
    <section className="maretsetDemandActivity" aria-label={isFr ? "Activite des demandes" : "Inquiry activity"}>
      <article className="maretsetDemandActivityCard">
        <span>{isFr ? "Demandes en cours" : "Current inquiries"}</span>
        <strong>{activity.activeRequests}</strong>
        <p>
          {isFr
            ? "Activite indicative des acheteurs en phase de renseignement."
            : "Indicative activity from buyers in the information stage."}
        </p>
      </article>

      <article className="maretsetDemandActivityCard">
        <span>{isFr ? "Derniere demande" : "Latest inquiry"}</span>
        <strong>{formatDate(activity.lastRequestDate, locale)}</strong>
        <p>
          {isFr
            ? `Activite indicative, mise a jour autour du ${formatDate(activity.nextUpdateDate, locale)}.`
            : `Indicative activity, updated around ${formatDate(activity.nextUpdateDate, locale)}.`}
        </p>
      </article>
    </section>
  );
}
