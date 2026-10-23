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
  const isDemo =
    typeof document !== "undefined" &&
    (document.cookie.includes("blue_demo_session=true") || Boolean(localStorage.getItem("blue_demo_user")));

  async function logout() {
    // Clear demo session
    if (typeof document !== "undefined") {
      document.cookie = "blue_demo_session=; path=/; max-age=0;";
      document.cookie = "blue_demo_role=; path=/; max-age=0;";
      localStorage.removeItem("blue_demo_user");
    }
    try {
      await fetch("/api/auth/demo-login", { method: "DELETE" });
    } catch {
      // ignore
    }

    if (hasSupabaseConfig()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
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
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--muted-text)]">BLUE</p>
            {isDemo && (
              <span className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-500">
                Demo Mode
              </span>
            )}
          </div>
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
