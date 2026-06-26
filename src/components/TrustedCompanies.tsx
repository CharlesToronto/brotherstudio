import Image from "next/image";

import type { Locale } from "@/lib/i18n";

type TrustedCompaniesProps = {
  locale: Locale;
};

const trustedLogos = [
  { name: "Bon Plan", src: "/trusted-logos/1.png" },
  { name: "Bner", src: "/trusted-logos/2.png" },
  { name: "Buildner", src: "/trusted-logos/3.png" },
  { name: "Courtage Immobilier", src: "/trusted-logos/4.png" },
  { name: "SPC", src: "/trusted-logos/5.png" },
  { name: "Batiplus", src: "/trusted-logos/6.png" },
  { name: "Pearlman", src: "/trusted-logos/7.png" },
] as const;

export function TrustedCompanies({ locale }: TrustedCompaniesProps) {
  const copy =
    locale === "fr"
      ? {
          eyebrow: "Collaborations",
          title: "Ils nous font confiance",
          text: "Architectes, promoteurs et studios utilisent nos visuels pour donner vie à leurs projets.",
          ariaLabel: "Entreprises qui font confiance à BrotherStudio",
        }
      : {
          eyebrow: "Collaborations",
          title: "Trusted by",
          text: "Architects, developers, and studios use our visuals to bring their projects to life.",
          ariaLabel: "Companies that trust BrotherStudio",
        };

  return (
    <section className="trustedCompanies" aria-labelledby="trustedCompaniesTitle">
      <div className="trustedCompaniesIntro">
        <p>{copy.eyebrow}</p>
        <h2 id="trustedCompaniesTitle">{copy.title}</h2>
        <span>{copy.text}</span>
      </div>

      <div className="trustedCompaniesViewport" aria-label={copy.ariaLabel}>
        <div className="trustedCompaniesTrack">
          {[0, 1].map((groupIndex) => (
            <div
              key={groupIndex}
              className="trustedCompaniesLogoGroup"
              aria-hidden={groupIndex === 1 ? "true" : undefined}
            >
              {trustedLogos.map((logo) => (
                <article
                  key={`${groupIndex}-${logo.name}`}
                  className="trustedCompaniesLogoCard"
                >
                  <Image
                    className="trustedCompaniesLogoImage"
                    src={logo.src}
                    alt={logo.name}
                    width={320}
                    height={180}
                    sizes="(max-width: 768px) 160px, 220px"
                  />
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
