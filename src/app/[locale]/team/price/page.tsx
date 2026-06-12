import Link from "next/link";

import { PricePackagesSection } from "@/components/PricePackagesSection";
import { getMessages } from "@/content/messages";
import { withLocalePath } from "@/lib/i18n";
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

      <PricePackagesSection
        title={messages.price.packagesTitle}
        titleId="teamPricePackagesTitle"
        packages={messages.price.packages}
        tabLabels={messages.price.packageTabLabels}
      />

      <section className="servicesSection" aria-labelledby="teamPriceImagesTitle">
        <h1 id="teamPriceImagesTitle" className="servicesTitle contactAccent">
          {messages.price.imagesTitle}
        </h1>
        {messages.price.intro ? (
          <p className="servicesIntro">{messages.price.intro}</p>
        ) : null}
        <ul className="servicesList" aria-label={messages.price.imagesTitle}>
          {messages.price.images.map((service) => (
            <li key={service.name} className="servicesItem servicesItemPriceRow">
              <span>{service.name}</span>
              <span className="servicesItemPriceValue">{service.price}</span>
            </li>
          ))}
        </ul>
        <p className="servicesNote">{messages.price.imageNote}</p>
      </section>

      <section className="servicesSection" aria-labelledby="teamPriceVideosTitle">
        <h2 id="teamPriceVideosTitle" className="servicesTitle contactAccent">
          {messages.price.videosTitle}
        </h2>
        <ul className="servicesList" aria-label={messages.price.videosTitle}>
          {standardVideos.map((video) => (
            <li key={video.name} className="servicesItem">
              <div className="servicesItemPriceRow">
                <span>{video.name}</span>
                {video.price ? (
                  <span className="servicesItemPriceValue">{video.price}</span>
                ) : null}
              </div>
              {video.options?.length ? (
                <ul className="servicesNestedList" aria-label={video.name}>
                  {video.options.map((option) => (
                    <li
                      key={`${video.name}-${option.name}`}
                      className="servicesNestedItem servicesItemPriceRow"
                    >
                      <span>{option.name}</span>
                      <span className="servicesItemPriceValue">{option.price}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {walkthroughVideos.length > 0 ? (
        <section className="servicesSection" aria-labelledby="teamPriceWalkthroughTitle">
          <h2 id="teamPriceWalkthroughTitle" className="servicesTitle contactAccent">
            {messages.price.walkthroughTitle}
          </h2>
          <ul className="servicesList" aria-label={messages.price.walkthroughTitle}>
            {walkthroughVideos.map((video) => (
              <li key={video.name} className="servicesItem">
                <div className="servicesItemPriceRow">
                  <span>{video.name}</span>
                  {video.price ? (
                    <span className="servicesItemPriceValue">{video.price}</span>
                  ) : null}
                </div>
                {video.options?.length ? (
                  <ul className="servicesNestedList" aria-label={video.name}>
                    {video.options.map((option) => (
                      <li
                        key={`${video.name}-${option.name}`}
                        className="servicesNestedItem servicesItemPriceRow"
                      >
                        <span>{option.name}</span>
                        <span className="servicesItemPriceValue">{option.price}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="servicesSection" aria-labelledby="teamPriceWebsiteTitle">
        <h2 id="teamPriceWebsiteTitle" className="servicesTitle contactAccent">
          {messages.price.websiteTitle}
        </h2>
        <ul className="servicesList" aria-label={messages.price.websiteTitle}>
          {messages.price.websites.map((item) => (
            <li key={item.name} className="servicesItem servicesItemPriceRow">
              <span>{item.name}</span>
              <span className="servicesItemPriceValue">{item.price}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="servicesSection servicesSectionWithDivider"
        aria-labelledby="teamPriceIncludedTitle"
      >
        <h2 id="teamPriceIncludedTitle" className="servicesTitle contactAccent">
          {messages.price.includedTitle}
        </h2>
        <ul className="servicesList" aria-label={`${messages.services.includedTitle} list`}>
          {messages.services.pricingIncludes.map((item) => (
            <li key={item} className="servicesItem">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="servicesSection" aria-labelledby="teamPricePartnershipTitle">
        <h2 id="teamPricePartnershipTitle" className="servicesTitle contactAccent">
          {messages.price.partnershipTitle}
        </h2>
        <ul className="servicesList" aria-label={messages.price.partnershipTitle}>
          {messages.price.partnerships.map((item) => (
            <li key={item} className="servicesItem">
              {item}
            </li>
          ))}
        </ul>
        <p className="servicesNote pricePartnershipNote">
          <em>{messages.price.partnershipNote}</em>
        </p>
      </section>

      <section className="servicesSection workflowCard" aria-labelledby="teamPriceWorkflowTitle">
        <h2 id="teamPriceWorkflowTitle" className="servicesTitle contactAccent">
          {messages.price.workflowTitle}
        </h2>
        <ul className="servicesList" aria-label={messages.price.workflowTitle}>
          <li className="servicesItem">
            {messages.price.workflowIncludesLabel}{" "}
            <Link className="workflowLink" href={withLocalePath(locale, "/mystudio")}>
              {messages.price.workflowLinkLabel}
            </Link>
          </li>
          <li className="servicesItem">{messages.price.workflowComingSoon}</li>
        </ul>
      </section>

      <p className="pageCta">
        <Link className="pageCtaInlineLink" href={withLocalePath(locale, "/contact")}>
          {messages.price.ctaText}
        </Link>
      </p>
    </div>
  );
}
