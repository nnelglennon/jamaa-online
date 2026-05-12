"use client";

import { useEffect } from "react";

type ReverseGeoResp = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

function guessTown(j: ReverseGeoResp | null): string {
  const a = j?.address;
  return (a?.city || a?.town || a?.village || a?.county || a?.state || "").trim();
}

export default function AskLocationOnVisit() {
  useEffect(() => {
    // Ask only once per browser
    const asked = localStorage.getItem("jamaa_geo_asked");
    if (asked === "1") return;
    localStorage.setItem("jamaa_geo_asked", "1");

    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Best-effort reverse geocode -> set town cookie
        try {
          const la = pos.coords.latitude;
          const lo = pos.coords.longitude;

          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            la
          )}&lon=${encodeURIComponent(lo)}`;

          const res = await fetch(url);
          if (!res.ok) return;

          const json = (await res.json()) as ReverseGeoResp;
          const town = guessTown(json);
          if (!town) return;

          await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ town }),
          });

          // Apply cookies to SSR header by reloading once
          if (!sessionStorage.getItem("jamaa_geo_reloaded")) {
            sessionStorage.setItem("jamaa_geo_reloaded", "1");
            window.location.reload();
          }
        } catch {
          // ignore
        }
      },
      () => {
        // user denied or error - ignore
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  return null;
}