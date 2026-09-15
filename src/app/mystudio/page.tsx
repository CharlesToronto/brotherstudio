import { redirect } from "next/navigation";
import { withLocalePath } from "@/lib/i18n";
import { getPreferredRequestLocale } from "@/lib/requestLocale";

export const dynamic = "force-dynamic";

export default async function LegacyMyStudioAccessPage() {
  const locale = await getPreferredRequestLocale();
  redirect(withLocalePath(locale, "/mystudio"));
}
