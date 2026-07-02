import { ChartCard } from "@/components/dashboard/ChartCard";

export default function Page() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-[var(--text)]">Reports</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Role-filtered PDF/CSV reports will be generated from real Supabase records after report templates and operational data are available.</p>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Catch trend report" />
        <ChartCard title="Species composition" />
      </div>
      <div className="ocean-panel mt-6 rounded-2xl p-5">
        <h2 className="font-bold text-[var(--text)]">Exports</h2>
        <p className="mt-2 text-sm text-[var(--muted-text)]">Export buttons will activate when report queries return real records. No placeholder report files are generated.</p>
      </div>
    </section>
  );
}
