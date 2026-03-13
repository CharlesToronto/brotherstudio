import type { Metadata } from "next";

import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";

type LocaleContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleContactPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const pathname = "/contact";

  return {
    title: messages.contact.title,
    description: messages.contact.metadataDescription,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title: messages.contact.title,
      description: messages.contact.metadataDescription,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
    twitter: {
      title: messages.contact.title,
      description: messages.contact.metadataDescription,
    },
  };
}

export default async function LocalizedContactPage({
  params,
}: LocaleContactPageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);

  return (
    <main className="siteMain">
      <section className="contactBlock" aria-labelledby="contactTitle">
        <h1 id="contactTitle" className="contactTitle contactAccent">
          {messages.contact.title}
        </h1>
        <address className="contactText contactAccent">
          {site.contact.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div className="contactSpacer" />
          <div>
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </div>
          <div>
            <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
          </div>
        </address>
      </section>
    </main>
  );
}
