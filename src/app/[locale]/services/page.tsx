import type { Metadata } from "next";

import { getMessages } from "@/content/messages";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleServicesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleServicesPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/services";

  return {
    title: messages.services.title,
    description: messages.services.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.services.title,
      description: messages.services.openGraphDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.services.title,
      description: messages.services.openGraphDescription,
    },
  };
}

export default async function LocalizedServicesPage({
  params,
}: LocaleServicesPageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);

  return (
    <main className="siteMain">
      <div className="servicesLayout">
        <section className="servicesSection" aria-labelledby="servicesTitle">
          <h1 id="servicesTitle" className="servicesTitle">
            {messages.services.title}
          </h1>
          <p className="servicesIntro">{messages.services.intro}</p>
          <ul className="servicesList" aria-label={`${messages.services.title} list`}>
            {messages.services.services.map((service) => (
              <li key={service} className="servicesItem">
                {service}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="servicesSection"
          aria-labelledby="servicesIncludedTitle"
        >
          <h2 id="servicesIncludedTitle" className="servicesTitle">
            {messages.services.includedTitle}
          </h2>
          <ul className="servicesList" aria-label={`${messages.services.includedTitle} list`}>
            {messages.services.pricingIncludes.map((item) => (
              <li key={item} className="servicesItem">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
