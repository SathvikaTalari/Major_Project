
"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewportProps {
  coordinates: [number, number];
  locationName: string;
  activeLayer: "lulc" | "change" | "lst";
}

export default function MapViewport({
  coordinates,
  locationName,
  activeLayer,
}: MapViewportProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!mapContainer.current) return;

    setMapLoaded(false);
    setMapError("");

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-base": {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },
        layers: [
          {
            id: "osm-base-layer",
            type: "raster",
            source: "osm-base",
          },
        ],
      },
      center: coordinates,
      zoom: 12.2,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.on("error", (event) => {
      console.error("MapLibre error:", event.error);
      setMapError(
        event.error?.message || "Unable to load map tiles."
      );
    });

    map.on("load", () => {
      const [lon, lat] = coordinates;

      map.addSource("aoi-zones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                zone: "Core Water Body",
                type: "water",
              },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [lon - 0.015, lat - 0.012],
                  [lon + 0.014, lat - 0.011],
                  [lon + 0.012, lat + 0.014],
                  [lon - 0.014, lat + 0.012],
                  [lon - 0.015, lat - 0.012],
                ]],
              },
            },
            {
              type: "Feature",
              properties: {
                zone: "Northern Buffer Hotspot",
                type: "hotspot",
              },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [lon - 0.022, lat + 0.013],
                  [lon + 0.018, lat + 0.013],
                  [lon + 0.018, lat + 0.024],
                  [lon - 0.022, lat + 0.024],
                  [lon - 0.022, lat + 0.013],
                ]],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "aoi-fill",
        type: "fill",
        source: "aoi-zones",
        paint: {
          "fill-color": [
            "match",
            ["get", "type"],
            "water",
            "#00f2fe",
            "hotspot",
            "#f97316",
            "#10b981",
          ],
          "fill-opacity": 0.32,
        },
      });

      map.addLayer({
        id: "aoi-outline",
        type: "line",
        source: "aoi-zones",
        paint: {
          "line-color": "#00f2fe",
          "line-width": 2,
        },
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded() ||
        !map.getLayer("aoi-fill")) return;

    const colorMap = {
      lulc: "#10b981",
      change: "#00f2fe",
      lst: "#ef4444",
    };

    map.setPaintProperty("aoi-fill", "fill-color", [
      "match",
      ["get", "type"],
      "water",
      activeLayer === "lst" ? "#38bdf8" : "#00f2fe",
      "hotspot",
      colorMap[activeLayer],
      "#10b981",
    ]);
  }, [activeLayer, mapLoaded]);

  return (
    <div className="relative h-[420px] w-full rounded-xl overflow-hidden border border-slate-800">
      <div ref={mapContainer} className="h-full w-full" />

      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-slate-300 text-sm">
          Loading geospatial map...
        </div>
      )}

      {mapError && (
        <div className="absolute top-3 left-3 right-3 bg-red-950/90 border border-red-500 rounded-lg p-3 text-xs text-white">
          Map loading issue: {mapError}
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-[#0b0f19]/90 backdrop-blur border border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-200">
        <div className="font-semibold text-[#00f2fe]">
          {locationName}
        </div>

        <div className="text-slate-400">
          Active Overlay:{" "}
          <span className="uppercase text-emerald-400">
            {activeLayer}
          </span>
          {" "}• WGS84
        </div>
      </div>
    </div>
  );
}
