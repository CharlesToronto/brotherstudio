export type BrochureTemplate = "minimal" | "modern" | "luxury";

export type BrochureFontFamily =
  | "helvetica"
  | "garamond"
  | "georgia"
  | "times";

export type BrochureOrientation = "portrait" | "landscape";
export type BrochureExperienceMode = "brochure" | "immersive";
export type BrochureImmersiveTheme = "light" | "dark" | "warm" | "editorial";
export type BrochureImmersiveMotionPreset = "soft" | "cinematic" | "bold";
export type BrochureImmersiveVisualStyle =
  | "luxury-minimal"
  | "modern-real-estate"
  | "warm-lifestyle";
export type BrochureImmersiveAnimationLevel = "minimal" | "subtle" | "cinematic";
export type BrochureImmersiveSectionKey =
  | "hero"
  | "gallery"
  | "video"
  | "key-points"
  | "description"
  | "location"
  | "lifestyle"
  | "cta";
export type BrochureImmersiveVideoMode = "background" | "section";
export type BrochureImmersiveSectionVariant =
  | "standard"
  | "gallery"
  | "video"
  | "key-points"
  | "location"
  | "lifestyle"
  | "cta";
export type BrochureImmersiveMediaAspect = "portrait" | "square" | "landscape";

export type BrochureSocialLinkKey =
  | "website"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "x";

export type BrochureSocialLinks = Partial<
  Record<BrochureSocialLinkKey, string>
>;

export type BrochureCanvasShapeType =
  | "rectangle"
  | "square"
  | "circle"
  | "line"
  | "arrow";

export type BrochureCanvasTextAlign = "left" | "center" | "right" | "justify";

export type BrochureCanvasItemKind =
  | "copy"
  | "media"
  | "photo"
  | "map"
  | "logo"
  | "projectMeta"
  | "socialLinks"
  | "text"
  | "shape";

type BrochureCanvasItemBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color?: string;
};

export type BrochureCanvasItem =
  | (BrochureCanvasItemBase & {
      kind: "copy" | "media" | "logo" | "projectMeta" | "socialLinks";
    })
  | (BrochureCanvasItemBase & {
      kind: "photo";
      imageId: string;
    })
  | (BrochureCanvasItemBase & {
      kind: "map";
      address: string;
      latitude: number;
      longitude: number;
      zoom: number;
      mapStyle?:
        | "minimalMono"
        | "minimalWarm"
        | "minimalBlue"
        | "color"
        | "dark";
      isInteractive?: boolean;
      showAddressLabel?: boolean;
    })
  | (BrochureCanvasItemBase & {
      kind: "text";
      textContent: string;
      textAlign: BrochureCanvasTextAlign;
      fontSize: number;
      isBold?: boolean;
      isItalic?: boolean;
      showBackground?: boolean;
      showBorder?: boolean;
    })
  | (BrochureCanvasItemBase & {
      kind: "shape";
      shapeType: BrochureCanvasShapeType;
      strokeWidth?: number;
    });

export type BrochureImageSource = "approved" | "extra";

export type BrochureImageItem = {
  id: string;
  refId: string;
  source: BrochureImageSource;
  projectId: string;
  url: string;
  label: string;
  meta: string;
  createdAt: string;
};

export type BrochureApprovedImage = BrochureImageItem & {
  source: "approved";
  version: number;
};

export type BrochureAsset = BrochureImageItem & {
  source: "extra";
  fileName: string;
};

export type BrochureStyleSettings = {
  fontFamily: BrochureFontFamily;
  orientation: BrochureOrientation;
  accentColor: string;
  backgroundColor: string;
  logoUrl?: string | null;
};

export type BrochureSectionKind =
  | "blank"
  | "cover"
  | "introduction"
  | "location"
  | "architecture"
  | "exteriors"
  | "interiors"
  | "plans"
  | "typologies"
  | "amenities"
  | "advantages"
  | "practical"
  | "cta"
  | "final";

export type BrochureSectionDefinition = {
  kind: BrochureSectionKind;
  label: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBody: string;
};

export type BrochureSection = {
  id: string;
  kind: BrochureSectionKind;
  title: string;
  subtitle: string;
  body: string;
  imageIds: string[];
  layoutItems: BrochureCanvasItem[];
  socialLinks?: BrochureSocialLinks;
  isHidden?: boolean;
  immersiveVariant?: BrochureImmersiveSectionVariant;
  immersiveLayout?: "media-left" | "media-right" | "full-bleed";
  immersiveMediaAspect?: BrochureImmersiveMediaAspect;
  immersiveMediaFocusX?: number;
  immersiveMediaFocusY?: number;
  immersiveKeyPoints?: string[];
  immersiveVideoUrl?: string;
  immersiveVideoMode?: BrochureImmersiveVideoMode;
  immersiveMapLatitude?: number;
  immersiveMapLongitude?: number;
  immersiveMapZoom?: number;
  immersiveMapStyle?: "minimalMono" | "minimalWarm" | "minimalBlue" | "color" | "dark";
};

export type BrochureContent = {
  imageOrder: string[];
  selectedImageIds: string[];
  sections: BrochureSection[];
  experienceMode?: BrochureExperienceMode;
  immersiveSettings?: BrochureImmersiveSettings;
  immersiveBuilder?: BrochureImmersiveBuilder;
};

export type BrochureImmersiveSettings = {
  theme: BrochureImmersiveTheme;
  motionPreset: BrochureImmersiveMotionPreset;
  showProgressNav: boolean;
};

export type BrochureImmersiveBuilder = {
  selectedSections: BrochureImmersiveSectionKey[];
  visualStyle: BrochureImmersiveVisualStyle;
  animationLevel: BrochureImmersiveAnimationLevel;
  heroImageId: string;
  galleryImageIds: string[];
  videoUrl: string;
  videoMode: BrochureImmersiveVideoMode;
  keyPointsTitle: string;
  keyPoints: string[];
  descriptionTitle: string;
  descriptionBody: string;
  locationTitle: string;
  locationAddress: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationZoom: number;
  locationMapStyle: "minimalMono" | "minimalWarm" | "minimalBlue" | "color" | "dark";
  locationNeighborhood: string;
  locationPoints: string[];
  lifestyleTitle: string;
  lifestyleBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButtonLabel: string;
};

export type BrochureProjectSummary = {
  projectId: string;
  brochureId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  coverImageUrl: string | null;
  approvedImageCount: number;
  latestApprovedVersion: number;
};

export type BrochureProject = BrochureProjectSummary & {
  brochureId: string;
  template: BrochureTemplate;
  title: string;
  subtitle: string;
  body: string;
  styleSettings: BrochureStyleSettings;
  content: BrochureContent;
  experienceMode: BrochureExperienceMode;
  immersiveSettings: BrochureImmersiveSettings;
  approvedImages: BrochureApprovedImage[];
  extraAssets: BrochureAsset[];
};
