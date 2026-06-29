"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole, roleLabels } from "@/lib/roles";
import type { RoleSlug } from "@/types/domain";

export function Sidebar({ role }: { role: RoleSlug }) {
  const pathname = usePathname();
  const nav = navForRole(role);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#07111f]/95 p-5 backdrop-blur-xl lg:block">
      <Link href="/" className="flex items-center gap-3 font-bold text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950">B</span> BLUE</Link>
      <div className="mt-6 rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Active role</p><p className="mt-2 font-bold text-cyan-100">{roleLabels[role]}</p></div>
      <nav className="mt-6 grid gap-1">
        {nav.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2.5 text-sm transition ${pathname === item.href ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}>{item.label}</Link>)}
      </nav>
    </aside>
  );
}
