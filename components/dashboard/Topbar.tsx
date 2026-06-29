"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111f]/80 px-5 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400 md:flex"><Search className="h-4 w-4" /> Search records, reports, BMUs...</div>
        <div className="ml-auto flex items-center gap-3"><button className="rounded-xl border border-white/10 p-2 text-slate-300"><Bell className="h-4 w-4" /></button><Link href="/dashboard/settings" className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950">Settings</Link><button onClick={()=>void logout()} className="rounded-xl border border-white/10 p-2 text-slate-300"><LogOut className="h-4 w-4" /></button></div>
      </div>
    </header>
  );
}
