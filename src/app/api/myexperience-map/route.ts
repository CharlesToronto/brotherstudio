import { NextResponse } from "next/server";

const DEFAULT_ORIGIN = {
  label: process.env.MESANGE_ADDRESS?.trim() || "Residence Mesange, Gland, VD",
  latitude: Number(process.env.MESANGE_LATITUDE) || 46.4209,
  longitude: Number(process.env.MESANGE_LONGITUDE) || 6.2701,
};

type RouteBody = {
  mode?: "route" | "nearby";
  destinationQuery?: string;
  category?: string;
};

type GeoFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    full_address?: string;
    name?: string;
  };
};

type DirectionsResponse = {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: [number, number][];
      type?: string;
    };
  }>;
};

type SearchBoxFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    full_address?: string;
    feature_type?: string;
  };
  eta?: number;
  distance?: number;
};

function getMapboxToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
}

function normalizeCategory(input: string | undefined) {
  const value = input?.toLowerCase().trim() ?? "";

  if (value.includes("rest") || value.includes("food")) {
    return { id: "food_and_drink", label: "Restaurants a proximite" };
  }

  if (value.includes("cafe") || value.includes("coffee")) {
    return { id: "coffee", label: "Cafes a proximite" };
  }

  if (value.includes("gare") || value.includes("train")) {
    return { id: "train_station", label: "Gares a proximite" };
  }

  if (value.includes("ecole") || value.includes("school")) {
    return { id: "school", label: "Ecoles a proximite" };
  }

  if (value.includes("sport") || value.includes("fitness")) {
    return { id: "fitness_center", label: "Sport et fitness a proximite" };
  }

  if (value.includes("lac") || value.includes("park")) {
    return { id: "park", label: "Lieux de detente a proximite" };
  }

  return { id: "food_and_drink", label: "Adresses a proximite" };
}

async function geocodeDestination(query: string, token: string) {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "fr");
  url.searchParams.set("proximity", `${DEFAULT_ORIGIN.longitude},${DEFAULT_ORIGIN.latitude}`);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("La destination n'a pas pu etre geocodee.");
  }

  const payload = (await response.json()) as { features?: GeoFeature[] };
  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates || coordinates.length < 2) {
    throw new Error("Aucune destination exploitable n'a ete trouvee.");
  }

  return {
    label: feature?.properties?.full_address || feature?.properties?.name || query,
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}

async function fetchRoute(destinationQuery: string, token: string) {
  const destination = await geocodeDestination(destinationQuery, token);
  const coordinates = `${DEFAULT_ORIGIN.longitude},${DEFAULT_ORIGIN.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("language", "fr");
  url.searchParams.set("steps", "false");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("L'itineraire n'a pas pu etre calcule.");
  }

  const payload = (await response.json()) as DirectionsResponse;
  const route = payload.routes?.[0];
  const routeCoordinates = route?.geometry?.coordinates;

  if (!routeCoordinates || routeCoordinates.length < 2) {
    throw new Error("Aucun itineraire exploitable n'a ete retourne.");
  }

  return {
    mode: "route" as const,
    title: "Trajet depuis Mesange",
    summary: `${Math.round((route.distance ?? 0) / 100) / 10} km • ${Math.round((route.duration ?? 0) / 60)} min en voiture`,
    origin: DEFAULT_ORIGIN,
    destination,
    route: {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoordinates,
      },
      properties: {},
    },
  };
}

async function fetchNearby(category: string | undefined, token: string) {
  const normalizedCategory = normalizeCategory(category);
  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/category/${normalizedCategory.id}`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "fr");
  url.searchParams.set("limit", "6");
  url.searchParams.set("proximity", `${DEFAULT_ORIGIN.longitude},${DEFAULT_ORIGIN.latitude}`);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("La recherche de lieux a proximite a echoue.");
  }

  const payload = (await response.json()) as { features?: SearchBoxFeature[] };
  const places = (payload.features ?? [])
    .map((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) return null;

      return {
        label: feature.properties?.name || feature.properties?.full_address || "Lieu",
        subtitle: feature.properties?.full_address || "",
        longitude: coordinates[0],
        latitude: coordinates[1],
        distanceMeters: feature.distance ?? null,
        etaMinutes: feature.eta ?? null,
      };
    })
    .filter(Boolean);

  if (places.length === 0) {
    throw new Error("Aucun lieu pertinent n'a ete trouve a proximite.");
  }

  return {
    mode: "nearby" as const,
    title: normalizedCategory.label,
    summary: `Selection de lieux autour de la residence`,
    origin: DEFAULT_ORIGIN,
    places,
  };
}

export async function POST(request: Request) {
  const token = getMapboxToken();
  if (!token) {
    return NextResponse.json(
      { error: "Aucun token Mapbox n'est configure sur le serveur." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as RouteBody;

    if (body.mode === "route") {
      const destinationQuery = body.destinationQuery?.trim();
      if (!destinationQuery) {
        return NextResponse.json({ error: "La destination est manquante." }, { status: 400 });
      }

      return NextResponse.json(await fetchRoute(destinationQuery, token));
    }

    if (body.mode === "nearby") {
      return NextResponse.json(await fetchNearby(body.category, token));
    }

    return NextResponse.json({ error: "Mode de carte non supporte." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors de l'appel Mapbox.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
