import type { NextRequest } from "next/server";
import { getFarmWeather } from "@/features/weather/services/weather-server-service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latitudeText = params.get("latitude");
  const longitudeText = params.get("longitude");
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (
    !latitudeText?.trim() || !longitudeText?.trim() ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) {
    return Response.json({ error: "Valid coordinates are required." }, { status: 400 });
  }

  try {
    return Response.json(await getFarmWeather({ latitude, longitude }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Weather is unavailable. Please try again." }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
