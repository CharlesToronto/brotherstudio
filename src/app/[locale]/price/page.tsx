import type { Metadata } from "next";
import Link from "next/link";

import { PriceAccessGate } from "@/components/PriceAccessGate";
import { PricePackagesSection } from "@/components/PricePackagesSection";
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
      <PriceAccessGate messages={messages.price} fallbackHref={withLocalePath(locale, "/")}>
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
            <PricePackagesSection
              title={messages.price.packagesTitle}
              titleId="pricePackagesTitle"
              packages={messages.price.packages}
              tabLabels={messages.price.packageTabLabels}
            />
          </ScrollReveal>

          <ScrollReveal as="section" className="servicesSection" aria-labelledby="priceImagesTitle">
            <h1 id="priceImagesTitle" className="servicesTitle contactAccent">
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
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="servicesSection"
            aria-labelledby="priceVideosTitle"
            delay={50}
          >
            <h2
              id="priceVideosTitle"
              className="servicesTitle contactAccent"
            >
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
          </ScrollReveal>

          {walkthroughVideos.length > 0 ? (
            <ScrollReveal
              as="section"
              className="servicesSection"
              aria-labelledby="priceWalkthroughTitle"
              delay={70}
            >
              <h2 id="priceWalkthroughTitle" className="servicesTitle contactAccent">
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
            </ScrollReveal>
          ) : null}

          <ScrollReveal
            as="section"
            className="servicesSection"
            aria-labelledby="priceWebsiteTitle"
            delay={80}
          >
            <h2 id="priceWebsiteTitle" className="servicesTitle contactAccent">
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
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="servicesSection servicesSectionWithDivider"
            aria-labelledby="priceIncludedTitle"
            delay={130}
          >
            <h2
              id="priceIncludedTitle"
              className="servicesTitle contactAccent"
            >
              {messages.price.includedTitle}
            </h2>
            <ul
              className="servicesList"
              aria-label={`${messages.services.includedTitle} list`}
            >
              {messages.services.pricingIncludes.map((item) => (
                <li key={item} className="servicesItem">
                  {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="servicesSection"
            aria-labelledby="pricePartnershipTitle"
            delay={170}
          >
            <h2
              id="pricePartnershipTitle"
              className="servicesTitle contactAccent"
            >
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
          </ScrollReveal>

          <ScrollReveal
            as="section"
            className="servicesSection workflowCard"
            aria-labelledby="priceWorkflowTitle"
            delay={210}
          >
            <h2
              id="priceWorkflowTitle"
              className="servicesTitle contactAccent"
            >
              {messages.price.workflowTitle}
            </h2>
            <ul className="servicesList" aria-label={messages.price.workflowTitle}>
              <li className="servicesItem">
                {messages.price.workflowIncludesLabel}{" "}
                <Link className="workflowLink" href="/mystudio">
                  {messages.price.workflowLinkLabel}
                </Link>
              </li>
              <li className="servicesItem">{messages.price.workflowComingSoon}</li>
            </ul>
          </ScrollReveal>

          <ScrollReveal as="p" className="pageCta" delay={250}>
            <Link
              className="pageCtaInlineLink"
              href={withLocalePath(locale, "/contact")}
            >
              {messages.price.ctaText}
            </Link>
          </ScrollReveal>
        </div>
      </PriceAccessGate>
    </main>
  );
}
