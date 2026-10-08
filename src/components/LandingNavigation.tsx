"use client";

import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { useRef } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./LandingNavigation.module.css";

export function LandingNavigation({ locale }: { locale: Locale }) {
  const isFrench = locale === "fr";
  const menuRef = useRef<HTMLDetailsElement>(null);
  const links = [
    { href: "#services", label: isFrench ? "Notre accompagnement" : "Our services" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link className={styles.logo} href={`/${locale}/immobilier`} aria-label="Brother Studio Immobilier">
            <span>brother studio</span>{" "}<span>immobilier.</span>
          </Link>
        </div>
        <nav className={styles.desktopNav} aria-label={isFrench ? "Navigation de la page" : "Page navigation"}>
          {links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className={styles.actions}>
          <Link className={styles.listings} href={`/${locale}/immobilier/biens`}>
            {isFrench ? "Voir nos biens" : "View our properties"}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <a className={styles.booking} href="#contact"><span className={styles.desktopLabel}>{isFrench ? "Estimer mon bien gratuitement" : "Get my free valuation"}</span><span className={styles.mobileLabel}>{isFrench ? "Estimation gratuite" : "Free valuation"}</span><ArrowUpRight size={16} aria-hidden="true" /></a>
          <details className={styles.mobileMenu} ref={menuRef} onKeyDown={event => { if (event.key === "Escape" && menuRef.current) { menuRef.current.open = false; menuRef.current.querySelector("summary")?.focus(); } }}>
            <summary aria-label={isFrench ? "Menu de navigation" : "Navigation menu"}><Menu size={22} aria-hidden="true" /></summary>
            <nav className={styles.dropdown} aria-label={isFrench ? "Navigation mobile" : "Mobile navigation"}>
              {links.map(link => <a key={link.href} href={link.href} onClick={() => { if (menuRef.current) menuRef.current.open = false; }}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></a>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
