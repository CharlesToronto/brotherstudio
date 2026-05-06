export type PexelsSearchPhoto = {
  id: string;
  alt: string;
  description: string;
  thumbUrl: string;
  regularUrl: string;
  width: number;
  height: number;
};

export type PexelsSearchVideo = {
  id: string;
  description: string;
  thumbUrl: string;
  videoUrl: string;
  width: number;
  height: number;
  duration: number;
};

export type BrochureDraggedMedia =
  | { source: "library"; imageId: string }
  | { source: "pexels-photo"; photo: PexelsSearchPhoto }
  | { source: "pexels-video"; video: PexelsSearchVideo };

export function getPexelsApiKey() {
  return process.env.PEXELS_API_KEY?.trim() ?? "";
}

export function isPexelsConfigured() {
  return Boolean(getPexelsApiKey());
}

