import { redirect } from "next/navigation";

import { withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedTeamPage({
  params,
}: LocaleTeamPageProps) {
  const locale = await resolveLocaleParam(params);
  redirect(withLocalePath(locale, "/team/client"));
}
