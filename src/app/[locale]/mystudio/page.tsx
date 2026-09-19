import type { Metadata } from "next";

import {
  MyStudioToolsCarousel,
  type MyStudioTool,
} from "@/components/MyStudioToolsCarousel";
import { getLanguageAlternates, type Locale, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

function getStudioTools(locale: Locale): MyStudioTool[] {
  return [
    {
      name: "MyReview™",
      description:
        locale === "fr"
          ? "Demandes de modification et références client."
          : "Edit requests and client references.",
      href: "/myreview",
      visual: "review",
    },
    {
      name: "FileFlow™",
      description:
        locale === "fr"
          ? "Envoyez, convertissez et compressez vos documents."
          : "Send, Convert, and Compress your documents",
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

        <MyStudioToolsCarousel tools={tools} isFrench={isFrench} />
      </section>
    </main>
  );
}
