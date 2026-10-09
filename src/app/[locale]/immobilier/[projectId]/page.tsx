import { getEstateProperty } from "@/lib/estateServer";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";

import { RealEstateProjectProfile } from "@/components/RealEstateProjectProfile";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type ProjectPageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale, projectId } = await params.then(async ({ locale: rawLocale, projectId: rawProjectId }) => ({
    locale: await resolveLocaleParam(Promise.resolve({ locale: rawLocale })),
    projectId: rawProjectId,
  }));
  const title = locale === "fr" ? "Projet immobilier à vendre" : "Real estate property for sale";
  const description = locale === "fr" ? "Consultez les détails, images et documents de ce bien immobilier en Suisse romande." : "View the details, images and documents for this property in French-speaking Switzerland.";
  const pathname = `/immobilier/${projectId}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title, description, url: withLocalePath(locale, pathname), type: "website", images: [{ url: toAbsoluteUrl("/immobilier/monthey/vue-1.webp"), alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [toAbsoluteUrl("/immobilier/monthey/vue-1.webp")] },
  };
}

export default async function RealEstateProjectPage({ params }: ProjectPageProps) {
  const { locale, projectId } = await params;
  const resolvedLocale = await resolveLocaleParam(Promise.resolve({ locale }));
  const project = await getEstateProperty(projectId, resolvedLocale);
  if (!project) notFound();
  return <RealEstateProjectProfile locale={resolvedLocale} project={project} />;
}
