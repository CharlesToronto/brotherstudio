import { createBrochureSection } from "@/lib/brochureSections";
import type {
  BrochureImmersiveBuilder,
  BrochureImmersiveSectionKey,
  BrochureSection,
} from "@/lib/brochureTypes";

const DEFAULT_SECTION_ORDER: BrochureImmersiveSectionKey[] = [
  "hero",
  "key-points",
  "description",
  "gallery",
  "video",
  "location",
  "lifestyle",
  "cta",
];

function uniqueImageIds(imageIds: string[]) {
  return imageIds.filter((imageId, index, source) => imageId && source.indexOf(imageId) === index);
}

function takeImages(
  availableImageIds: string[],
  usedImageIds: Set<string>,
  count: number,
  preferredIds: string[] = [],
) {
  const selected: string[] = [];

  for (const imageId of preferredIds) {
    if (!imageId || usedImageIds.has(imageId) || selected.includes(imageId)) continue;
    selected.push(imageId);
    usedImageIds.add(imageId);
    if (selected.length >= count) return selected;
  }

  for (const imageId of availableImageIds) {
    if (!imageId || usedImageIds.has(imageId) || selected.includes(imageId)) continue;
    selected.push(imageId);
    usedImageIds.add(imageId);
    if (selected.length >= count) return selected;
  }

  return selected;
}

export function createDefaultBrochureImmersiveBuilder(): BrochureImmersiveBuilder {
  return {
    selectedSections: ["hero", "description", "gallery", "location", "cta"],
    visualStyle: "modern-real-estate",
    animationLevel: "subtle",
    heroImageId: "",
    galleryImageIds: [],
    videoUrl: "",
    videoMode: "section",
    keyPointsTitle: "Key points",
    keyPoints: [],
    descriptionTitle: "Project overview",
    descriptionBody: "",
    locationTitle: "Location",
    locationAddress: "",
    locationLatitude: null,
    locationLongitude: null,
    locationZoom: 14,
    locationMapStyle: "minimalMono",
    locationNeighborhood: "",
    locationPoints: [],
    lifestyleTitle: "Lifestyle",
    lifestyleBody: "",
    ctaTitle: "Request the full dossier",
    ctaBody: "Access the complete brochure and move the discussion forward with clients and buyers.",
    ctaButtonLabel: "Download PDF",
  };
}

export function serializeLines(value: string[]) {
  return value.join("\n");
}

export function parseLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function generateBrochureImmersiveSections(
  projectName: string,
  builder: BrochureImmersiveBuilder,
  orderedImageIds: string[],
): BrochureSection[] {
  const usedImageIds = new Set<string>();
  const sections: BrochureSection[] = [];
  const galleryImageIds = uniqueImageIds(builder.galleryImageIds);
  const selectedSections = DEFAULT_SECTION_ORDER.filter((key) =>
    builder.selectedSections.includes(key),
  );
  const heroPreferredId = builder.heroImageId || orderedImageIds[0] || "";
  const heroImageIds = takeImages(orderedImageIds, usedImageIds, 1, [heroPreferredId]);
  const cover = createBrochureSection("cover");
  cover.title = projectName;
  cover.subtitle =
    builder.visualStyle === "luxury-minimal"
      ? "Luxury minimal presentation"
      : builder.visualStyle === "warm-lifestyle"
        ? "Warm lifestyle presentation"
        : "Modern real estate presentation";
  cover.body = builder.descriptionBody || "";
  cover.imageIds = heroImageIds;
  cover.immersiveLayout = "full-bleed";
  cover.immersiveVariant =
    builder.videoUrl && builder.videoMode === "background" ? "video" : "standard";
  cover.immersiveVideoUrl = builder.videoUrl;
  cover.immersiveVideoMode = builder.videoMode;
  sections.push(cover);

  for (const key of selectedSections) {
    if (key === "hero") continue;

    if (key === "key-points") {
      const section = createBrochureSection("advantages");
      section.title = builder.keyPointsTitle;
      section.subtitle = "";
      section.body = "";
      section.imageIds = [];
      section.immersiveVariant = "key-points";
      section.immersiveLayout = "media-left";
      section.immersiveKeyPoints = builder.keyPoints;
      sections.push(section);
      continue;
    }

    if (key === "description") {
      const section = createBrochureSection("introduction");
      section.title = builder.descriptionTitle;
      section.subtitle = "";
      section.body = builder.descriptionBody;
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 1);
      section.immersiveVariant = "standard";
      section.immersiveLayout = "media-left";
      sections.push(section);
      continue;
    }

    if (key === "gallery") {
      const section = createBrochureSection("interiors");
      section.title = "Gallery";
      section.subtitle = "Visual sequence";
      section.body = "A curated selection of images for a scroll-driven presentation.";
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 4, galleryImageIds);
      section.immersiveVariant = "gallery";
      section.immersiveLayout = "full-bleed";
      sections.push(section);
      continue;
    }

    if (key === "video") {
      const section = createBrochureSection("architecture");
      section.title = "Immersive video";
      section.subtitle =
        builder.videoMode === "background" ? "Background motion" : "Dedicated section";
      section.body = "A cinematic sequence designed to reinforce atmosphere and emotion.";
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 1);
      section.immersiveVariant = "video";
      section.immersiveVideoUrl = builder.videoUrl;
      section.immersiveVideoMode = builder.videoMode;
      section.immersiveLayout = "full-bleed";
      sections.push(section);
      continue;
    }

    if (key === "location") {
      const section = createBrochureSection("location");
      section.title = builder.locationTitle;
      section.subtitle = builder.locationAddress;
      section.body = builder.locationNeighborhood;
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 1);
      section.immersiveVariant = "location";
      section.immersiveLayout = "media-right";
      section.immersiveKeyPoints = builder.locationPoints;
      section.immersiveMapLatitude = builder.locationLatitude ?? undefined;
      section.immersiveMapLongitude = builder.locationLongitude ?? undefined;
      section.immersiveMapZoom = builder.locationZoom;
      section.immersiveMapStyle = builder.locationMapStyle;
      sections.push(section);
      continue;
    }

    if (key === "lifestyle") {
      const section = createBrochureSection("amenities");
      section.title = builder.lifestyleTitle;
      section.subtitle = "";
      section.body = builder.lifestyleBody;
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 2);
      section.immersiveVariant = "lifestyle";
      section.immersiveLayout = "media-left";
      sections.push(section);
      continue;
    }

    if (key === "cta") {
      const section = createBrochureSection("cta");
      section.title = builder.ctaTitle;
      section.subtitle = builder.ctaButtonLabel;
      section.body = builder.ctaBody;
      section.imageIds = takeImages(orderedImageIds, usedImageIds, 1);
      section.immersiveVariant = "cta";
      section.immersiveLayout = "media-right";
      sections.push(section);
    }
  }

  return sections;
}
