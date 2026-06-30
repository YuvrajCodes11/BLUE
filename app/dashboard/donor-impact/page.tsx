import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function Page() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-[var(--text)]">Donor Impact</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Read-only donor outcomes will populate from real project, beneficiary, and report data.</p>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Outcome KPI trend" />
        <EmptyState title="No donor impact records yet" body="Funding outcomes, beneficiaries, and milestones will appear after approved project data is entered." />
      </div>
    </section>
  );
}
