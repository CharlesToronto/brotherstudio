import { PriceOfferTabs } from "@/components/PriceOfferTabs";
import { getMessages } from "@/content/messages";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleTeamPricePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedTeamPricePage({
  params,
}: LocaleTeamPricePageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const walkthroughVideos = messages.price.videos.filter(
    (video) => video.subsectionTitle === messages.price.walkthroughTitle,
  );
  const standardVideos = messages.price.videos.filter(
    (video) => video.subsectionTitle !== messages.price.walkthroughTitle,
  );

  return (
    <div className="servicesLayout">
      {messages.price.intro ? (
        <p className="homeIntro homeIntroHighlight">{messages.price.intro}</p>
      ) : null}

      <PriceOfferTabs
        packagesTitle={messages.price.packagesTitle}
        packagesTitleId="teamPricePackagesTitle"
        packages={messages.price.packages}
        includedLabel={messages.price.packageIncludedLabel}
        deliveryLabel={messages.price.packageDeliveryLabel}
        classicLabel="Prix classique"
        classicTitleId="teamPriceClassicTitle"
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
    </div>
  );
}
