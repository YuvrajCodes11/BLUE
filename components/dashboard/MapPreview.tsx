"use client";

import { useState } from "react";
import { Anchor, Compass, Navigation, Radio, Shield } from "lucide-react";

type GeoPin = {
  id: string;
  name: string;
  type: "landing_site" | "patrol_vessel" | "marine_park";
  county: string;
  coords: string;
  status: string;
  details: string;
  top: string;
  left: string;
};

const mapPins: GeoPin[] = [
  {
    id: "pin-1",
    name: "Kilifi Creek BMU",
    type: "landing_site",
    county: "Kilifi",
    coords: "3.6302° S, 39.8499° E",
    status: "Active (42 boats)",
    details: "Primary coastal landing site with cold storage facility",
    top: "34%",
    left: "58%",
  },
  {
    id: "pin-2",
    name: "Watamu Marine Reserve",
    type: "marine_park",
    county: "Kilifi",
    coords: "3.3541° S, 40.0177° E",
    status: "Protected Zone",
    details: "No-take marine conservation sanctuary under ranger patrol",
    top: "22%",
    left: "64%",
  },
  {
    id: "pin-3",
    name: "Diani Reef Station",
    type: "landing_site",
    county: "Kwale",
    coords: "4.2797° S, 39.5936° E",
    status: "Active (28 boats)",
    details: "Artisanal landing jetty with daily electronic catch logging",
    top: "62%",
    left: "48%",
  },
  {
    id: "pin-4",
    name: "Patrol Vessel PV-04 (KeFS)",
    type: "patrol_vessel",
    county: "Coastline EEZ",
    coords: "4.1200° S, 39.8100° E",
    status: "On Patrol (14.2 kts)",
    details: "Routine MCS enforcement sweep across North/South inshore corridor",
    top: "52%",
    left: "72%",
  },
  {
    id: "pin-5",
    name: "Shimoni BMU",
    type: "landing_site",
    county: "Kwale",
    coords: "4.6477° S, 39.3814° E",
    status: "Active (19 boats)",
    details: "Wasini Channel artisanal tuna and reef fish landing station",
    top: "80%",
    left: "42%",
  },
];

export function MapPreview() {
  const [activePin, setActivePin] = useState<GeoPin>(mapPins[0]);

  return (
    <div className="ocean-panel relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl p-5 shadow-sm">
      {/* Header bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]/60 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-black text-[var(--text)]">GIS Marine Intelligence</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-cyan-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" /> Live Radar Feed
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 text-[var(--muted-text)]">
            Kenya EEZ
          </span>
        </div>
      </div>

      {/* Map visual canvas */}
      <div className="relative mt-3 flex-1 min-h-[220px] rounded-xl border border-[var(--line)] bg-[#031525] overflow-hidden">
        {/* Radar grid lines */}
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(14,165,233,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.12)_1px,transparent_1px)] [background-size:32px_32px]" />
        
        {/* Radar sweep ring */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20 h-64 w-64 animate-[spin_12s_linear_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15 h-44 w-44" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/10 h-24 w-24" />

        {/* Coastal contour line representation */}
        <svg className="absolute inset-0 h-full w-full opacity-35" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path
            d="M 35 0 Q 42 25, 48 50 T 38 100"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
        </svg>

        {/* Interactive map markers */}
        {mapPins.map((pin) => {
          const isSelected = activePin.id === pin.id;
          return (
            <button
              key={pin.id}
              onClick={() => setActivePin(pin)}
              style={{ top: pin.top, left: pin.left }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 transition-all duration-200 ${
                isSelected
                  ? "scale-125 bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.9)]"
                  : "bg-slate-900/90 text-cyan-400 border border-cyan-400/60 hover:scale-110"
              }`}
              title={pin.name}
            >
              {pin.type === "patrol_vessel" ? (
                <Navigation className="h-3.5 w-3.5" />
              ) : pin.type === "marine_park" ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <Anchor className="h-3.5 w-3.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected location info panel */}
      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)]/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-black text-[var(--text)]">{activePin.name}</strong>
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                {activePin.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted-text)]">{activePin.details}</p>
          </div>
          <div className="text-right text-[11px] font-mono text-cyan-500">
            <div>{activePin.coords}</div>
            <div className="text-[var(--muted-text)]">{activePin.county} County</div>
          </div>
        </div>
      </div>
    </div>
  );
}
