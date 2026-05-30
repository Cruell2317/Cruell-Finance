import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthCodeRedirect } from "@/components/auth/AuthCodeRedirect";
import { CoupleRealtimeListener } from "@/components/auth/CoupleRealtimeListener";
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
  title: "Cruell Financial",
  description: "Tabungan bersama pasangan",
  applicationName: "Cruell Financial",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cruell Financial",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
              <CoupleRealtimeListener />
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
