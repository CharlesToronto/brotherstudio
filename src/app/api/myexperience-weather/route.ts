import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESANGE_LATITUDE = Number(process.env.MESANGE_LATITUDE) || 46.4192167;
const MESANGE_LONGITUDE = Number(process.env.MESANGE_LONGITUDE) || 6.2758194;

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    is_day?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

function getWeatherLabel(code: number | undefined) {
  if (code === undefined) return "Conditions indisponibles";
  if (code === 0) return "Ciel degage";
  if ([1, 2].includes(code)) return "Peu nuageux";
  if (code === 3) return "Couvert";
  if ([45, 48].includes(code)) return "Brume";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67].includes(code)) return "Pluie";
  if ([71, 73, 75, 77].includes(code)) return "Neige";
  if ([80, 81, 82].includes(code)) return "Averses";
  if ([85, 86].includes(code)) return "Averses de neige";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Conditions variables";
}

export async function GET() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(MESANGE_LATITUDE));
  url.searchParams.set("longitude", String(MESANGE_LONGITUDE));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "precipitation",
      "is_day",
    ].join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ].join(","),
  );
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "Europe/Zurich");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("La meteo n'a pas pu etre chargee.");
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const current = payload.current;
    const daily = payload.daily;

    return NextResponse.json({
      location: "Mesange, Gland",
      temperature: Math.round(current?.temperature_2m ?? 0),
      apparentTemperature: Math.round(current?.apparent_temperature ?? 0),
      weatherCode: current?.weather_code ?? null,
      weatherLabel: getWeatherLabel(current?.weather_code),
      windSpeed: Math.round(current?.wind_speed_10m ?? 0),
      precipitation: Math.round(current?.precipitation ?? 0),
      precipitationProbability: Math.round(daily?.precipitation_probability_max?.[0] ?? 0),
      maxTemperature: Math.round(daily?.temperature_2m_max?.[0] ?? 0),
      minTemperature: Math.round(daily?.temperature_2m_min?.[0] ?? 0),
      isDay: Boolean(current?.is_day ?? 1),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors du chargement meteo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
