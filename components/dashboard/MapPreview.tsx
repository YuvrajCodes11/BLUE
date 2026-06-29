export function MapPreview() {
  const points = [[18,54,"Landing"],[42,35,"Patrol"],[66,26,"MPA"],[78,62,"Zone"],[33,74,"BMU"]] as const;
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#061322] p-5">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(65,243,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(65,243,255,.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      {points.map(([x,y,label]) => <div key={label} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}><span className="block h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(65,243,255,.8)]" /><small className="mt-2 block whitespace-nowrap text-xs text-cyan-100">{label}</small></div>)}
    </div>
  );
}
