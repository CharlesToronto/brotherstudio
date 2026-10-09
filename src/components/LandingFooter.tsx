import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import styles from "./LandingFooter.module.css";

export function LandingFooter({ locale }: { locale: Locale }) {
  const isFrench = locale === "fr";
  return (
    <footer id="site-footer" className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Link className={styles.logo} href={`/${locale}/immobilier`}>{locale === "fr" ? "brother studio immobilier." : "brother studio real estate."}</Link>
          <p>{isFrench ? "De l’estimation à la vente de votre bien." : "From valuation to the sale of your property."}</p>
        </div>
        <nav aria-label={isFrench ? "Navigation de bas de page" : "Footer navigation"}>
          <Link href={`/${locale}/immobilier/biens`}>{isFrench ? "Voir nos biens" : "View our properties"}<ArrowUpRight size={15} aria-hidden="true" /></Link>
          <a href="#contact">{isFrench ? "Demander une estimation" : "Request a valuation"}</a>
          <a href="#booking">{isFrench ? "Prendre rendez-vous" : "Book a meeting"}</a>
          <a href="#faq">{isFrench ? "Questions fréquentes" : "Frequently asked questions"}</a>
        </nav>
        <div className={styles.contact}>
          <p>Contact</p>
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          <a href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>{site.contact.phone}</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} {locale === "fr" ? "Brother Studio Immobilier" : "Brother Studio Real Estate"}</span>
        <a href="#valuation-funnel">{isFrench ? "Retour en haut ↑" : "Back to top ↑"}</a>
      </div>
    </footer>
  );
}

