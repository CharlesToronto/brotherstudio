import { redirect } from "next/navigation";
import { withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleParam(params);
  redirect(withLocalePath(locale, "/immobilier/vendre"));
}
