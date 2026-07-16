"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BarChart3,
  Building2,
  Clapperboard,
  Gem,
  Globe,
  Handshake,
  Megaphone,
  Rocket,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Gallery } from "@/components/Gallery";
import {
  HomeGalleryPrimaryTabs,
  HomeMobileDisplayFilters,
  HomeSceneFilters,
} from "@/components/HomeGalleryControls";
import {
  getLocaleFromPathname,
  type Locale,
  withLocalePath,
} from "@/lib/i18n";
import { PROJECT_OPTIONS, type GalleryProjectKey } from "@/lib/galleryProjects";
import type { GalleryItem } from "@/lib/galleryStore";

type HomeGalleryExperienceProps = {
  items: GalleryItem[];
  filterLabels: {
    all: string;
    ariaLabel: string;
  };
  sceneFilterLabels: {
    ariaLabel: string;
    video: string;
    all: string;
    bedroom: string;
    livingRoom: string;
    kitchen: string;
    exterior: string;
    bathroom: string;
    focusAmbiance: string;
  };
};

const ALWAYS_VISIBLE_MARQUEE_PROJECT_KEYS = new Set<GalleryProjectKey>(["hdm6"]);
const MOBILE_HIDDEN_PROJECT_KEYS = new Set<GalleryProjectKey>(["jolimont", "markham"]);
const MOBILE_PRIORITY_PROJECT_KEYS: GalleryProjectKey[] = ["tourelle", "maretset"];
const MOBILE_GALLERY_MEDIA_QUERY = "(max-width: 640px)";
const MOBILE_GALLERY_PREVIEW_COUNT = 10;
type MobileDisplayMode = "projects" | "grid";
type SceneFilterKey =
  | "all"
  | "bedroom"
  | "living-room"
  | "kitchen"
  | "exterior"
  | "bathroom"
  | "focus-ambiance";
type GalleryPrimaryTabKey = "videos" | "images" | "sales-plans" | "website";

type WebsitePreview = {
  title: string;
  href?: string;
  image: string;
  alt: string;
};

type SalesPlanPreview = {
  title: string;
  image: string;
  alt: string;
};

const HOME_CAPABILITIES: Array<{
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    label: "Branding Project",
    icon: Building2,
    description:
      "A clear visual identity for your project, with naming, positioning, and art direction aligned to the audience you want to attract.",
  },
  {
    label: "Images & Videos",
    icon: Clapperboard,
    description:
      "High-end CGI imagery and cinematic content designed to present the development with clarity, atmosphere, and commercial appeal.",
  },
  {
    label: "Sales Plan",
    icon: BarChart3,
    description:
      "A structured sales narrative that organizes the offer, highlights key value points, and supports a smoother conversion journey.",
  },
  {
    label: "Customs Website",
    icon: Globe,
    description:
      "A dedicated website built around your project, tailored to showcase the product, capture attention, and drive qualified inquiries.",
  },
  {
    label: "Meta Advertising",
    icon: Megaphone,
    description:
      "Targeted paid campaigns across Meta platforms to generate awareness, reach the right segments, and feed the sales pipeline.",
  },
  {
    label: "Lead Generation",
    icon: Users,
    description:
      "Lead capture systems and acquisition flows designed to transform interest into measurable contacts ready for follow-up.",
  },
];

const HOME_DEVELOPER_REASONS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Launch Faster",
    description:
      "Bring your development to market with everything ready for a successful launch.",
    icon: Rocket,
  },
  {
    title: "Generate Qualified Buyers",
    description:
      "Attract buyers actively looking for new developments through targeted digital marketing.",
    icon: Gem,
  },
  {
    title: "One Team. One Strategy.",
    description:
      "Branding, CGI, websites and advertising working together from day one.",
    icon: Handshake,
  },
];

