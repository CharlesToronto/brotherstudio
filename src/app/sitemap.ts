import type { MetadataRoute } from "next";

import { getEstateProperties } from "@/lib/estateServer";
import { LOCALES, withLocalePath } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  let properties: Awaited<ReturnType<typeof getEstateProperties>> = [];
  try {
    properties = await getEstateProperties("fr");
  } catch {
    // Keep the static sitemap available during builds without production credentials.
  }

  for (const locale of LOCALES) {
    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/")),
      lastModified: now,
      changeFrequency: "weekly",
      priority: locale === "en" ? 1 : 0.9,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/price")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/immobilier")),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/immobilier/biens")),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/immobilier/calculateur-hypothecaire")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/immobilier/commercialisation")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/immobilier/vendre")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    });

    for (const property of properties) {
      const updatedAt = new Date(property.updatedAt);
      entries.push({
        url: toAbsoluteUrl(withLocalePath(locale, `/immobilier/${property.id}`)),
        lastModified: Number.isNaN(updatedAt.getTime()) ? now : updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/about")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/contact")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/mywebsite")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/mystudio")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/mywebsite/maretset")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.62,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/mywebsite/plantaz")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.62,
    });
  }

  return entries;
}
