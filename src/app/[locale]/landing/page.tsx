import type { Metadata } from "next";

import { CampaignLandingPage } from "@/components/CampaignLandingPage";
import { getMessages } from "@/content/messages";
import { getGalleryItems } from "@/lib/galleryStore";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { getGalleryProjectLabel } from "@/lib/galleryProjects";
import { resolveLocaleParam } from "@/lib/localeParams";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const locale = await resolveLocaleParam(params);
  const pathname = "/landing";
  const title =
    locale === "fr"
      ? "Visualisation architecturale pour vendre vos projets"
      : "Architectural visualization designed to sell your projects";
  const description =
    locale === "fr"
      ? "Images 3D photorealistes, vidéos, sites de vente et accompagnement pour vos projets immobiliers."
      : "Photorealistic 3D imagery, videos, sales websites, and support for real estate projects.";

  return {
    title,
    description,
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const locale = await resolveLocaleParam(params);
  const messages = getMessages(locale);
  const galleryItems = await getGalleryItems();

  const images = galleryItems.slice(0, 9).map((item) => ({
    id: item.id,
    src: item.src,
    alt: item.architect || "BrotherStudio architectural visualization",
    project: getGalleryProjectLabel(item.project) || "BrotherStudio",
  }));

  const standardVideos = messages.price.videos
    .filter((service) => service.subsectionTitle !== messages.price.walkthroughTitle)
    .flatMap((service) => {
      if (service.options?.length) {
        return service.options.map((option) => ({
          name: `${service.name} · ${option.name}`,
          price: option.price,
        }));
      }
      return service.price ? [{ name: service.name, price: service.price }] : [];
    });

  const walkthroughs = messages.price.videos
    .filter((service) => service.subsectionTitle === messages.price.walkthroughTitle)
    .flatMap((service) => {
      if (service.options?.length) {
        return service.options.map((option) => ({
          name: `${service.name} · ${option.name}`,
          price: option.price,
        }));
      }
      return service.price ? [{ name: service.name, price: service.price }] : [];
    });

  const pricing = {
    imagesTitle: messages.price.imagesTitle,
    videosTitle: messages.price.videosTitle,
    walkthroughTitle: messages.price.walkthroughTitle,
    websiteTitle: messages.price.websiteTitle,
    packagesTitle: messages.price.packagesTitle,
    images: messages.price.images,
    videos: standardVideos,
    walkthroughs,
    websites: messages.price.websites,
    packages: messages.price.packages,
  };

  return <CampaignLandingPage locale={locale} images={images} pricing={pricing} />;
}
