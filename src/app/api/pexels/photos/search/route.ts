import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { getPexelsApiKey, isPexelsConfigured } from "@/lib/pexels";

export const runtime = "nodejs";

type PexelsPhotoResponse = {
  photos?: Array<{
    id?: number;
    alt?: string;
    width?: number;
    height?: number;
    src?: {
      tiny?: string;
      small?: string;
      medium?: string;
      large?: string;
      large2x?: string;
      original?: string;
    };
  }>;
};

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
        ? "https://api.pexels.com/v1/curated?per_page=18"
        : query.length >= 2
          ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`
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
      throw new Error("Failed to search Pexels.");
    }

    const payload = (await response.json()) as PexelsPhotoResponse;
    const items = (payload.photos ?? [])
      .map((item) => {
        const id = Number.isFinite(item.id) ? String(item.id) : "";
        const thumbUrl = item.src?.medium?.trim() ?? item.src?.small?.trim() ?? "";
        const regularUrl = item.src?.large2x?.trim() ?? item.src?.large?.trim() ?? "";
        if (!id || !thumbUrl || !regularUrl) return null;

        const alt = (item.alt ?? "").trim();
        return {
          id,
          alt,
          description: alt,
          thumbUrl,
          regularUrl,
          width: Number.isFinite(item.width) ? Number(item.width) : 0,
          height: Number.isFinite(item.height) ? Number(item.height) : 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to search Pexels.") },
      { status: 400 },
    );
  }
}
