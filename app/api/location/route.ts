import { NextRequest, NextResponse } from "next/server";

interface LocationResponse {
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  locality: string | null;
}

interface BigDataCloudResponse {
  countryCode?: string;
  countryName?: string;
  city?: string;
  locality?: string;
}

interface NominatimResponse {
  address?: {
    country_code?: string;
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    locality?: string;
  };
}

const PROVIDER_TIMEOUT = 8000;

function createTimeoutSignal() {
  return AbortSignal.timeout(PROVIDER_TIMEOUT);
}

async function reverseGeocodeWithBigDataCloud(
  latitude: number,
  longitude: number,
): Promise<LocationResponse | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  });

  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: createTimeoutSignal(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        "[AgroMind][Location] BigDataCloud failed:",
        response.status,
      );

      return null;
    }

    const data =
      (await response.json()) as BigDataCloudResponse;

    if (!data.countryCode) {
      console.warn(
        "[AgroMind][Location] BigDataCloud returned no country code.",
      );

      return null;
    }

    return {
      countryCode: data.countryCode.toUpperCase(),
      countryName: data.countryName ?? null,
      city: data.city ?? null,
      locality: data.locality ?? null,
    };
  } catch (error) {
    console.warn(
      "[AgroMind][Location] BigDataCloud request failed:",
      error,
    );

    return null;
  }
}

async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number,
): Promise<LocationResponse | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    zoom: "10",
    addressdetails: "1",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "AgroMind/1.0",
        },
        signal: createTimeoutSignal(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        "[AgroMind][Location] Nominatim failed:",
        response.status,
      );

      return null;
    }

    const data =
      (await response.json()) as NominatimResponse;

    const address = data.address;

    if (!address?.country_code) {
      console.warn(
        "[AgroMind][Location] Nominatim returned no country code.",
      );

      return null;
    }

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      null;

    const locality =
      address.suburb ??
      address.locality ??
      null;

    return {
      countryCode: address.country_code.toUpperCase(),
      countryName: address.country ?? null,
      city,
      locality,
    };
  } catch (error) {
    console.warn(
      "[AgroMind][Location] Nominatim request failed:",
      error,
    );

    return null;
  }
}

export async function GET(request: NextRequest) {
  const latitude = request.nextUrl.searchParams.get("latitude");
  const longitude = request.nextUrl.searchParams.get("longitude");

  if (!latitude || !longitude) {
    return NextResponse.json(
      {
        error: "Latitude and longitude are required.",
      },
      {
        status: 400,
      },
    );
  }

  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);

  if (
    !Number.isFinite(latitudeNumber) ||
    !Number.isFinite(longitudeNumber) ||
    latitudeNumber < -90 ||
    latitudeNumber > 90 ||
    longitudeNumber < -180 ||
    longitudeNumber > 180
  ) {
    return NextResponse.json(
      {
        error: "Invalid coordinates.",
      },
      {
        status: 400,
      },
    );
  }

  console.log(
    "[AgroMind][Location] Reverse geocoding:",
    {
      latitude: latitudeNumber,
      longitude: longitudeNumber,
    },
  );

  // Provider 1: BigDataCloud
  const bigDataCloudResult =
    await reverseGeocodeWithBigDataCloud(
      latitudeNumber,
      longitudeNumber,
    );

  if (bigDataCloudResult) {
    console.log(
      "[AgroMind][Location] Detected via BigDataCloud:",
      bigDataCloudResult,
    );

    return NextResponse.json(bigDataCloudResult);
  }

  console.log(
    "[AgroMind][Location] Trying Nominatim fallback...",
  );

  // Provider 2: OpenStreetMap Nominatim
  const nominatimResult =
    await reverseGeocodeWithNominatim(
      latitudeNumber,
      longitudeNumber,
    );

  if (nominatimResult) {
    console.log(
      "[AgroMind][Location] Detected via Nominatim:",
      nominatimResult,
    );

    return NextResponse.json(nominatimResult);
  }

  console.error(
    "[AgroMind][Location] All reverse geocoding providers failed.",
  );

  return NextResponse.json(
    {
      error: "Unable to detect location.",
    },
    {
      status: 502,
    },
  );
}