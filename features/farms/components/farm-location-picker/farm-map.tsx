"use client";

import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";

import type { FarmLocation } from "@/features/farms/types/farms";

interface FarmMapProps {
  location?: FarmLocation;
  onSelect: (location: FarmLocation) => void;
}

interface MapClickHandlerProps {
  onSelect: (location: FarmLocation) => void;
}

function MapClickHandler({
  onSelect,
}: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

interface MapControllerProps {
  location?: FarmLocation;
}

function MapController({
  location,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.flyTo(
      [location.latitude, location.longitude],
      Math.max(map.getZoom(), 15),
      {
        duration: 0.8,
      },
    );
  }, [location, map]);

  return null;
}

export default function FarmMap({
  location,
  onSelect,
}: FarmMapProps) {
  return (
    <MapContainer
      center={
        location
          ? [location.latitude, location.longitude]
          : [35.6892, 51.389]
      }
      zoom={location ? 15 : 6}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onSelect={onSelect} />

      <MapController location={location} />

      {location && (
        <CircleMarker
          center={[
            location.latitude,
            location.longitude,
          ]}
          radius={10}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "var(--primary)",
            fillOpacity: 1,
          }}
        />
      )}
    </MapContainer>
  );
}