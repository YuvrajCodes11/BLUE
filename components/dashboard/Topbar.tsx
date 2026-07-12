"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { RoleSlug } from "@/types/domain";
import { roleLabels } from "@/lib/roles";

export function Topbar({ onMenuClick, role }: { onMenuClick?: () => void; role?: RoleSlug }) {
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
    <header className="ocean-topbar sticky top-0 z-20 border-b border-[var(--line)] px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <button onClick={onMenuClick} className="ocean-panel grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--text)] lg:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--muted-text)]">BLUE</p>
          <h1 className="truncate text-base font-black text-[var(--text)] sm:text-xl">{role ? roleLabels[role] : "Dashboard"}</h1>
        </div>
        <div className="ocean-panel hidden min-w-80 items-center gap-3 rounded-2xl px-4 py-2 text-sm text-[var(--muted-text)] md:flex">
          <Search className="h-4 w-4" /> Search records, reports, BMUs...
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <button className="ocean-panel hidden h-11 w-11 place-items-center rounded-xl text-[var(--text)] sm:grid"><Bell className="h-4 w-4" /></button>
          <Link href="/dashboard/settings" className="ocean-panel hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[var(--text)] md:flex"><Settings className="h-4 w-4" /> Settings</Link>
          <button onClick={()=>void logout()} className="ocean-panel inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[var(--text)] sm:px-4"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></button>
        </div>
      </div>
    </header>
  );
}
