export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodingResult {
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
}

export function requestCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(
        new Error("Geolocation is not supported by this browser."),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  });
}

export async function reverseGeocode(
  coordinates: Coordinates,
): Promise<ReverseGeocodingResult> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    localityLanguage: "en",
  });

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    countryCode?: string;
    countryName?: string;
    city?: string;
    locality?: string;
  };

  return {
    countryCode: data.countryCode ?? null,
    countryName: data.countryName ?? null,
    city: data.city ?? data.locality ?? null,
  };
}