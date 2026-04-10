import type { Metadata } from "next";

import { TeamCallPanel } from "@/components/TeamWorkspace";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamCallPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleTeamCallPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/team/call";

  return {
    title: locale === "fr" ? "Call" : "Call",
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

export default async function LocalizedTeamCallPage({
  params,
}: LocaleTeamCallPageProps) {
  const locale = await resolveLocaleParam(params);

  return <TeamCallPanel locale={locale} />;
}
