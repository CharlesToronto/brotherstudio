export type BrochureTemplate = "minimal" | "modern" | "luxury";

export type BrochureFontFamily =
  | "helvetica"
  | "garamond"
  | "georgia"
  | "times";

export type BrochureApprovedImage = {
  id: string;
  projectId: string;
  url: string;
  version: number;
  createdAt: string;
};

export type BrochureAsset = {
  id: string;
  projectId: string;
  kind: "extra";
  url: string;
  fileName: string;
  createdAt: string;
};

export type BrochureSettings = {
  projectId: string;
  template: BrochureTemplate;
  title: string;
  subtitle: string;
  body: string;
  headingColor: string;
  bodyColor: string;
  accentColor: string;
  fontFamily: BrochureFontFamily;
  selectedImageIds: string[];
  logoUrl: string | null;
  updatedAt: string | null;
};

export type BrochureProjectSummary = {
  id: string;
  name: string;
  createdAt: string;
  coverImageUrl: string | null;
  approvedImageCount: number;
  latestApprovedVersion: number;
};

export type BrochureProject = BrochureProjectSummary & {
  settings: BrochureSettings;
  approvedImages: BrochureApprovedImage[];
  assets: BrochureAsset[];
};
