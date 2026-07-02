import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function Page() {
  return <main className="ocean-app-shell grid min-h-screen place-items-center px-5"><Suspense fallback={<div className="text-[var(--text)]">Loading...</div>}><AuthCard mode="login" /></Suspense></main>;
}
