import { redirect } from "next/navigation";

import { withLocalePath } from "@/lib/i18n";
import { getPreferredRequestLocale } from "@/lib/requestLocale";

export default async function LandingRedirectPage() {
  const locale = await getPreferredRequestLocale();
  redirect(withLocalePath(locale, "/landing"));
}
