import type { Metadata, Viewport } from "next";
import { WeatherExperience } from "@/features/weather/components/weather-experience";

export const metadata: Metadata = {
  title: "AgroMind",
};

export const viewport: Viewport = {
  themeColor: "#203b4d",
  viewportFit: "cover",
};

export default async function WeatherPage({ searchParams }: { searchParams: Promise<{ farm?: string; from?: string }> }) {
  const params = await searchParams;
  return <WeatherExperience initialFarmId={params.farm} returnTo={params.from === "irrigation" ? "/irrigation" : "/dashboard"} />;
}
