import {
  CloudSun,
  Droplets,
  Wind,
} from "lucide-react";

import type { DashboardWeather } from "@/features/dashboard/types/dashboard";

interface WeatherWidgetProps {
  weather: DashboardWeather;
}

export function WeatherWidget({
  weather,
}: WeatherWidgetProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <CloudSun className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="font-semibold">
              Weather
            </h2>

            <p className="text-sm text-muted-foreground">
              Current farm conditions
            </p>
          </div>
        </div>

        <span className="text-2xl font-bold">
            {weather.temperature}
        </span>
      </div>

      <div className="mt-6">
        <p className="font-medium">
          {weather.condition}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>
            <p>
             Humidity
             <br/> {weather.humidity}
            </p>
            </span>
    
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="h-4 w-4" />
            <span>

            <p>
               Wind 
               <br/>{weather.windSpeed}
            </p>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}