import {
  Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudMoon,
  CloudRain, CloudSnow, CloudSun, Moon, Sun,
} from "lucide-react";
import type { WeatherCondition } from "@/features/weather/types/weather-normalization";

export function WeatherIcon({ condition, isDay = true, className = "" }: {
  condition: WeatherCondition; isDay?: boolean; className?: string;
}) {
  const Icon = condition === "clear" ? (isDay ? Sun : Moon)
    : condition === "mainly-clear" || condition === "partly-cloudy" ? (isDay ? CloudSun : CloudMoon)
    : condition === "overcast" ? Cloud
    : condition === "thunderstorm" ? CloudLightning
    : condition === "thunderstorm-hail" ? CloudHail
    : ["snow", "snow-grains", "snow-showers"].includes(condition) ? CloudSnow
    : ["fog", "rime-fog", "dust"].includes(condition) ? CloudFog
    : ["drizzle", "freezing-drizzle"].includes(condition) ? CloudDrizzle
    : ["rain", "freezing-rain", "rain-showers"].includes(condition) ? CloudRain : Cloud;
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" data-condition={condition} />;
}
