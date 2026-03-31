import type { Metadata } from "next";

import { TeamClientsPanel } from "@/components/TeamWorkspace";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamClientsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleTeamClientsPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/team/client";

  return {
    title: locale === "fr" ? "Client" : "Client",
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

export default async function LocalizedTeamClientsPage({
  params,
}: LocaleTeamClientsPageProps) {
  const locale = await resolveLocaleParam(params);

  return <TeamClientsPanel locale={locale} />;
}
