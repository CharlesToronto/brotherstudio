import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { getPexelsApiKey, isPexelsConfigured } from "@/lib/pexels";

export const runtime = "nodejs";

type PexelsVideoResponse = {
  videos?: Array<{
    id?: number;
    image?: string;
    width?: number;
    height?: number;
    duration?: number;
    video_files?: Array<{
      id?: number;
      quality?: string;
      file_type?: string;
      width?: number;
      height?: number;
      link?: string;
    }>;
  }>;
};

function pickBestMp4(files: NonNullable<PexelsVideoResponse["videos"]>[number]["video_files"]) {
  const candidates = (files ?? [])
    .filter((file) => (file.file_type ?? "").toLowerCase().includes("mp4") && file.link)
    .map((file) => ({
      link: file.link!.trim(),
      quality: (file.quality ?? "").toLowerCase(),
      width: Number.isFinite(file.width) ? Number(file.width) : 0,
      height: Number.isFinite(file.height) ? Number(file.height) : 0,
    }))
    .filter((file) => file.link.length > 0);

  if (candidates.length === 0) return null;

  // Prefer HD, then by resolution.
  const score = (candidate: (typeof candidates)[number]) =>
    (candidate.quality === "hd" ? 10_000_000 : 0) + candidate.width * candidate.height;

  return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
}

export async function GET(request: Request) {
  try {
    if (!isPexelsConfigured()) {
      return NextResponse.json(
        { error: "Pexels is not configured on the server." },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const mode = searchParams.get("mode")?.trim() ?? "";

    const endpoint =
      mode === "default" && query.length === 0
        ? "https://api.pexels.com/videos/popular?per_page=18"
        : query.length >= 2
          ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`
          : "";

    if (!endpoint) {
      return NextResponse.json({ items: [] });
    }

    const response = await fetch(
      endpoint,
      {
        headers: {
          Authorization: getPexelsApiKey(),
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to search Pexels videos.");
    }

    const payload = (await response.json()) as PexelsVideoResponse;
    const items = (payload.videos ?? [])
      .map((video) => {
        const id = Number.isFinite(video.id) ? String(video.id) : "";
        const thumbUrl = video.image?.trim() ?? "";
        const file = pickBestMp4(video.video_files);
        if (!id || !thumbUrl || !file?.link) return null;

        return {
          id,
          description: "",
          thumbUrl,
          videoUrl: file.link,
          width: Number.isFinite(video.width) ? Number(video.width) : file.width,
          height: Number.isFinite(video.height) ? Number(video.height) : file.height,
          duration: Number.isFinite(video.duration) ? Number(video.duration) : 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to search Pexels videos.") },
      { status: 400 },
    );
  }
}
