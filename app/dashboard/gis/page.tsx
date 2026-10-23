"use client";

import { useState } from "react";
import { Compass, Eye, Filter, Layers, Navigation, Radio, Shield, Waves } from "lucide-react";
import { MapPreview } from "@/components/dashboard/MapPreview";

const layerToggles = [
  { id: "landing_sites", label: "Landing Sites (18)", active: true, icon: Waves, color: "text-cyan-400" },
  { id: "vessels", label: "Live AIS Vessels (42)", active: true, icon: Navigation, color: "text-emerald-400" },
  { id: "mpa", label: "Marine Protected Areas (6)", active: true, icon: Shield, color: "text-violet-400" },
  { id: "eez", label: "Kenya EEZ Boundary (200 NM)", active: true, icon: Compass, color: "text-amber-400" },
];

export default function Page() {
  const [layers, setLayers] = useState(layerToggles);

  function toggleLayer(id: string) {
    setLayers((curr) => curr.map((l) => (l.id === id ? { ...l, active: !l.active } : l)));
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">Spatial Telemetry</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">GIS Marine Intelligence</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted-text)]">
            High-resolution spatial tracking for Kenyan coastal landing stations, patrol vessel movements, and marine conservation zones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-400">
            <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" /> WGS84 Geodetic Feed Active
          </span>
        </div>
      </div>

      {/* Layer selector bar */}
      <div className="ocean-panel flex flex-wrap items-center gap-3 rounded-2xl p-4 shadow-sm">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--muted-text)]">
          <Layers className="h-4 w-4 text-cyan-400" /> Active GIS Layers:
        </span>
        {layers.map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                l.active
                  ? "border-cyan-400/50 bg-cyan-400/15 text-[var(--text)] shadow-sm"
                  : "border-[var(--line)] bg-[var(--soft)]/50 text-[var(--muted-text)] opacity-60"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${l.active ? l.color : "text-gray-400"}`} />
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Map View */}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.35fr]">
        <MapPreview />

        <div className="ocean-panel flex flex-col rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-black text-[var(--text)]">Telemetry Radar Status</h3>
          <p className="mt-1 text-xs text-[var(--muted-text)]">Inshore station telemetry health</p>

          <div className="mt-4 grid gap-3">
            {[
              { station: "Kilifi Creek Sensor Hub", ping: "28ms", boats: "42 Craft", status: "Optimal" },
              { station: "Diani Jetty Radar Post", ping: "34ms", boats: "28 Craft", status: "Optimal" },
              { station: "Shimoni Wasini Repeater", ping: "45ms", boats: "19 Craft", status: "Active" },
              { station: "Watamu Park Buoy Beacon", ping: "22ms", boats: "35 Craft", status: "Optimal" },
              { station: "Homa Bay Lake Station", ping: "52ms", boats: "64 Craft", status: "Active" },
            ].map((st) => (
              <div key={st.station} className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-[var(--text)]">{st.station}</strong>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-bold text-emerald-500">
                    {st.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[var(--muted-text)]">
                  <span>Ping: {st.ping}</span>
                  <span className="font-semibold text-cyan-400">{st.boats} detected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
