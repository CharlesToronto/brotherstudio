import type { MetadataRoute } from "next";

import { LOCALES, withLocalePath } from "@/lib/i18n";
import { toAbsoluteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

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

    for (const projectId of [
      "monthey-appartement-45",
      "illarsaz-appartement-4",
      "lens-appartement-45",
      "lens-appartement-35",
      "morgins-chalet",
      "lens-villa-construire",
      "ollon-maison-renover",
      "soleure-terrain",
      "chamoson-terrain",
      "valais-central-terrain",
      "morgins-raccard",
      "val-de-bagnes-grange",
      "saviese-mayen",
      "corps-ferme-fribourgeois",
    ]) {
      entries.push({
        url: toAbsoluteUrl(withLocalePath(locale, `/immobilier/${projectId}`)),
        lastModified: now,
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
