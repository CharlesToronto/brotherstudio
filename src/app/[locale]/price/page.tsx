import type { Metadata } from "next";

import { PriceOfferTabs } from "@/components/PriceOfferTabs";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getMessages } from "@/content/messages";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocalePricePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePricePageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/price";

  return {
    title: messages.price.title,
    description: messages.price.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.price.title,
      description: messages.price.openGraphDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.price.title,
      description: messages.price.openGraphDescription,
    },
  };
}

export default async function LocalizedPricePage({
  params,
}: LocalePricePageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const walkthroughVideos = messages.price.videos.filter(
    (video) => video.subsectionTitle === messages.price.walkthroughTitle,
  );
  const standardVideos = messages.price.videos.filter(
    (video) => video.subsectionTitle !== messages.price.walkthroughTitle,
  );

  return (
    <main className="siteMain">
      <div className="servicesLayout">
        {messages.price.intro ? (
          <ScrollReveal as="p" className="homeIntro homeIntroHighlight">
            {messages.price.intro}
          </ScrollReveal>
        ) : null}

        <ScrollReveal
          as="div"
          delay={20}
        >
          <PriceOfferTabs
            packagesTitle={messages.price.packagesTitle}
            packagesTitleId="pricePackagesTitle"
            packages={messages.price.packages}
            includedLabel={messages.price.packageIncludedLabel}
            deliveryLabel={messages.price.packageDeliveryLabel}
            classicLabel="Prix classique"
            classicTitleId="priceClassicTitle"
            imageTitle={messages.price.imagesTitle}
            imageNote={messages.price.imageNote}
            images={messages.price.images}
            videoTitle={messages.price.videosTitle}
            videos={standardVideos}
            walkthroughTitle={messages.price.walkthroughTitle}
            walkthroughs={walkthroughVideos}
            websiteTitle={messages.price.websiteTitle}
            websites={messages.price.websites}
            adsTitle={messages.price.adsTitle}
            ads={messages.price.ads}
          />
        </ScrollReveal>
      </div>
    </main>
  );
}
