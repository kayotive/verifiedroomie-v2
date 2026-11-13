"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

type Pin = { lat: number; lng: number };
type Result = { display_name: string; lat: string; lon: string };

const ABUJA: [number, number] = [9.0765, 7.3986];

export default function LocationPicker({
  onChange,
}: {
  onChange: (pin: Pin) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const placePin = useCallback((lat: number, lng: number, zoom?: number) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: "📍",
        className: "text-3xl",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    }

    if (zoom) map.flyTo([lat, lng], zoom);
    onChangeRef.current({ lat, lng });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current).setView(ABUJA, 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (e) => placePin(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [placePin]);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMessage("");
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ng&limit=5&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url);
      const data: Result[] = await res.json();
      if (data.length === 0) {
        setMessage(
          "No match found. Try a nearby area or landmark, then tap the map to drop the pin on your building."
        );
      }
      setResults(data);
    } catch {
      setMessage("Search is unavailable right now. You can still tap the map to drop the pin.");
    }
    setSearching(false);
  }

  function locateMe() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Your browser can't share your location. Tap the map instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => placePin(pos.coords.latitude, pos.coords.longitude, 17),
      () => setMessage("Couldn't get your location. Allow location access, or tap the map instead.")
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search e.g. Jikwoyi, Abuja"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-gray-200">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  placePin(parseFloat(r.lat), parseFloat(r.lon), 16);
                  setResults([]);
                }}
                className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="text-sm text-amber-700">{message}</p>}

      <div
        ref={containerRef}
        className="relative z-0 h-64 w-full overflow-hidden rounded-xl border border-gray-300"
      />

      <button
        type="button"
        onClick={locateMe}
        className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        📍 Use my current location
      </button>
      <p className="text-xs text-gray-500">
        Tap the map or drag the pin to place it exactly on your apartment.
      </p>
    </div>
  );
}