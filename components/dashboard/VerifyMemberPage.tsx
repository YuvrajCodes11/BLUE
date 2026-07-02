"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { RecordStatus } from "@/types/domain";

type Fisher = {
  id: string;
  full_name: string;
  phone: string | null;
  membership_status: RecordStatus;
  qr_code: string;
  created_at: string;
};

export function VerifyMemberPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Fisher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search() {
    setError("");
    setSearched(true);
    if (!hasSupabaseConfig()) {
      setError("Supabase env variables are missing.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const term = query.trim();
    const { data, error: searchError } = await supabase
      .from("fishers")
      .select("id,full_name,phone,membership_status,qr_code,created_at")
      .or(`qr_code.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(10);

    if (searchError) setError(searchError.message);
    setRows((data ?? []) as Fisher[]);
    setLoading(false);
  }

  return (
    <section>
      <div className="ocean-panel rounded-3xl p-6">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-500">Member verification</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">Verify Member QR</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Search a fisher QR code, name, or phone number. Results come from the live fishers table.</p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="QR code, fisher name, or phone" className="min-h-12 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 outline-none" />
          <button onClick={() => void search()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950"><Search className="h-4 w-4" /> Verify</button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? <LoadingState /> : error ? <EmptyState title="Verification unavailable" body={error} /> : rows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <article key={row.id} className="ocean-panel rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted-text)]">Digital fisher card</p>
                    <h2 className="mt-2 text-xl font-black text-[var(--text)]">{row.full_name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted-text)]">{row.phone ?? "No phone recorded"}</p>
                  </div>
                  <StatusBadge status={row.membership_status} />
                </div>
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted-text)]">QR Code</p>
                  <p className="mt-2 break-all font-mono text-sm text-[var(--text)]">{row.qr_code}</p>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[var(--muted-text)]">Record ID</dt><dd className="truncate font-semibold text-[var(--text)]">{row.id}</dd></div>
                  <div><dt className="text-[var(--muted-text)]">Created</dt><dd className="font-semibold text-[var(--text)]">{new Date(row.created_at).toLocaleDateString()}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : searched ? <EmptyState title="No matching member" body="No fisher record matched the QR code, name, or phone you entered." /> : <EmptyState title="Ready to verify" body="Enter a QR code, name, or phone number to search live fisher records." />}
      </div>
    </section>
  );
}
