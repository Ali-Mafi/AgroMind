import type { Metadata, Viewport } from "next";
import { WeatherExperience } from "@/features/weather/components/weather-experience";

export const metadata: Metadata = {
  title: "Weather | AgroMind",
  description: "Local weather, rainfall, wind and hourly forecasts for your farm or garden.",
};

export const viewport: Viewport = {
  themeColor: "#203b4d",
  viewportFit: "cover",
};

export default async function WeatherPage({ searchParams }: { searchParams: Promise<{ farm?: string; from?: string }> }) {
  const params = await searchParams;
  return <WeatherExperience initialFarmId={params.farm} returnTo={params.from === "irrigation" ? "/irrigation" : "/dashboard"} />;
}
