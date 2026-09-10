import type { Metadata } from "next";
import {
  Geist_Mono,
  Inter,
  Manrope,
  Vazirmatn,
} from "next/font/google";

import "./globals.css";

import { FarmProvider } from "@/features/farms/context/farm-context";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { SettingsProvider } from "@/features/settings/context/settings-context";
import { RegionProvider } from "@/features/region/context/region-context";
import { RegionOnboarding } from "@/features/settings/components/region-onboarding";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgroMind",
  description: "Smart farm management powered by AgroMind",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AgroMind", statusBarStyle: "default" },
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SettingsProvider>
            <RegionProvider>
              <FarmProvider>
                <RegionOnboarding />
                  {children}
              </FarmProvider>
            </RegionProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
