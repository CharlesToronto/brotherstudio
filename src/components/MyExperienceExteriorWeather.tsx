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
  precipitation: number;
  precipitationProbability: number;
  maxTemperature: number;
  minTemperature: number;
  isDay: boolean;
};

type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: WeatherPayload };

function getWeatherIcon(code: number | null, isDay: boolean) {
  const iconClassName = "h-5 w-5";

  if (code === null || code === undefined) {
    return <Cloud className={iconClassName} />;
  }

  if (code === 0) {
    return isDay ? <Sun className={iconClassName} /> : <Cloud className={iconClassName} />;
  }

  if ([1, 2].includes(code)) {
    return <CloudSun className={iconClassName} />;
  }

  if ([3, 45, 48].includes(code)) {
    return <Cloud className={iconClassName} />;
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return <CloudDrizzle className={iconClassName} />;
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return <CloudRain className={iconClassName} />;
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return <CloudSnow className={iconClassName} />;
  }

  if ([95, 96, 99].includes(code)) {
    return <CloudLightning className={iconClassName} />;
  }

  return <Cloud className={iconClassName} />;
}

export function MyExperienceExteriorWeather() {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let isCancelled = false;

    const loadWeather = async () => {
      try {
        const response = await fetch("/api/myexperience-weather", { cache: "no-store" });
        const payload = (await response.json()) as WeatherPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "La meteo n'est pas disponible.");
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
      <div className="myExperienceWeatherCard" aria-live="polite">
        <p className="myExperienceWeatherEyebrow">Meteo locale</p>
        <p className="myExperienceWeatherLoading">Chargement des conditions...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="myExperienceWeatherCard" aria-live="polite">
        <p className="myExperienceWeatherEyebrow">Meteo locale</p>
        <p className="myExperienceWeatherLoading">Conditions indisponibles pour le moment.</p>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="myExperienceWeatherCard" aria-live="polite">
      <div className="myExperienceWeatherHeader">
        <div>
          <p className="myExperienceWeatherEyebrow">Meteo locale</p>
          <p className="myExperienceWeatherLocation">{data.location}</p>
        </div>
        <div className="myExperienceWeatherTempWrap">
          <span className="myExperienceWeatherLive" aria-hidden="true" />
          <span className="myExperienceWeatherIcon">
            {getWeatherIcon(data.weatherCode, data.isDay)}
          </span>
          <div className="myExperienceWeatherTemp">
            <span>{data.temperature}°</span>
          </div>
        </div>
      </div>

      <div className="myExperienceWeatherGrid">
        <div>
          <span>Ressenti</span>
          <strong>{data.apparentTemperature}°</strong>
        </div>
        <div>
          <span>Vent</span>
          <strong>{data.windSpeed} km/h</strong>
        </div>
        <div>
          <span>Pluie</span>
          <strong>{data.precipitationProbability}%</strong>
        </div>
        <div>
          <span>Amplitude</span>
          <strong>
            {data.minTemperature}° / {data.maxTemperature}°
          </strong>
        </div>
      </div>
    </div>
  );
}
