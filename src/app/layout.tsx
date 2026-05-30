import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthCodeRedirect } from "@/components/auth/AuthCodeRedirect";
import { ConfigGuard } from "@/components/ConfigGuard";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { AuthProvider } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AppProvider } from "@/context/AppContext";
import { NudgeListener } from "@/components/gamification/NudgeListener";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cruell Finance",
  description: "Tabungan bersama pasangan",
  applicationName: "Cruell Finance",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cruell Finance",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>
          <AuthCodeRedirect />
          <ConfigGuard>
            <OnboardingProvider>
              <AppProvider>
                {children}
                <NudgeListener />
                <RegisterSW />
              </AppProvider>
            </OnboardingProvider>
          </ConfigGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
