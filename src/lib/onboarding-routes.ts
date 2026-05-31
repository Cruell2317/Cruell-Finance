import type { OnboardingStep } from "@/types";

export function getOnboardingPath(step: OnboardingStep): string {
  switch (step) {
    case "login":
      return "/login";
    case "pairing":
      return "/onboarding/pairing";
    case "complete":
      return "/";
    default:
      return "/splash";
  }
}
