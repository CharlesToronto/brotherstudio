import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { getUnsplashAccessKey, isUnsplashConfigured } from "@/lib/unsplash";

export const runtime = "nodejs";

type UnsplashSearchResponse = {
  results?: Array<{
    id?: string;
    alt_description?: string | null;
    description?: string | null;
    width?: number;
    height?: number;
    urls?: {
      thumb?: string;
      regular?: string;
    };
    links?: {
      download_location?: string;
    };
  }>;
};

export async function GET(request: Request) {
  try {
    if (!isUnsplashConfigured()) {
      return NextResponse.json(
        { error: "Unsplash is not configured on the server." },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${getUnsplashAccessKey()}`,
          "Accept-Version": "v1",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to search Unsplash.");
    }

    const payload = (await response.json()) as UnsplashSearchResponse;
    const items = (payload.results ?? [])
      .map((item) => {
        const id = item.id?.trim() ?? "";
        const thumbUrl = item.urls?.thumb?.trim() ?? "";
        const regularUrl = item.urls?.regular?.trim() ?? "";
        const downloadLocation = item.links?.download_location?.trim() ?? "";

        if (!id || !thumbUrl || !regularUrl || !downloadLocation) {
          return null;
        }

        return {
          id,
          alt: item.alt_description?.trim() ?? "",
          description: item.description?.trim() ?? item.alt_description?.trim() ?? "",
          thumbUrl,
          regularUrl,
          width: Number.isFinite(item.width) ? Number(item.width) : 0,
          height: Number.isFinite(item.height) ? Number(item.height) : 0,
          downloadLocation,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to search Unsplash.") },
      { status: 400 },
    );
  }
}
