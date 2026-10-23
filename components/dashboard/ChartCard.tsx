"use client";

import { useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

const monthlyData = [
  { month: "May", tons: 142, revenue: 14.8, activeBoats: 180 },
  { month: "Jun", tons: 168, revenue: 17.5, activeBoats: 195 },
  { month: "Jul", tons: 195, revenue: 21.2, activeBoats: 210 },
  { month: "Aug", tons: 182, revenue: 19.6, activeBoats: 205 },
  { month: "Sep", tons: 224, revenue: 25.1, activeBoats: 230 },
  { month: "Oct", tons: 258, revenue: 28.4, activeBoats: 248 },
];

export function ChartCard({ title }: { title: string }) {
  const [activeIdx, setActiveIdx] = useState<number>(monthlyData.length - 1);
  const maxTons = Math.max(...monthlyData.map((d) => d.tons));

  const activeItem = monthlyData[activeIdx] ?? monthlyData[monthlyData.length - 1];

  return (
    <div className="ocean-panel relative rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[var(--text)]">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-text)]">
            Aggregated artisanal & commercial landing statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-600">
            <TrendingUp className="h-3 w-3" /> +18.4% YoY
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
            2026 Live
          </span>
        </div>
      </div>

      {/* KPI highlight row */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[var(--line)]/60 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Selected Month
          </p>
          <p className="text-sm font-black text-cyan-500">{activeItem.month} 2026</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Volume Landed
          </p>
          <p className="text-sm font-black text-[var(--text)]">{activeItem.tons} MT</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Gross Value
          </p>
          <p className="text-sm font-black text-emerald-500">KES {activeItem.revenue}M</p>
        </div>
      </div>

      {/* Smooth, glitch-free Bar Chart */}
      <div
        className="relative mt-5 pt-3"
        onMouseLeave={() => setActiveIdx(monthlyData.length - 1)}
      >
        <div className="flex h-44 items-end justify-between gap-2 px-2 sm:gap-4">
          {monthlyData.map((item, index) => {
            const heightPercent = Math.round((item.tons / maxTons) * 100);
            const isHovered = activeIdx === index;

            return (
              <div
                key={item.month}
                onMouseEnter={() => setActiveIdx(index)}
                className="group flex flex-1 cursor-pointer select-none flex-col items-center"
              >
                <div className="relative flex h-36 w-full items-end justify-center">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`relative w-full max-w-[44px] rounded-t-xl transition-all duration-200 ${
                      isHovered
                        ? "bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_20px_rgba(65,243,255,.55)]"
                        : "bg-[var(--soft)]/90 hover:bg-cyan-500/40"
                    }`}
                  >
                    {isHovered && (
                      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-in fade-in zoom-in-90 duration-150">
                        <span className="whitespace-nowrap rounded-md border border-cyan-400/60 bg-slate-950 px-2 py-0.5 text-[10px] font-black text-cyan-300 shadow-xl">
                          {item.tons}t
                        </span>
                        <div className="h-1.5 w-1.5 -mt-0.5 rotate-45 border-b border-r border-cyan-400/60 bg-slate-950" />
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`mt-2 text-xs font-bold transition-colors duration-150 ${
                    isHovered ? "text-cyan-400 font-black" : "text-[var(--muted-text)]"
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted-text)]">
        <span>Source: State Dept for Fisheries & BMU Declarations</span>
        <span className="font-semibold text-cyan-500">Updated today</span>
      </div>
    </div>
  );
}
