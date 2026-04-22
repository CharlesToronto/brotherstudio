export type UnsplashSearchPhoto = {
  id: string;
  alt: string;
  description: string;
  thumbUrl: string;
  regularUrl: string;
  width: number;
  height: number;
  downloadLocation: string;
};

export type BrochureDraggedImage =
  | {
      source: "library";
      imageId: string;
    }
  | {
      source: "unsplash";
      photo: UnsplashSearchPhoto;
    };

export function getUnsplashAccessKey() {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() ?? "";
}

export function isUnsplashConfigured() {
  return Boolean(getUnsplashAccessKey());
}
