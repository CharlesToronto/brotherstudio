import type { ReactNode } from "react";

import { LOCALES } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  await resolveLocaleParam(params);
  return children;
}
