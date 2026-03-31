import type { Metadata } from "next";

import { TeamNotesPanel } from "@/components/TeamWorkspace";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamNotesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleTeamNotesPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/team/note";

  return {
    title: locale === "fr" ? "Note" : "Note",
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LocalizedTeamNotesPage({
  params,
}: LocaleTeamNotesPageProps) {
  const locale = await resolveLocaleParam(params);

  return <TeamNotesPanel locale={locale} />;
}
