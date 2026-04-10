import { notFound, redirect } from "next/navigation";

import { withLocalePath } from "@/lib/i18n";
import { getPreferredRequestLocale } from "@/lib/requestLocale";

const validSections = new Set(["call", "client", "script", "note"]);

type LegacyTeamSectionRedirectPageProps = {
  params: Promise<{ section: string }>;
};

export default async function LegacyTeamSectionRedirectPage({
  params,
}: LegacyTeamSectionRedirectPageProps) {
  const { section } = await params;

  if (!validSections.has(section)) {
    notFound();
  }

  const locale = await getPreferredRequestLocale();
  redirect(withLocalePath(locale, `/team/${section}`));
}
