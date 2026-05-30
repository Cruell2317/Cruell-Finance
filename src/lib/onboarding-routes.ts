import type { OnboardingStep } from "@/types";

export function getOnboardingPath(step: OnboardingStep): string {
  switch (step) {
    case "login":
      return "/login";
    case "pairing":
      return "/onboarding/pairing";
    case "profile":
      return "/onboarding/profile";
    case "start-date":
      return "/onboarding/start-date";
    case "target":
      return "/onboarding/target";
    case "complete":
      return "/";
    default:
      return "/splash";
  }
}
