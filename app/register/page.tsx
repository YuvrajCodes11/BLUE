import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function Page() {
  return <main className="grid min-h-screen place-items-center bg-[#050b14] px-5"><Suspense fallback={<div className="text-cyan-100">Loading...</div>}><AuthCard mode="register" /></Suspense></main>;
}
