import { redirect } from "next/navigation";

import { withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleServicesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedServicesPage({
  params,
}: LocaleServicesPageProps) {
  const locale = await resolveLocaleParam(params);
  redirect(withLocalePath(locale, "/price"));
}