const HOME_PROCESS_STEPS = [
  {
    title: "Project Branding",
    description: "Position the development with a clear identity, message, and visual direction.",
  },
  {
    title: "Images / Videos",
    description: "Create premium visuals that make the project feel real before construction.",
  },
  {
    title: "Website",
    description: "Build a sales-focused destination that presents the offer and captures demand.",
  },
  {
    title: "Meta Campaigns",
    description: "Launch targeted campaigns that put the project in front of the right audience.",
  },
  {
    title: "Qualified Buyers",
    description: "Filter interest into serious leads ready for commercial follow-up.",
  },
  {
    title: "Sales Partner (Optional)",
    description: "Support the sales cycle with assets, data, and a coherent launch system.",
  },
] as const;

const HOME_SALES_PLANS: SalesPlanPreview[] = Array.from({ length: 11 }, (_, index) => {
  const fileNumber = index + 2;
  return {
    title: `Plan de vente ${index + 1}`,
    image: `/gallery/sales-plans/${fileNumber}.png`,
    alt: `Plan de vente ${index + 1}`,
  };
});

const HOME_GALLERY_VIDEOS = [
  { src: "/videos/bs-maretset-2.mp4", label: "Maretset video" },
  { src: "/videos/bs-ads-video.mp4", label: "BS Ads video" },
] as const;

function getWebsitePreviews(locale: Locale): WebsitePreview[] {
  const mesangeHref = withLocalePath(locale, "/myexperience");
  const websiteHref = withLocalePath(locale, "/mywebsite");

  return [
    {
      title: "Mesange",
      href: mesangeHref,
      image: "/myexperience-hero-night.webp",
      alt:
        locale === "fr"
          ? "Apercu du site de vente Mesange avec facade au crepuscule"
          : "Preview of the Mesange sales website with dusk exterior view",
    },
    {
      title: "Maretset",
      href: websiteHref,
      image: "/mywebsite-maretset-cover.webp",
      alt: locale === "fr" ? "Apercu du site de vente Maretset" : "Preview of the Maretset sales website",
    },
    {
      title: "Coming soon",
      href: websiteHref,
      image: "/mywebsite-coming-soon-cover.webp",
      alt:
        locale === "fr"
          ? "Apercu d un prochain site de vente"
          : "Preview of an upcoming sales website",
    },
  ];
}

function normalizeSceneValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSceneFilterForItem(item: GalleryItem): Exclude<SceneFilterKey, "all" | "video"> | null {
  const value = normalizeSceneValue(item.architect);

  if (
    value.includes("bed room") ||
    value.includes("bedroom") ||
    value.includes("chambre")
  ) {
    return "bedroom";
  }

  if (value.includes("living room") || value.includes("salon")) {
    return "living-room";
  }

  if (value.includes("kitchen") || value.includes("cuisine")) {
    return "kitchen";
  }

  if (
    value.includes("exterior") ||
    value.includes("exterieure") ||
    value.includes("exterieur") ||
    value.includes("drone view") ||
    value.includes("veranda")
  ) {
    return "exterior";
  }

  if (value.includes("bathroom") || value.includes("salle de bain")) {
    return "bathroom";
  }

  if (
    value.includes("focus") ||
    value.includes("ambiance") ||
    value.includes("style")
  ) {
    return "focus-ambiance";
  }

  return null;
}

function LightboxArrow({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      />
    </svg>
  );
}

function LightboxCloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

function GalleryPlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

function GalleryMinusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        d="M5 12h14"
      />
    </svg>
  );
}

