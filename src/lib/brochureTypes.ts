export type BrochureTemplate = "minimal" | "modern" | "luxury";

export type BrochureFontFamily =
  | "helvetica"
  | "garamond"
  | "georgia"
  | "times";

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

export type BrochureCanvasTextAlign = "left" | "center" | "right";

export type BrochureCanvasItemKind =
  | "copy"
  | "media"
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
      kind: "text";
      textContent: string;
      textAlign: BrochureCanvasTextAlign;
      fontSize: number;
      isBold?: boolean;
      isItalic?: boolean;
    })
  | (BrochureCanvasItemBase & {
      kind: "shape";
      shapeType: BrochureCanvasShapeType;
      strokeWidth?: number;
      isFilled?: boolean;
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
  accentColor: string;
  logoUrl?: string | null;
};

export type BrochureSectionKind =
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
  bgColor?: string;
};

export type BrochureContent = {
  imageOrder: string[];
  selectedImageIds: string[];
  sections: BrochureSection[];
};

export type BrochureProjectSummary = {
  projectId: string;
  brochureId: string | null;
  name: string;
  createdAt: string;
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
  approvedImages: BrochureApprovedImage[];
  extraAssets: BrochureAsset[];
};
