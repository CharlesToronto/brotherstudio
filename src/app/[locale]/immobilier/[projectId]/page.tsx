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
  const { locale: rawLocale, projectId } = await params;
  const locale = await resolveLocaleParam(Promise.resolve({ locale: rawLocale }));
  const project = await getEstateProperty(projectId, locale);
  const title = project ? `${project.title} — ${project.location}` : locale === "fr" ? "Projet immobilier à vendre" : "Real estate property for sale";
  const description = project?.description.slice(0, 155) ?? (locale === "fr" ? "Consultez les détails, images et documents de ce bien immobilier en Suisse romande." : "View the details, images and documents for this property in French-speaking Switzerland.");
  const pathname = `/immobilier/${projectId}`;
  const image = project?.images[0] ?? "/immobilier/monthey/vue-1.webp";

  return {
    title,
    description,
    robots: project ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: withLocalePath(locale, pathname), languages: getLanguageAlternates(pathname) },
    openGraph: { title, description, url: withLocalePath(locale, pathname), type: "website", images: [{ url: toAbsoluteUrl(image), alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [toAbsoluteUrl(image)] },
  };
}

export default async function RealEstateProjectPage({ params }: ProjectPageProps) {
  const { locale, projectId } = await params;
  const resolvedLocale = await resolveLocaleParam(Promise.resolve({ locale }));
  const project = await getEstateProperty(projectId, resolvedLocale);
  if (!project) notFound();
  const projectUrl = toAbsoluteUrl(withLocalePath(resolvedLocale, `/immobilier/${project.id}`));
  const imageUrls = project.images.slice(0, 8).map((image) => toAbsoluteUrl(image));
  const numericPrice = Number(project.price.replace(/[^0-9]/g, ""));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${projectUrl}#listing`,
        name: project.title,
        description: project.description,
        url: projectUrl,
        image: imageUrls,
        dateModified: project.updatedAt,
        inLanguage: resolvedLocale === "fr" ? "fr-CH" : "en-CH",
        address: { "@type": "PostalAddress", addressLocality: project.location, addressCountry: "CH" },
        ...(Number.isFinite(numericPrice) && numericPrice > 0 ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "CHF",
            price: numericPrice,
            availability: "https://schema.org/InStock",
            url: projectUrl,
          },
        } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: resolvedLocale === "fr" ? "Immobilier" : "Real estate", item: toAbsoluteUrl(withLocalePath(resolvedLocale, "/immobilier")) },
          { "@type": "ListItem", position: 2, name: resolvedLocale === "fr" ? "Biens immobiliers" : "Properties", item: toAbsoluteUrl(withLocalePath(resolvedLocale, "/immobilier/biens")) },
          { "@type": "ListItem", position: 3, name: project.title, item: projectUrl },
        ],
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <RealEstateProjectProfile locale={resolvedLocale} project={project} />
  </>;
}
