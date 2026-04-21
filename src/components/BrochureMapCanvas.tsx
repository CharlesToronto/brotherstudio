"use client";

import { useEffect, useRef } from "react";

type BrochureMapCanvasProps = {
  latitude: number;
  longitude: number;
  zoom: number;
  mapStyle: "minimalMono" | "minimalWarm" | "minimalBlue" | "color" | "dark";
  interactive: boolean;
  capturePointerEvents?: boolean;
};

const MAP_STYLE_URLS: Record<BrochureMapCanvasProps["mapStyle"], string> = {
  minimalMono: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
  minimalWarm: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
  minimalBlue: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
  color: "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
};

export function BrochureMapCanvas({
  latitude,
  longitude,
  zoom,
  mapStyle,
  interactive,
  capturePointerEvents = false,
}: BrochureMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const initialOptionsRef = useRef({
    latitude,
    longitude,
    zoom,
    mapStyle,
    interactive,
  });

  useEffect(() => {
    let disposed = false;

    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      const initialOptions = initialOptionsRef.current;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URLS[initialOptions.mapStyle],
        center: [initialOptions.longitude, initialOptions.latitude],
        zoom: initialOptions.zoom,
        attributionControl: false,
        dragPan: initialOptions.interactive,
        scrollZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        dragRotate: false,
        keyboard: false,
        touchZoomRotate: initialOptions.interactive,
      });

      map.touchPitch.disable();
      mapRef.current = map;
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setCenter([longitude, latitude]);
    map.setZoom(zoom);
  }, [latitude, longitude, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(MAP_STYLE_URLS[mapStyle]);
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (interactive) {
      map.dragPan.enable();
      map.touchZoomRotate.enable();
    } else {
      map.dragPan.disable();
      map.touchZoomRotate.disable();
    }
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className="brochureCanvasMapSurface"
      data-map-style={mapStyle}
      onPointerDownCapture={
        capturePointerEvents ? (event) => event.stopPropagation() : undefined
      }
      onClickCapture={capturePointerEvents ? (event) => event.stopPropagation() : undefined}
      onDoubleClickCapture={
        capturePointerEvents ? (event) => event.stopPropagation() : undefined
      }
    />
  );
}
