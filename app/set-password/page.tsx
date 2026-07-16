import { Suspense } from "react";
import { SetPasswordCard } from "@/components/auth/SetPasswordCard";

export default function Page() {
  return (
    <Suspense fallback={<main className="ocean-app-shell grid min-h-screen place-items-center px-4 py-8 text-[var(--text)]">Loading...</main>}>
      <SetPasswordCard />
    </Suspense>
  );
}
