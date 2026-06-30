import { MapPreview } from "@/components/dashboard/MapPreview";

export default function Page() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-[var(--text)]">GIS Intelligence</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Landing-site coordinates and marine-zone layers will appear after real records are connected. No placeholder map points are shown.</p>
      <div className="mt-6"><MapPreview /></div>
    </section>
  );
}
