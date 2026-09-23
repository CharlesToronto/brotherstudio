"use client";

import { useState } from "react";

type PlantazPlan = {
  id: string;
  title: string;
  filename: string;
  url: string;
};

export function PlantazPlansCarousel({ plans }: { plans: PlantazPlan[] }) {
  const [activePlan, setActivePlan] = useState(0);

  if (!plans.length) return <p className="plantazMuted">Les plans seront disponibles prochainement.</p>;

  return (
    <div className="plantazPlansCarousel">
      <div className="plantazPlansTabs" role="tablist" aria-label="Documents Plantaz">
        {plans.map((plan, index) => (
          <button key={plan.id} type="button" role="tab" aria-selected={activePlan === index} className={activePlan === index ? "is-active" : ""} onClick={() => setActivePlan(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{plan.title || plan.filename}</strong>
          </button>
        ))}
      </div>
      <div className="plantazPlanList">
        {plans.map((plan, index) => (
          <a key={plan.id} className={activePlan === index ? "is-active" : ""} href={plan.url} target="_blank" rel="noreferrer">
            <span>PDF</span><strong>{plan.title || plan.filename}</strong><small>Télécharger le document ↗</small>
          </a>
        ))}
      </div>
    </div>
  );
}
