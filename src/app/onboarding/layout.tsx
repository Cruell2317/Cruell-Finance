import { OnboardingGuard } from "@/components/auth/OnboardingGuard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}
