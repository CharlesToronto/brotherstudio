import { NextRequest, NextResponse } from "next/server";

type NominatimSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (searchQuery.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const upstreamUrl = new URL("https://nominatim.openstreetmap.org/search");
  upstreamUrl.searchParams.set("q", searchQuery);
  upstreamUrl.searchParams.set("format", "jsonv2");
  upstreamUrl.searchParams.set("addressdetails", "1");
  upstreamUrl.searchParams.set("limit", "5");

  const response = await fetch(upstreamUrl, {
    headers: {
      "accept-language": request.headers.get("accept-language") ?? "fr,en",
      "user-agent": "BrotherStudio myBrochure map search",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { suggestions: [], error: "Failed to fetch map suggestions." },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as NominatimSearchResult[];
  const suggestions = payload
    .map((entry) => {
      const label = entry.display_name?.trim() ?? "";
      const latitude = Number(entry.lat);
      const longitude = Number(entry.lon);

      if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        label,
        latitude,
        longitude,
      };
    })
    .filter((entry): entry is { label: string; latitude: number; longitude: number } =>
      Boolean(entry),
    );

  return NextResponse.json({ suggestions });
}
