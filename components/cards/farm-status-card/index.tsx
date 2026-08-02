import { FarmStatusCardProps } from "./types";

export function FarmStatusCard({
  farmName,
  location,
  moisture,
  temperature,
  humidity,
  weather,
  recommendation,
}: FarmStatusCardProps) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg">
      <h2 className="text-xl font-semibold">{farmName}</h2>

      <p className="mt-1 text-sm text-muted-foreground">
        {location}
      </p>

      <div className="mt-6 space-y-2 text-sm">
        <p>🌱 Soil Moisture: {moisture}%</p>

        <p>🌡 Temperature: {temperature}°C</p>

        <p>💧 Humidity: {humidity}%</p>

        <p>☀️ Weather: {weather}</p>
      </div>

      <div className="mt-6 rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs opacity-80">
          AI Recommendation
        </p>

        <p className="mt-1 font-medium">
          {recommendation}
        </p>
      </div>
    </div>
  );
}