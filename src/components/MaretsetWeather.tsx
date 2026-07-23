"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";

type WeatherPayload = {
  location: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number | null;
  weatherLabel: string;
  windSpeed: number;
  precipitationProbability: number;
  maxTemperature: number;
  minTemperature: number;
  isDay: boolean;
};

type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: WeatherPayload };

type MaretsetWeatherProps = {
  locale: "fr" | "en";
};

const NENDAZ_LATITUDE = 46.1834;
const NENDAZ_LONGITUDE = 7.2942;

function getWeatherIcon(code: number | null, isDay: boolean) {
  const className = "maretsetWeatherIconSvg";

  if (code === null || code === undefined) return <Cloud className={className} />;
  if (code === 0) return isDay ? <Sun className={className} /> : <Cloud className={className} />;
  if ([1, 2].includes(code)) return <CloudSun className={className} />;
  if ([3, 45, 48].includes(code)) return <Cloud className={className} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle className={className} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={className} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

export function MaretsetWeather({ locale }: MaretsetWeatherProps) {
  const [state, setState] = useState<WeatherState>({ status: "loading" });
  const isFr = locale === "fr";

  useEffect(() => {
    let isCancelled = false;

    const loadWeather = async () => {
      const params = new URLSearchParams({
        latitude: String(NENDAZ_LATITUDE),
        longitude: String(NENDAZ_LONGITUDE),
        location: "Haute-Nendaz, Valais",
        timezone: "Europe/Zurich",
      });

      try {
        const response = await fetch(`/api/myexperience-weather?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as WeatherPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Weather unavailable.");
        }

        if (!isCancelled) {
          setState({ status: "ready", data: payload });
        }
      } catch {
        if (!isCancelled) {
          setState({ status: "error" });
        }
      }
    };

    void loadWeather();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <aside className="maretsetWeatherCard" aria-live="polite">
        <p className="maretsetWeatherEyebrow">{isFr ? "Meteo locale" : "Local weather"}</p>
        <p className="maretsetWeatherLoading">{isFr ? "Chargement des conditions..." : "Loading conditions..."}</p>
      </aside>
    );
  }

  if (state.status === "error") {
    return (
      <aside className="maretsetWeatherCard" aria-live="polite">
        <p className="maretsetWeatherEyebrow">{isFr ? "Meteo locale" : "Local weather"}</p>
        <p className="maretsetWeatherLoading">
          {isFr ? "Conditions indisponibles pour le moment." : "Conditions are unavailable right now."}
        </p>
      </aside>
    );
  }

  const { data } = state;

  return (
    <aside className="maretsetWeatherCard" aria-live="polite">
      <div className="maretsetWeatherHeader">
        <div>
          <p className="maretsetWeatherEyebrow">{isFr ? "Meteo locale" : "Local weather"}</p>
          <h3>{isFr ? "Conditions du jour" : "Today’s conditions"}</h3>
          <p>{data.weatherLabel}</p>
        </div>
        <div className="maretsetWeatherTempBlock">
          <span className="maretsetWeatherLive" aria-hidden="true" />
          <span className="maretsetWeatherIcon">
            {getWeatherIcon(data.weatherCode, data.isDay)}
          </span>
          <strong>{data.temperature}°</strong>
        </div>
      </div>

      <div className="maretsetWeatherGrid">
        <div>
          <span>{isFr ? "Ressenti" : "Feels like"}</span>
          <strong>{data.apparentTemperature}°</strong>
        </div>
        <div>
          <span>{isFr ? "Vent" : "Wind"}</span>
          <strong>{data.windSpeed} km/h</strong>
        </div>
        <div>
          <span>{isFr ? "Pluie" : "Rain"}</span>
          <strong>{data.precipitationProbability}%</strong>
        </div>
        <div>
          <span>{isFr ? "Min / max" : "Min / max"}</span>
          <strong>
            {data.minTemperature}° / {data.maxTemperature}°
          </strong>
        </div>
      </div>
    </aside>
  );
}
