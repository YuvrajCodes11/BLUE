"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles, CheckCircle2 } from "lucide-react";
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

const demoFishers: Fisher[] = [
  {
    id: "11111111-2222-3333-4444-555555555501",
    full_name: "Amina Mwakio",
    phone: "+254 701 880 114",
    membership_status: "Active",
    qr_code: "BLUE-FSH-001",
    created_at: "2026-10-15",
  },
  {
    id: "11111111-2222-3333-4444-555555555502",
    full_name: "Joseph Otieno",
    phone: "+254 733 100 901",
    membership_status: "Active",
    qr_code: "BLUE-FSH-002",
    created_at: "2026-10-18",
  },
  {
    id: "11111111-2222-3333-4444-555555555503",
    full_name: "Mary Wanjiku",
    phone: "+254 712 000 448",
    membership_status: "Validated",
    qr_code: "BLUE-FSH-003",
    created_at: "2026-10-20",
  },
];

export function VerifyMemberPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Fisher[]>(demoFishers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(searchVal = query) {
    setError("");
    const term = searchVal.trim();
    if (!term) {
      setRows(demoFishers);
      return;
    }

    setLoading(true);

    if (!hasSupabaseConfig()) {
      const filtered = demoFishers.filter(
        (f) =>
          f.qr_code.toLowerCase().includes(term.toLowerCase()) ||
          f.full_name.toLowerCase().includes(term.toLowerCase()) ||
          (f.phone && f.phone.includes(term))
      );
      setRows(filtered);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: searchError } = await supabase
        .from("fishers")
        .select("id,full_name,phone,membership_status,qr_code,created_at")
        .or(`qr_code.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10);

      if (searchError || !data || data.length === 0) {
        // Fallback filter
        const filtered = demoFishers.filter(
          (f) =>
            f.qr_code.toLowerCase().includes(term.toLowerCase()) ||
            f.full_name.toLowerCase().includes(term.toLowerCase()) ||
            (f.phone && f.phone.includes(term))
        );
        setRows(filtered);
      } else {
        setRows(data as Fisher[]);
      }
    } catch {
      const filtered = demoFishers.filter(
        (f) =>
          f.qr_code.toLowerCase().includes(term.toLowerCase()) ||
          f.full_name.toLowerCase().includes(term.toLowerCase())
      );
      setRows(filtered);
    } finally {
      setLoading(false);
    }
  }

  function quickSearch(code: string) {
    setQuery(code);
    void search(code);
  }

  return (
    <section className="grid gap-6">
      <div className="ocean-panel rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">Member Verification</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">Verify Member QR</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted-text)]">
          Search a fisher QR code, name, or registered phone number to verify official BMU credentials and landing rights.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="Enter QR code (e.g. BLUE-FSH-001), name, or phone..."
            className="min-h-12 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm text-[var(--text)] outline-none"
          />
          <button
            onClick={() => void search()}
            className="ocean-action inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-black text-slate-950 shadow-md transition active:scale-95"
          >
            <Search className="h-4 w-4" /> Verify
          </button>
        </div>

        {/* Demo Quick Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-[var(--muted-text)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Quick Demo Verify:
          </span>
          {["BLUE-FSH-001", "BLUE-FSH-002", "BLUE-FSH-003", "Amina Mwakio", "Joseph Otieno"].map((chip) => (
            <button
              key={chip}
              onClick={() => quickSearch(chip)}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-mono font-bold text-cyan-400 transition hover:bg-cyan-400/20"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState title="Verification unavailable" body={error} />
        ) : rows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <article key={row.id} className="ocean-panel rounded-3xl p-5 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" /> Verified Identity
                    </div>
                    <h2 className="mt-2 text-xl font-black text-[var(--text)]">{row.full_name}</h2>
                    <p className="mt-0.5 text-sm text-[var(--muted-text)]">{row.phone ?? "No phone recorded"}</p>
                  </div>
                  <StatusBadge status={row.membership_status} />
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Official Biometric QR Code</p>
                  <p className="mt-2 font-mono text-base font-black tracking-wider text-[var(--text)]">{row.qr_code}</p>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--line)]/60 pt-4 text-xs">
                  <div>
                    <dt className="font-bold text-[var(--muted-text)]">System UUID</dt>
                    <dd className="truncate font-mono font-semibold text-[var(--text)]">{row.id}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[var(--muted-text)]">Registration Date</dt>
                    <dd className="font-semibold text-[var(--text)]">
                      {new Date(row.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching member found"
            body="Try one of the quick demo verification chips above or enter a valid fisher name."
          />
        )}
      </div>
    </section>
  );
}
