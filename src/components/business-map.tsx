"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface BusinessMapProps {
  markers: MapMarker[];
  zoom?: number;
}

/**
 * OpenStreetMap via Leaflet, loaded lazily on the client only.
 */
export function BusinessMap({ markers, zoom = 11 }: BusinessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
        maxZoom: 18,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#0b5c76;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const bounds = L.latLngBounds([]);
      for (const m of markers) {
        const marker = L.marker([m.latitude, m.longitude], { icon }).addTo(map);
        marker.bindPopup(
          `<a href="/foretag/${m.slug}" style="font-weight:600">${m.name.replace(/</g, "&lt;")}</a>`,
        );
        bounds.extend([m.latitude, m.longitude]);
      }
      if (markers.length === 1) {
        map.setView([markers[0].latitude, markers[0].longitude], zoom + 3);
      } else {
        map.fitBounds(bounds.pad(0.2));
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [markers, zoom]);

  if (markers.length === 0) return null;
  return <div ref={containerRef} className="ax-map" role="img" aria-label="Karta med företagens platser" />;
}
