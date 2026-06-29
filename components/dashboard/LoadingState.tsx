export function LoadingState() {
  return <div className="grid gap-3">{[0,1,2].map((item)=><div key={item} className="h-16 animate-pulse rounded-2xl bg-white/[0.06]" />)}</div>;
}
