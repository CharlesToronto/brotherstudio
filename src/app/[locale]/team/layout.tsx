import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import { TeamSectionNav } from "@/components/TeamSectionNav";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/team/call";

  return {
    title: locale === "fr" ? "Equipe" : "Team",
    description:
      locale === "fr"
        ? "Outil interne pour l'equipe commerciale telephonique."
        : "Internal workspace for the calling team.",
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

export default async function LocaleTeamLayout({
  children,
  params,
}: LocaleTeamLayoutProps) {
  const locale = await resolveLocaleParam(params);

  return (
    <main className="siteMain teamPage">
      <AdminLockOverlay title="Accès Team" storageKey="bs_team_unlocked" />
      <div className="teamShell">
        <aside className="teamSidebar" aria-label="Team navigation">
          <TeamSectionNav locale={locale} />
        </aside>
        <div className="teamContent">{children}</div>
      </div>
    </main>
  );
}
