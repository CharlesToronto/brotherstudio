import type { Metadata } from "next";

import { Gallery } from "@/components/Gallery";
import { getMessages } from "@/content/messages";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

export const dynamic = "force-dynamic";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/";

  return {
    title: {
      absolute: messages.home.metadataTitle,
    },
    description: messages.home.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.home.metadataTitle,
      description: messages.home.metadataDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.home.metadataTitle,
      description: messages.home.metadataDescription,
    },
  };
}

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  await resolveLocaleParam(params);
  const items = await getGalleryItems();

  return (
    <main className="siteMain">
      <Gallery items={items} />
    </main>
  );
}
