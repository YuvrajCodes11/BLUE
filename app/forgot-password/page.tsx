import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function Page() {
  return <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] px-5"><Suspense fallback={<div className="text-[var(--text)]">Loading...</div>}><AuthCard mode="forgot" /></Suspense></main>;
}
