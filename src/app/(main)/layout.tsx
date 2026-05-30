import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <AppShell>{children}</AppShell>
    </OnboardingGuard>
  );
}
