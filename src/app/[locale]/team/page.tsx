import { TeamCallWorkspace } from "@/components/TeamCallWorkspace";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedTeamPage({
  params,
}: LocaleTeamPageProps) {
  const locale = await resolveLocaleParam(params);
  return <TeamCallWorkspace locale={locale} />;
}
