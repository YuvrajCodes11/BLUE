import { Suspense } from "react";
import { ConsentOnboardingForm } from "@/components/onboarding/ConsentOnboardingForm";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ConsentOnboardingForm />
    </Suspense>
  );
}
