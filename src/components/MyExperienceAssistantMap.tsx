"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature, LineString } from "geojson";
import maplibregl from "maplibre-gl";

type MapPoint = {
  label: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  etaMinutes?: number | null;
};

type AssistantMapData =
  | {
      mode: "route";
      title: string;
      summary: string;
      origin: MapPoint;
      destination: MapPoint;
      route: Feature<LineString>;
    }
  | {
      mode: "nearby";
      title: string;
      summary: string;
      origin: MapPoint;
      places: MapPoint[];
    };

type MyExperienceAssistantMapProps = {
  data: AssistantMapData;
};

const MAPBOX_STYLE = "mapbox/light-v11";

function formatDistance(distanceMeters?: number | null) {
  if (!distanceMeters) return null;
  return `${Math.round(distanceMeters / 100) / 10} km`;
}

export function MyExperienceAssistantMap({ data }: MyExperienceAssistantMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerNodeMapRef = useRef(new Map<string, HTMLDivElement>());
  const [hoveredPlaceKey, setHoveredPlaceKey] = useState<string | null>(null);

  const getPlaceKey = (point: MapPoint) => `${point.label}-${point.longitude}-${point.latitude}`;

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const container = containerRef.current;

    if (!token || !container) return;

    const markerNodeMap = markerNodeMapRef.current;
    markerNodeMap.clear();

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          "mapbox-raster-tiles": {
            type: "raster",
            tiles: [
              `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "mapbox-raster-layer",
            type: "raster",
            source: "mapbox-raster-tiles",
          },
        ],
      },
      attributionControl: false,
      cooperativeGestures: true,
      center: [data.origin.longitude, data.origin.latitude],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const bounds = new maplibregl.LngLatBounds();
    const markers: maplibregl.Marker[] = [];

    const addMarker = (point: MapPoint, accentClassName: string, markerKey?: string) => {
      const markerNode = document.createElement("div");
      markerNode.className = accentClassName;
      if (markerKey) markerNodeMap.set(markerKey, markerNode);
      const marker = new maplibregl.Marker({ element: markerNode })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 18 }).setHTML(
            `<strong>${point.label}</strong>${point.subtitle ? `<div>${point.subtitle}</div>` : ""}`,
          ),
        )
        .addTo(map);

      bounds.extend([point.longitude, point.latitude]);
      markers.push(marker);
    };

    map.on("load", () => {
      addMarker(data.origin, "myExperienceAssistantMapMarker myExperienceAssistantMapMarkerOrigin");

      if (data.mode === "route") {
        addMarker(
          data.destination,
          "myExperienceAssistantMapMarker myExperienceAssistantMapMarkerDestination",
        );

        map.addSource("assistant-route", {
          type: "geojson",
          data: data.route,
        });

        map.addLayer({
          id: "assistant-route-line",
          type: "line",
          source: "assistant-route",
          paint: {
            "line-color": "#111111",
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });

        data.route.geometry.coordinates.forEach((coordinate) => {
          bounds.extend(coordinate as [number, number]);
        });
      } else {
        data.places.forEach((place) => {
          addMarker(
            place,
            "myExperienceAssistantMapMarker myExperienceAssistantMapMarkerPoi",
            getPlaceKey(place),
          );
        });
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 56, maxZoom: data.mode === "route" ? 12.5 : 13.5 });
      }
    });

    return () => {
      markerNodeMap.clear();
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [data]);

  useEffect(() => {
    if (data.mode !== "nearby") return;

    markerNodeMapRef.current.forEach((node, key) => {
      node.classList.toggle("is-hovered", key === hoveredPlaceKey);
    });
  }, [data.mode, hoveredPlaceKey]);

  return (
    <div className="myExperienceAssistantMapCard">
      <div className="myExperienceAssistantMapHeader">
        <div>
          <p className="myExperienceAssistantMapTitle">{data.title}</p>
          <p className="myExperienceAssistantMapSummary">{data.summary}</p>
        </div>
      </div>

      <div ref={containerRef} className="myExperienceAssistantMapCanvas" />

      {data.mode === "route" ? (
        <div className="myExperienceAssistantMapLegend">
          <div className="myExperienceAssistantMapLegendItem">
            <span className="myExperienceAssistantMapLegendDot myExperienceAssistantMapLegendDotOrigin" />
            <span>{data.origin.label}</span>
          </div>
          <div className="myExperienceAssistantMapLegendItem">
            <span className="myExperienceAssistantMapLegendDot myExperienceAssistantMapLegendDotDestination" />
            <span>{data.destination.label}</span>
          </div>
        </div>
      ) : (
        <div className="myExperienceAssistantMapPlaces">
          {data.places.slice(0, 4).map((place) => (
            <div
              key={getPlaceKey(place)}
              className={`myExperienceAssistantMapPlace${
                hoveredPlaceKey === getPlaceKey(place) ? " is-hovered" : ""
              }`}
              onMouseEnter={() => setHoveredPlaceKey(getPlaceKey(place))}
              onMouseLeave={() => setHoveredPlaceKey(null)}
            >
              <div>
                <p className="myExperienceAssistantMapPlaceLabel">{place.label}</p>
                {place.subtitle ? (
                  <p className="myExperienceAssistantMapPlaceMeta">{place.subtitle}</p>
                ) : null}
              </div>
              <div className="myExperienceAssistantMapPlaceStats">
                {place.distanceMeters ? <span>{formatDistance(place.distanceMeters)}</span> : null}
                {place.etaMinutes ? <span>{Math.round(place.etaMinutes)} min</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
