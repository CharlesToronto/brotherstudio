import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getLanguageAlternates, type Locale, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

type StudioTool = {
  name: string;
  description: string;
  href: string;
  external?: boolean;
  visual: "review" | "fileflow" | "wallis";
};

function getStudioTools(locale: Locale): StudioTool[] {
  return [
    {
      name: "MyReview™",
      description:
        locale === "fr"
          ? "Validez vos projets avec vos clients."
          : "Review your projects with your clients.",
      href: "/myreview",
      visual: "review",
    },
    {
      name: "FileFlow™",
      description:
        locale === "fr"
          ? "Modifiez et partagez vos fichiers."
          : "Edit and share your files.",
      href: "https://fileflow.brotherstudio.ca/",
      external: true,
      visual: "fileflow",
    },
    {
      name: "MyWallis™",
      description:
        locale === "fr"
          ? "Trouvez les informations de vos parcelles."
          : "Find information about your parcels.",
      href: "https://mywallis.vercel.app/",
      external: true,
      visual: "wallis",
    },
  ];
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const title = "MyStudio";
  const description =
    locale === "fr"
      ? "Les outils BrotherStudio réunis dans un seul espace."
      : "BrotherStudio tools gathered in one space.";

  return {
    title,
    description,
    alternates: {
      canonical: withLocalePath(locale, "/mystudio"),
      languages: getLanguageAlternates("/mystudio"),
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, "/mystudio"),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
  };
}

function ToolVisual({ type }: { type: StudioTool["visual"] }) {
  if (type === "review") {
    return (
      <div className="myStudioVisual myStudioVisualReview">
        <Image
          src="/myreview-cover-v2.webp"
          alt=""
          fill
          sizes="(max-width: 780px) 100vw, 32vw"
        />
      </div>
    );
  }

  if (type === "fileflow") {
    return (
      <div className="myStudioVisual myStudioVisualFileflow" aria-hidden="true">
        <Image
          src="/fileflow-cover.webp"
          alt=""
          fill
          sizes="(max-width: 780px) 100vw, 32vw"
        />
      </div>
    );
  }

  return (
    <div className="myStudioVisual myStudioVisualWallis" aria-hidden="true">
      <Image
        src="/mywallis-cover.webp"
        alt=""
        fill
        sizes="(max-width: 780px) 100vw, 32vw"
      />
    </div>
  );
}

export default async function MyStudioPage({ params }: LocalePageProps) {
  const locale = await resolveLocaleParam(params);
  const isFrench = locale === "fr";
  const tools = getStudioTools(locale);

  return (
    <main className="siteMain myStudioPage">
      <section className="myStudioShell" aria-labelledby="myStudioTitle">
        <header className="myStudioHeader">
          <p>{isFrench ? "Les outils BrotherStudio" : "BrotherStudio tools"}</p>
          <h1 id="myStudioTitle">MyStudio</h1>
          <span>{isFrench ? "Vos outils. Un seul espace." : "Your tools. One space."}</span>
        </header>

        <div className="myStudioGrid">
          {tools.map((tool) => {
            const card = (
              <>
                <ToolVisual type={tool.visual} />
                <div className="myStudioCardContent">
                  <div>
                    <h2>{tool.name}</h2>
                    <p>{tool.description}</p>
                  </div>
                  <span className="myStudioDiscover">
                    {isFrench ? "Découvrir" : "Discover"}
                  </span>
                </div>
              </>
            );

            return tool.external ? (
              <a
                key={tool.name}
                className="myStudioCard"
                href={tool.href}
                target="_blank"
                rel="noreferrer"
              >
                {card}
              </a>
            ) : (
              <Link key={tool.name} className="myStudioCard" href={tool.href}>
                {card}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
