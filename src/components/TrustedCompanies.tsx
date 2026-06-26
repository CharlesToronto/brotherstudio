import type { Locale } from "@/lib/i18n";

type TrustedCompaniesProps = {
  locale: Locale;
};

const placeholderLogos = [
  { name: "NORTH", mark: "N", detail: "Architecture" },
  { name: "ATELIER 04", mark: "A4", detail: "Design studio" },
  { name: "FORM", mark: "F", detail: "Real estate" },
  { name: "HABITAT", mark: "H", detail: "Development" },
  { name: "AXIS", mark: "AX", detail: "Construction" },
  { name: "MONOLITH", mark: "M", detail: "Architecture" },
  { name: "STUDIO 27", mark: "27", detail: "Interiors" },
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
              {placeholderLogos.map((logo) => (
                <article
                  key={`${groupIndex}-${logo.name}`}
                  className="trustedCompaniesLogoCard"
                >
                  <span className="trustedCompaniesLogoMark">{logo.mark}</span>
                  <span className="trustedCompaniesLogoCopy">
                    <strong>{logo.name}</strong>
                    <small>{logo.detail}</small>
                  </span>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
