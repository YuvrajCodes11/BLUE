export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-8 text-center">
      <div className="wave-band opacity-40" />
      <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-text)]">{body}</p>
    </div>
  );
}
