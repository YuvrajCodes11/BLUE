"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";

export function Topbar() {
  const router = useRouter();
  async function logout() {
    if (hasSupabaseConfig()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="ocean-topbar sticky top-0 z-20 border-b border-[var(--line)] px-4 py-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--muted-text)]">BLUE</p>
          <h1 className="text-xl font-black text-[var(--text)]">Dashboard</h1>
        </div>
        <div className="ocean-panel hidden min-w-80 items-center gap-3 rounded-2xl px-4 py-2 text-sm text-[var(--muted-text)] md:flex">
          <Search className="h-4 w-4" /> Search records, reports, BMUs...
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button className="ocean-panel grid h-11 w-11 place-items-center rounded-xl text-[var(--text)]"><Bell className="h-4 w-4" /></button>
          <Link href="/dashboard/settings" className="ocean-panel hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[var(--text)] md:flex"><Settings className="h-4 w-4" /> Settings</Link>
          <button onClick={()=>void logout()} className="ocean-panel inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[var(--text)]"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </header>
  );
}
