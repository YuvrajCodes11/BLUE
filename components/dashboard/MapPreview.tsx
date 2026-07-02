export function MapPreview() {
  return (
    <div className="ocean-panel relative min-h-[360px] overflow-hidden rounded-2xl p-5 shadow-sm">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(14,165,233,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-cyan-300/20" />
      <div className="absolute -right-7 -top-7 h-36 w-36 rounded-full border border-teal-300/20" />
      <div className="relative grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-6 text-center">
        <div>
          <p className="font-black text-[var(--text)]">GIS data not loaded</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted-text)]">Landing-site coordinates and marine-zone layers will appear here after real records are added. No placeholder map points are shown.</p>
        </div>
      </div>
    </div>
  );
}
