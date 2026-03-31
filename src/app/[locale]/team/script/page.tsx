import type { Metadata } from "next";

import { TeamScriptPanel } from "@/components/TeamWorkspace";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamScriptPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleTeamScriptPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/team/script";

  return {
    title: locale === "fr" ? "Script" : "Script",
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

export default async function LocalizedTeamScriptPage({
  params,
}: LocaleTeamScriptPageProps) {
  const locale = await resolveLocaleParam(params);

  return <TeamScriptPanel locale={locale} />;
}