export function HomeProjectMarquee({
  projects,
  activeProject,
  onProjectToggle,
}: {
  projects: typeof PROJECT_OPTIONS;
  activeProject: GalleryProjectKey | "all";
  onProjectToggle: (project: GalleryProjectKey) => void;
}) {
  const marqueeProjects = [...projects, ...projects];

  if (marqueeProjects.length === 0) return null;

  return (
    <section className="homeProjectMarquee" aria-label="Selected projects">
      <div className="homeProjectMarqueeViewport">
        <div className="homeProjectMarqueeTrack">
          {marqueeProjects.map((project, index) => (
            <button
              key={`${project.key}-${index}`}
              className="homeProjectMarqueeItem"
              type="button"
              data-active={activeProject === project.key ? "true" : "false"}
              aria-pressed={activeProject === project.key}
              onClick={() => onProjectToggle(project.key)}
            >
              {project.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeGalleryExperience({
  items,
  filterLabels,
  sceneFilterLabels,
}: HomeGalleryExperienceProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [mobileDisplayMode, setMobileDisplayMode] = useState<MobileDisplayMode>("grid");
  const [activePrimaryTab, setActivePrimaryTab] = useState<GalleryPrimaryTabKey>("images");
  const [activeProject] = useState<GalleryProjectKey | "all">("all");
  const [activeSceneFilter, setActiveSceneFilter] = useState<SceneFilterKey>("all");
  const [activeMobileItem, setActiveMobileItem] = useState<GalleryItem | null>(null);
  const [isMobileGalleryExpanded, setIsMobileGalleryExpanded] = useState(false);
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const lightboxPreviewRefs = useRef(new Map<string, HTMLButtonElement>());
  const postHeroSpotlightRef = useRef<HTMLDivElement | null>(null);
  const galleryHeadingRef = useRef<HTMLDivElement | null>(null);
  const primaryTabs = [
    { key: "images", label: "Images" },
    { key: "videos", label: "Videos" },
    { key: "sales-plans", label: "Plan de vente" },
    { key: "website", label: "Website" },
  ] as const;
  const sceneFilters = [
    { key: "all", label: sceneFilterLabels.all },
    { key: "bedroom", label: sceneFilterLabels.bedroom },
    { key: "living-room", label: sceneFilterLabels.livingRoom },
    { key: "kitchen", label: sceneFilterLabels.kitchen },
    { key: "exterior", label: sceneFilterLabels.exterior },
    { key: "bathroom", label: sceneFilterLabels.bathroom },
    { key: "focus-ambiance", label: sceneFilterLabels.focusAmbiance },
  ] as const;
  const availableProjects = PROJECT_OPTIONS.filter((option) =>
    ALWAYS_VISIBLE_MARQUEE_PROJECT_KEYS.has(option.key) ||
    items.some((item) => item.project === option.key),
  );
  const websitePreviews = getWebsitePreviews(locale);
  const effectiveActiveProject = isMobileLayout ? "all" : activeProject;
  const projectFilteredItems =
    effectiveActiveProject === "all"
      ? items
      : items.filter((item) => item.project === effectiveActiveProject);
  const availableSceneFilters = sceneFilters.filter(
    (filter) =>
      filter.key === "all" || projectFilteredItems.some((item) => getSceneFilterForItem(item) === filter.key),
  );
  const resolvedSceneFilter = availableSceneFilters.some(
    (filter) => filter.key === activeSceneFilter,
  )
    ? activeSceneFilter
    : "all";
  const effectiveSceneFilter =
    isMobileLayout && mobileDisplayMode === "projects" ? "all" : resolvedSceneFilter;
  const isVideoFilterActive = activePrimaryTab === "videos";
  const isImagesTabActive = activePrimaryTab === "images";
  const isSalesPlansTabActive = activePrimaryTab === "sales-plans";
  const isWebsiteTabActive = activePrimaryTab === "website";
  const visibleItems =
    effectiveSceneFilter === "all"
      ? projectFilteredItems
      : projectFilteredItems.filter((item) => getSceneFilterForItem(item) === effectiveSceneFilter);
  const orderedMobileProjects = [
    ...MOBILE_PRIORITY_PROJECT_KEYS
      .map((key) => availableProjects.find((project) => project.key === key))
      .filter((project): project is (typeof availableProjects)[number] => Boolean(project)),
    ...availableProjects.filter((project) => !MOBILE_PRIORITY_PROJECT_KEYS.includes(project.key)),
  ];
  const mobileProjectGroups = orderedMobileProjects
    .filter((project) => !MOBILE_HIDDEN_PROJECT_KEYS.has(project.key))
    .map((project) => ({
      key: project.key,
      label: project.label,
      items: visibleItems.filter((item) => item.project === project.key),
    }))
    .filter((group) => group.items.length > 0);
  const mobileVisibleItems = [
    ...mobileProjectGroups.flatMap((group) => group.items),
    ...visibleItems.filter((item) => item.project === null),
  ];
  const shouldClampMobileGallery =
    isMobileLayout &&
    isImagesTabActive &&
    mobileDisplayMode === "grid" &&
    !isMobileGalleryExpanded &&
    mobileVisibleItems.length > MOBILE_GALLERY_PREVIEW_COUNT;
  const mobileRenderedItems = shouldClampMobileGallery
    ? mobileVisibleItems.slice(0, MOBILE_GALLERY_PREVIEW_COUNT)
    : mobileVisibleItems;
  const mobileLightboxItems =
    mobileDisplayMode === "projects"
      ? mobileProjectGroups.flatMap((group) => group.items)
      : mobileVisibleItems;
  const activeMobileItemIndex = activeMobileItem
    ? mobileLightboxItems.findIndex((item) => item.id === activeMobileItem.id)
    : -1;
  const hasMobileLightboxNavigation =
    mobileLightboxItems.length > 1 && activeMobileItemIndex !== -1;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_GALLERY_MEDIA_QUERY);
    const syncMobileLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
    };

    syncMobileLayout();
    mediaQuery.addEventListener("change", syncMobileLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileLayout);
    };
  }, []);

  useEffect(() => {
    if (!activeMobileItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMobileItem(null);
      if (event.key === "ArrowLeft" && hasMobileLightboxNavigation) {
        const previousIndex =
          (activeMobileItemIndex - 1 + mobileLightboxItems.length) % mobileLightboxItems.length;
        setActiveMobileItem(mobileLightboxItems[previousIndex] ?? null);
      }
      if (event.key === "ArrowRight" && hasMobileLightboxNavigation) {
        const nextIndex = (activeMobileItemIndex + 1) % mobileLightboxItems.length;
        setActiveMobileItem(mobileLightboxItems[nextIndex] ?? null);
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeMobileItem,
    activeMobileItemIndex,
    hasMobileLightboxNavigation,
    mobileLightboxItems,
  ]);

  useEffect(() => {
    if (!activeMobileItem) return;
    const previewNode = lightboxPreviewRefs.current.get(activeMobileItem.id);
    previewNode?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeMobileItem]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMobileGalleryExpanded(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activePrimaryTab, effectiveSceneFilter, mobileDisplayMode]);

  useEffect(() => {
    const heading = galleryHeadingRef.current;
    if (!heading) return;

    let frame = 0;
    const root = document.documentElement;
    const body = document.body;

    const syncGalleryBackground = () => {
      frame = 0;
      const rect = heading.getBoundingClientRect();
      const start = window.innerHeight * 0.62;
      const end = window.innerHeight * 0.42;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const channel = Math.round(progress * 255);
      const textChannel = progress > 0.58 ? 17 : 255;
      const borderAlpha = 0.08 + progress * 0.08;
      const backgroundRgb = `${channel} ${channel} ${channel}`;

      root.style.setProperty("--site-background-rgb", backgroundRgb);
      root.style.setProperty("--home-gallery-bg-rgb", backgroundRgb);
      body.style.setProperty("--site-background-rgb", backgroundRgb);
      body.style.setProperty("--home-gallery-bg-rgb", backgroundRgb);
      heading.style.setProperty("--home-gallery-bg-rgb", backgroundRgb);
      heading.style.setProperty(
        "--home-gallery-title-rgb",
        `${textChannel} ${textChannel} ${textChannel}`,
      );
      heading.style.setProperty("--home-gallery-progress", progress.toFixed(3));
      heading.style.setProperty("--home-gallery-border-alpha", borderAlpha.toFixed(3));
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncGalleryBackground);
    };

    syncGalleryBackground();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--site-background-rgb");
      root.style.removeProperty("--home-gallery-bg-rgb");
      body.style.removeProperty("--site-background-rgb");
      body.style.removeProperty("--home-gallery-bg-rgb");
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, []);

  const handlePostHeroPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const section = postHeroSpotlightRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    section.style.setProperty("--home-spotlight-x", `${x.toFixed(2)}%`);
    section.style.setProperty("--home-spotlight-y", `${y.toFixed(2)}%`);
    section.style.setProperty("--home-spotlight-opacity", "1");
  };

  const handlePostHeroPointerLeave = () => {
    const section = postHeroSpotlightRef.current;
    if (!section) return;

    section.style.setProperty("--home-spotlight-opacity", "0.42");
  };

  return (
    <section id="home-gallery-start">
      <div
        ref={postHeroSpotlightRef}
        className="homePostHeroDark"
        onPointerMove={handlePostHeroPointerMove}
        onPointerLeave={handlePostHeroPointerLeave}
      >
        <section
          className="homeCapabilitiesStrip"
          aria-labelledby="home-capabilities-title"
        >
          <div className="homeCapabilitiesIntro">
            <p className="homeCapabilitiesKicker">We do it for you</p>
            <h2 id="home-capabilities-title" className="homeCapabilitiesTitle">
              Everything you need to sell your development
            </h2>
          </div>
          <div className="homeCapabilitiesRail" role="list" aria-label="Development marketing services">
            {HOME_CAPABILITIES.map(({ label, icon: Icon, description }) => (
              <article key={label} className="homeCapabilitiesItem" role="listitem">
                <span className="homeCapabilitiesIcon" aria-hidden="true">
                  <Icon size={32} strokeWidth={1.8} />
                </span>
                <span className="homeCapabilitiesLabel">{label}</span>
                <span className="homeCapabilitiesDescription">{description}</span>
              </article>
            ))}
          </div>
        </section>

        <section
          className="homeDeveloperValueSection"
          aria-labelledby="home-developer-value-title"
        >
          <div className="homeDeveloperValueIntro">
            <p className="homeDeveloperValueKicker">Business impact</p>
            <h2 id="home-developer-value-title" className="homeDeveloperValueTitle">
              Why Developers Choose Brother Studio
            </h2>
          </div>
          <div className="homeDeveloperValueGrid" role="list">
            {HOME_DEVELOPER_REASONS.map(({ title, description }, index) => (
              <article key={title} className="homeDeveloperValueCard" role="listitem">
                <span className="homeDeveloperValueIndex" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="homeDeveloperValueCopy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section ref={galleryHeadingRef} className="homeGallerySection">
        <div className="homeGalleryIntro">
          <div className="homeGalleryHeading">
            <h2 className="homeGalleryTitle">Gallery</h2>
          </div>

          <HomeGalleryPrimaryTabs
            activeTab={activePrimaryTab}
            ariaLabel="Gallery sections"
            tabs={primaryTabs}
            onTabChange={setActivePrimaryTab}
          />
        </div>

        <div className="homeGalleryStage">
          {!isMobileLayout && isImagesTabActive && availableSceneFilters.length > 1 ? (
            <HomeSceneFilters
              activeFilter={effectiveSceneFilter}
              ariaLabel={sceneFilterLabels.ariaLabel}
              filters={availableSceneFilters}
              onFilterChange={setActiveSceneFilter}
            />
          ) : null}

          <div id="home-gallery-grid">
            {isVideoFilterActive ? (
              <div className="homeVideoGallery" role="list" aria-label={sceneFilterLabels.video}>
                {HOME_GALLERY_VIDEOS.map((video) => (
                  <article key={video.src} className="homeVideoGalleryCard" role="listitem">
                    <video
                      src={video.src}
                      loop
                      playsInline
                      controls
                      aria-label={video.label}
                    />
                  </article>
                ))}
              </div>
            ) : isSalesPlansTabActive ? (
              <section className="homeSalesPlansGallery" aria-label="Plan de vente">
            {HOME_SALES_PLANS.map((plan) => (
              <article key={plan.image} className="homeSalesPlanCard">
                <Image
                  src={plan.image}
                  alt={plan.alt}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="homeSalesPlanImage"
                />
              </article>
            ))}
          </section>
        ) : isWebsiteTabActive ? (
          <section className="homeWebsiteGallery" aria-label="Website previews">
            {websitePreviews.map((preview, index) => (
              <article
                key={`${preview.title}-${index}`}
                className={`myWebsiteCard${preview.href ? " myWebsiteCardLink" : ""}`}
              >
                {preview.href ? (
                  <Link className="myWebsiteCardInner" href={preview.href}>
                    <div className="myWebsiteCardMedia">
                      <Image
                        src={preview.image}
                        alt={preview.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        className="myWebsiteCardImage"
                      />
                    </div>
                    <div className="myWebsiteCardFooter">
                      <span className="myWebsiteCardTitle">{preview.title}</span>
                    </div>
                  </Link>
                ) : (
                  <div className="myWebsiteCardInner" aria-label={preview.alt}>
                    <div className="myWebsiteCardMedia">
                      <Image
                        src={preview.image}
                        alt={preview.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        className="myWebsiteCardImage"
                      />
                    </div>
                    <div className="myWebsiteCardFooter">
                      <span className="myWebsiteCardTitle">{preview.title}</span>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        ) : isMobileLayout ? (
          <>
            <HomeMobileDisplayFilters
              activeMode={mobileDisplayMode}
              onModeChange={setMobileDisplayMode}
            />

            {isImagesTabActive && availableSceneFilters.length > 1 && mobileDisplayMode === "grid" ? (
              <HomeSceneFilters
                activeFilter={effectiveSceneFilter}
                ariaLabel={sceneFilterLabels.ariaLabel}
                filters={availableSceneFilters}
                onFilterChange={setActiveSceneFilter}
              />
            ) : null}

            {mobileDisplayMode === "projects" ? (
              <div className="homeProjectCarousels" role="list" aria-label={filterLabels.ariaLabel}>
                {mobileProjectGroups.map((group) => (
                  <section
                    key={group.key}
                    className="homeProjectCarouselSection"
                    role="listitem"
                    aria-label={group.label}
                  >
                    <div className="homeProjectCarouselHeader">
                      <h2 className="homeProjectCarouselTitle">{group.label}</h2>
                      <div className="homeProjectCarouselCount">{group.items.length}</div>
                    </div>
                    <div className="homeProjectCarouselTrack" role="list" aria-label={group.label}>
                      {group.items.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className="homeProjectCarouselCard"
                          role="listitem"
                          onClick={() => setActiveMobileItem(item)}
                          aria-label={`${group.label} image ${index + 1}`}
                        >
                          <div className="homeProjectCarouselImageFrame">
                            <Image
                              className="homeProjectCarouselImage"
                              src={item.src}
                              alt={item.architect || `${group.label} image ${index + 1}`}
                              width={1600}
                              height={1600}
                              sizes="(max-width: 640px) calc(100vw - 54px), 320px"
                              quality={78}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <>
                <div
                  className="galleryRevealShell homeMobileGalleryRevealShell"
                  data-expanded={isMobileGalleryExpanded ? "true" : "false"}
                  data-clamped={shouldClampMobileGallery ? "true" : "false"}
                >
                  <div className="homeMobileGalleryGrid" role="list" aria-label={filterLabels.ariaLabel}>
                    {mobileRenderedItems.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        className="homeMobileGalleryGridCard"
                        role="listitem"
                        onClick={() => setActiveMobileItem(item)}
                        aria-label={`Image ${index + 1}`}
                      >
                        <Image
                          className="homeMobileGalleryGridImage"
                          src={item.src}
                          alt={item.architect || `Image ${index + 1}`}
                          width={1600}
                          height={1600}
                          sizes="(max-width: 640px) calc((100vw - 54px) / 2), 240px"
                          quality={78}
                        />
                      </button>
                    ))}
                  </div>

                  {shouldClampMobileGallery ? (
                    <button
                      type="button"
                      className="galleryRevealButton"
                      aria-label="Show all gallery images"
                      onClick={() => setIsMobileGalleryExpanded(true)}
                    >
                      <GalleryPlusIcon />
                    </button>
                  ) : null}
                </div>

                {isMobileGalleryExpanded && mobileVisibleItems.length > MOBILE_GALLERY_PREVIEW_COUNT ? (
                  <div className="galleryCollapseControl">
                    <button
                      type="button"
                      className="galleryCollapseButton"
                      aria-label="Reduce gallery"
                      onClick={() => setIsMobileGalleryExpanded(false)}
                    >
                      <GalleryMinusIcon />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : (
          <Gallery
            key={activeProject}
            items={visibleItems}
            showProjectFilters={false}
            filterLabels={filterLabels}
            galleryState={{
              activeProject,
              visibleCount: visibleItems.length,
            }}
          />
        )}
          </div>
        </div>
      </section>

      {activeMobileItem ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveMobileItem(null)}
        >
          <button
            type="button"
            className="lightboxClose"
            aria-label="Close slideshow"
            onClick={(event) => {
              event.stopPropagation();
              setActiveMobileItem(null);
            }}
          >
            <LightboxCloseIcon />
          </button>
          {hasMobileLightboxNavigation ? (
            <button
              type="button"
              className="lightboxArrow lightboxArrowLeft"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                const previousIndex =
                  (activeMobileItemIndex - 1 + mobileLightboxItems.length) %
                  mobileLightboxItems.length;
                setActiveMobileItem(mobileLightboxItems[previousIndex] ?? null);
              }}
            >
              <LightboxArrow direction="left" />
            </button>
          ) : null}
          <Image
            className="lightboxImage"
            src={activeMobileItem.src}
            alt={activeMobileItem.architect}
            width={2000}
            height={2000}
            sizes="100vw"
          />
          {hasMobileLightboxNavigation ? (
            <div
              className="lightboxPreviewRail"
              role="list"
              aria-label="Image previews"
              onClick={(event) => event.stopPropagation()}
            >
              {mobileLightboxItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="lightboxPreviewButton"
                  data-active={item.id === activeMobileItem.id ? "true" : "false"}
                  role="listitem"
                  aria-label={`Open preview ${index + 1}`}
                  onClick={() => setActiveMobileItem(item)}
                  ref={(node) => {
                    if (node) {
                      lightboxPreviewRefs.current.set(item.id, node);
                    } else {
                      lightboxPreviewRefs.current.delete(item.id);
                    }
                  }}
                >
                  <Image
                    className="lightboxPreviewImage"
                    src={item.src}
                    alt={item.architect || `Preview ${index + 1}`}
                    width={240}
                    height={240}
                    sizes="72px"
                  />
                </button>
              ))}
            </div>
          ) : null}
          {hasMobileLightboxNavigation ? (
            <button
              type="button"
              className="lightboxArrow lightboxArrowRight"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                const nextIndex = (activeMobileItemIndex + 1) % mobileLightboxItems.length;
                setActiveMobileItem(mobileLightboxItems[nextIndex] ?? null);
              }}
            >
              <LightboxArrow direction="right" />
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="homeProcessSection" aria-labelledby="home-process-title">
        <div className="homeProcessHeader">
          <h2 id="home-process-title" className="homeProcessTitle">
            Our Process
          </h2>
          <p className="homeProcessLead">
            A complete launch system from positioning to qualified buyers.
          </p>
        </div>

        <div className="homeProcessList" role="list">
          {HOME_PROCESS_STEPS.map((step, index) => (
            <div key={step.title} className="homeProcessStepGroup" role="listitem">
              <button
                type="button"
                className="homeProcessStep"
                data-active={activeProcessStep === index ? "true" : "false"}
                aria-pressed={activeProcessStep === index}
                onClick={() => setActiveProcessStep(index)}
                onFocus={() => setActiveProcessStep(index)}
                onMouseEnter={() => setActiveProcessStep(index)}
              >
                <span className="homeProcessNumber">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="homeProcessStepCopy">
                  <span className="homeProcessStepTitle">{step.title}</span>
                  <span className="homeProcessStepDescription">
                    {step.description}
                  </span>
                </span>
                <span className="homeProcessStepSignal" aria-hidden="true" />
              </button>
              {index < HOME_PROCESS_STEPS.length - 1 ? (
                <span className="homeProcessArrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div id="home-gallery-end" aria-hidden="true" />
    </section>
  );
}
