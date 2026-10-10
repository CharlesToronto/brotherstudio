"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import styles from "./MortgageCalculator.module.css";

type MortgageCalculatorProps = {
  locale: Locale;
  initialPrice?: number;
  propertyLabel?: string;
  embedded?: boolean;
};

const RATE_OPTIONS = [
  { id: "saron", label: "SARON", rate: 0.011 },
  { id: "fixed5", label: "Fixe 5 ans", rate: 0.018 },
  { id: "fixed10", label: "Fixe 10 ans", rate: 0.02 },
] as const;

function parseAmount(value: string) {
  const amount = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CH" : "en-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MortgageCalculator({ locale, initialPrice, propertyLabel, embedded = false }: MortgageCalculatorProps) {
  const isFrench = locale === "fr";
  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : "");
  const [equity, setEquity] = useState(initialPrice ? String(Math.round(initialPrice * 0.2)) : "");
  const [income, setIncome] = useState("");
  const [rateId, setRateId] = useState<(typeof RATE_OPTIONS)[number]["id"]>("fixed5");
  const priceAmount = parseAmount(price);
  const equityAmount = parseAmount(equity);
  const incomeAmount = parseAmount(income);
  const selectedRate = RATE_OPTIONS.find((option) => option.id === rateId) ?? RATE_OPTIONS[1];

  const calculation = useMemo(() => {
    const maxLoanByValue = priceAmount * 0.8;
    const requestedLoan = Math.max(priceAmount - equityAmount, 0);
    const loan = Math.min(requestedLoan, maxLoanByValue);
    const secondMortgage = Math.max(loan - priceAmount * (2 / 3), 0);
    const amortization = secondMortgage / 15;
    const maintenance = priceAmount * 0.01;
    const annualInterest = loan * selectedRate.rate;
    const monthlyCost = (annualInterest + amortization + maintenance) / 12;
    const stressCosts = loan * 0.05 + amortization + maintenance;
    const affordability = incomeAmount > 0 ? stressCosts / incomeAmount : null;
    return {
      loan,
      minimumEquity: priceAmount * 0.2,
      secondMortgage,
      monthlyCost,
      affordability,
      stressCosts,
    };
  }, [equityAmount, incomeAmount, priceAmount, selectedRate]);

  const hasPrice = priceAmount > 0;
  const hasIncome = incomeAmount > 0;
  const isAffordable = calculation.affordability !== null && calculation.affordability <= 1 / 3;
  const calculatorHref = {
    pathname: withLocalePath(locale, "/immobilier/calculateur-hypothecaire"),
    query: { ...(initialPrice ? { price: initialPrice } : {}), ...(propertyLabel ? { property: propertyLabel } : {}) },
  };
  const calculatorCard = (
    <section className={styles.card} data-mortgage-calculator aria-label={isFrench ? "Calculateur hypothécaire" : "Mortgage calculator"}>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <h2>{isFrench ? "Votre projet" : "Your project"}</h2>
        <p className={styles.formIntro}>{isFrench ? "Les champs sont indicatifs et ne constituent pas une demande de crédit." : "The fields are indicative and do not constitute a credit application."}</p>
        <div className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="mortgage-price">{isFrench ? "Prix du bien" : "Property price"}</label>
            <input id="mortgage-price" type="number" min="0" step="1000" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="CHF" />
          </div>
          <div className={styles.field}>
            <label htmlFor="mortgage-equity">{isFrench ? "Fonds propres" : "Equity"}</label>
            <input id="mortgage-equity" type="number" min="0" step="1000" inputMode="decimal" value={equity} onChange={(event) => setEquity(event.target.value)} placeholder="CHF" />
          </div>
          <div className={styles.field}>
            <label htmlFor="mortgage-income">{isFrench ? "Revenu brut annuel" : "Annual gross income"}</label>
            <input id="mortgage-income" type="number" min="0" step="1000" inputMode="decimal" value={income} onChange={(event) => setIncome(event.target.value)} placeholder="CHF" />
          </div>
        </div>
        <div className={styles.rateGroup}>
          <span className={styles.rateLabel}>{isFrench ? "Modèle de taux" : "Rate model"}</span>
          <div className={styles.rateOptions} role="radiogroup" aria-label={isFrench ? "Modèle de taux" : "Rate model"}>
            {RATE_OPTIONS.map((option) => <button key={option.id} className={styles.rateButton} type="button" role="radio" aria-checked={rateId === option.id} data-active={rateId === option.id ? "true" : "false"} onClick={() => setRateId(option.id)}><strong>{option.label}</strong>{(option.rate * 100).toFixed(2)} %</button>)}
          </div>
        </div>
        <button className={styles.submit} type="button" onClick={() => document.getElementById("mortgage-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}>{isFrench ? "Voir l’estimation" : "See estimate"}<ArrowUpRight aria-hidden="true" size={16} /></button>
      </form>

      <section className={styles.results} id="mortgage-results" aria-live="polite" aria-labelledby="mortgage-results-title">
        <h2 id="mortgage-results-title">{isFrench ? "Votre estimation" : "Your estimate"}</h2>
        <p className={styles.resultsIntro}>{hasPrice ? (isFrench ? "Calcul basé sur une limite indicative de 80 % de financement." : "Calculation based on an indicative 80% financing limit.") : (isFrench ? "Saisissez le prix du bien pour commencer." : "Enter the property price to begin.")}</p>
        <div className={styles.metrics}>
          <div className={styles.metric}><span>{isFrench ? "Hypothèque estimée" : "Estimated mortgage"}</span><strong>{formatMoney(calculation.loan, locale)}</strong></div>
          <div className={styles.metric}><span>{isFrench ? "Fonds propres minimum" : "Minimum equity"}</span><strong>{formatMoney(calculation.minimumEquity, locale)}</strong></div>
          <div className={styles.metric}><span>{isFrench ? "Coût mensuel indicatif" : "Indicative monthly cost"}</span><strong>{formatMoney(calculation.monthlyCost, locale)}</strong></div>
          <div className={styles.metric}><span>{isFrench ? "Deuxième hypothèque" : "Second mortgage"}</span><strong>{formatMoney(calculation.secondMortgage, locale)}</strong></div>
        </div>
        {hasIncome ? <div className={styles.status} data-ok={isAffordable ? "true" : "false"}><strong>{isAffordable ? (isFrench ? "Capacité indicative respectée" : "Indicative affordability respected") : (isFrench ? "Capacité indicative dépassée" : "Indicative affordability exceeded")}</strong>{isFrench ? `Charges théoriques : ${formatMoney(calculation.stressCosts, locale)} / an (${Math.round((calculation.affordability ?? 0) * 100)} % du revenu brut).` : `Theoretical costs: ${formatMoney(calculation.stressCosts, locale)} / year (${Math.round((calculation.affordability ?? 0) * 100)}% of gross income).`}</div> : null}
        <p className={styles.note}>{isFrench ? "Taux indicatifs à confirmer auprès d’un établissement financier. L’analyse réelle dépend notamment de la valeur de nantissement, de votre situation et des critères de la banque." : "Indicative rates must be confirmed with a financial institution. The final assessment depends on the lending value, your situation and the lender’s criteria."}</p>
        <Link className={styles.backLink} href={calculatorHref}>{embedded ? (isFrench ? "Ouvrir le calculateur complet" : "Open full calculator") : (isFrench ? "Réinitialiser le calcul" : "Reset calculation")}</Link>
      </section>
    </section>
  );

  if (embedded) {
    return <div className={styles.embedded}>{calculatorCard}</div>;
  }

  return (
    <main className={`siteMain realEstateSitePage ${styles.page}`}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumbs} aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}>
          <Link href={withLocalePath(locale, "/immobilier/biens")}><ChevronLeft aria-hidden="true" size={14} /> {isFrench ? "Nos biens" : "Our properties"}</Link>
          <span aria-hidden="true">/</span>
          <span>{isFrench ? "Calculateur hypothécaire" : "Mortgage calculator"}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{isFrench ? "Financement immobilier" : "Property financing"}</p>
            <h1>{isFrench ? "Votre capacité de financement." : "Your financing capacity."}</h1>
            <p className={styles.intro}>{isFrench ? "Une première estimation simple pour préparer votre projet immobilier en Suisse." : "A simple first estimate to prepare your Swiss property project."}</p>
          </div>
          {propertyLabel ? <p className={styles.propertyHint}>{isFrench ? "Bien sélectionné" : "Selected property"}<strong>{propertyLabel}</strong></p> : null}
        </header>

        {calculatorCard}
      </div>
    </main>
  );
}
