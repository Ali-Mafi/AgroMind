import type { Metadata } from "next";
import {
  Geist_Mono,
  Inter,
  Manrope,
} from "next/font/google";
import "./globals.css";
import { FarmProvider } from "@/features/farms/context/farm-context";


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
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FarmProvider>
          {children}
        </FarmProvider>
      </body>
    </html>
  );
};
