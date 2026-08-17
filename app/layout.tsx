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
import { LocationPermission } from "@/features/region/components/location-permission";

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
  description: "smart farming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <RegionProvider>
            <SettingsProvider>
              <FarmProvider>
                <LocationPermission/>
                  {children}
              </FarmProvider>
            </SettingsProvider>
          </RegionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}