"use client";

import dynamic from "next/dynamic";

const BlueExperience = dynamic(() => import("@/components/BlueExperience"), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-screen place-items-center bg-[#020712] text-cyan-100">
      <div className="rounded-full border border-cyan-300/20 px-5 py-3 text-sm uppercase tracking-[0.35em] text-cyan-200/80">
        Initializing BLUE
      </div>
    </main>
  ),
});

export default function Home() {
  return <BlueExperience />;
}
