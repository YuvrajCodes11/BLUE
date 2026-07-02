import Link from "next/link";

export default function Page() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-[var(--text)]">Settings</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="ocean-panel rounded-2xl p-5">
          <h2 className="font-bold text-[var(--text)]">Account security</h2>
          <p className="mt-2 text-sm text-[var(--muted-text)]">Use password reset for account recovery or password changes.</p>
          <Link href="/forgot-password" className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950">Reset password</Link>
        </div>
        <div className="ocean-panel rounded-2xl p-5">
          <h2 className="font-bold text-[var(--text)]">Access management</h2>
          <p className="mt-2 text-sm text-[var(--muted-text)]">New users should request access first. Admins approve roles from the admin dashboard.</p>
          <Link href="/request-access" className="mt-4 inline-flex rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-sm font-bold text-[var(--text)]">Open request form</Link>
        </div>
      </div>
    </section>
  );
}
