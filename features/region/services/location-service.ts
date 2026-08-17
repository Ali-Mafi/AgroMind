export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodedLocation {
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  locality: string | null;
}

interface ReverseGeocodeResponse {
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  locality?: string | null;
}

export function requestCurrentLocation(): Promise<Coordinates> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new Error("Geolocation is not supported by this browser."),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        resolve(coordinates);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000,
      },
    );
  });
}

export async function reverseGeocode(
  coordinates: Coordinates,
): Promise<ReverseGeocodedLocation> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });

  const response = await fetch(
    `/api/location?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding failed with status ${response.status}.`,
    );
  }

  const data =
    (await response.json()) as ReverseGeocodeResponse;

  return {
    countryCode: data.countryCode ?? null,
    countryName: data.countryName ?? null,
    city: data.city ?? null,
    locality: data.locality ?? null,
  };
}