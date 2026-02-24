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
      url: toAbsoluteUrl(withLocalePath(locale, "/services")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });

    entries.push({
      url: toAbsoluteUrl(withLocalePath(locale, "/contact")),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
