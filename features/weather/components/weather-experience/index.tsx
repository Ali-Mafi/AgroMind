"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, CloudOff, List, MapPin, MapPinOff, Pause, Play, Plus, RefreshCw, Sprout } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useWeather } from "../hooks/use-weather";
import { useWeatherMotion } from "../hooks/use-weather-motion";
import { WeatherBackground } from "../weather-background";
import { WeatherForecastOverview } from "../weather-forecast-overview";
import { WeatherMetricGrid } from "../weather-metric-grid";
import { WeatherSheet } from "../weather-sheet";
import { resolveWeatherVisualState } from "@/features/weather/lib/resolve-weather-visual-state";
import { WEATHER_METRICS, localWeatherTime, sourceName, temperature, weatherClock } from "@/features/weather/lib/weather-presentation";
import type { WeatherDetailSelection } from "@/features/weather/types/weather-detail";
import styles from "./weather-experience.module.css";

const WeatherDetail = dynamic(() => import("../weather-detail").then((module) => module.WeatherDetail), {
  loading: () => <p role="status" className={styles.detailNote}>Loading chart…</p>,
});

export function WeatherExperience() {
  const { farms, selectedFarmId, setSelectedFarmId, isHydrated } = useFarm();
  const farm = farms.find((entry) => entry.id === selectedFarmId) ?? farms[0];
  const { weather, isLoading, error, isRefreshing, refreshError, checkedAt, refresh } = useWeather(farm?.coordinates);
  const motion = useWeatherMotion();
  const [sheet, setSheet] = useState<WeatherDetailSelection | "farms" | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openDetail = useCallback((selection: WeatherDetailSelection) => setSheet(selection), []);
  const asOf = checkedAt ?? (weather ? Date.parse(weather.current.time) : 0);
  const localTime = weather ? localWeatherTime(weather.timezone, asOf) : "";
  const today = weather?.daily.find((day) => day.date === localTime.slice(0, 10));
  const reportTime = weather ? localWeatherTime(weather.timezone, Date.parse(weather.current.time)) : "";
  const reportOld = weather ? asOf - Date.parse(weather.current.time) > 30 * 60 * 1000 : false;
  const visualState = weather ? resolveWeatherVisualState({
    condition: weather.current.condition.condition, intensity: weather.current.condition.intensity,
    isDay: weather.current.isDay,
  }) : "unknown-day";

  return (
    <main className={styles.page}>
      <WeatherBackground visualState={visualState} className={styles.backdrop}
        animationsEnabled={motion.enabled && sheet === null}
        precipitating={weather?.current.condition.isPrecipitation ?? false} />
      <div className={styles.pageShade} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.topbar}>
          <Link href="/dashboard" className={styles.brand}><Sprout size={21} /><span>AgroMind <span aria-hidden="true">/</span> Weather</span></Link>
          <div className={styles.topActions}>
            <button type="button" className={styles.iconButton} onClick={motion.toggle}
              disabled={motion.reducedMotion} aria-pressed={!motion.enabled}
              title={motion.reducedMotion ? "Animations paused by your reduced-motion setting" : motion.enabled ? "Pause weather animations" : "Enable weather animations"}
              aria-label={motion.enabled ? "Pause weather animations" : "Enable weather animations"}>
              {motion.enabled ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" className={styles.iconButton} onClick={refresh}
              disabled={!farm?.coordinates || isRefreshing || isLoading} aria-label="Refresh weather" title="Refresh weather">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {!isHydrated || (farm?.coordinates && isLoading) ? <div className={styles.loading} role="status" aria-label="Loading weather">
          <MapPin size={20} className="mx-auto" /><p>{farm?.name ?? "Your farms"}</p>
          <div className={styles.loadingTemperature} aria-hidden="true" /><p>Loading local weather…</p>
          <div className={styles.loadingCard} aria-hidden="true" />
        </div> : !farm ? <section className={styles.state}>
          <Sprout /><h1>Weather for your field</h1><p>Add a farm or garden with its exact location to see local conditions and forecasts.</p>
          <Link className={styles.action} href="/farms/new"><Plus size={18} />Add a farm or garden</Link>
        </section> : !farm.coordinates ? <section className={styles.state}>
          <MapPinOff /><h1>Add a location for {farm.name}</h1><p>Place your farm on the map to load its weather.</p>
          <Link className={styles.action} href={`/farms/${farm.id}/edit`}>Set farm location</Link>
        </section> : error || !weather ? <section className={styles.state}>
          <CloudOff /><h1>Weather unavailable</h1><p>{error ?? "Unable to load this farm's weather right now."}</p>
          <button type="button" className={styles.action} onClick={refresh}><RefreshCw size={18} />Try again</button>
        </section> : <>
          <section className={styles.hero} aria-label="Current conditions">
            <p className={styles.locationLabel}><MapPin size={14} />{farm.location?.trim() || `${farm.coordinates.latitude.toFixed(3)}, ${farm.coordinates.longitude.toFixed(3)}`}</p>
            <h1>{farm.name}</h1>
            <p className={styles.heroTemperature} data-weather-temperature="current">{temperature(weather.current.temperature)}</p>
            <p className={styles.heroCondition}>{weather.current.condition.label}</p>
            {today && <p className={styles.heroRange}><span>H:{temperature(today.temperatureMax)}</span><span>L:{temperature(today.temperatureMin)}</span></p>}
            <p className={styles.heroFeels}>Feels like {temperature(weather.current.feelsLike)}</p>
            <div className={styles.reportLine}>
              <span>{sourceName(weather)} · {weather.current.source === "open-meteo" ? "Model valid" : "Reported"} {reportTime.slice(0, 10) === localTime.slice(0, 10) ? weatherClock(reportTime) : reportTime.replace("T", " ")}</span>
              {isRefreshing && <span role="status">· Checking…</span>}
            </div>
          </section>

          {(weather.currentStatus === "fallback" || reportOld || refreshError) && <div className={styles.notice} role="status">
            {weather.currentStatus === "fallback" && <p>WeatherAPI is unavailable. Current conditions and forecasts are using Open-Meteo model data.</p>}
            {reportOld && <p>The latest report is over 30 minutes old.</p>}
            {refreshError && <p>{refreshError}</p>}
          </div>}

          <WeatherForecastOverview weather={weather} asOf={asOf} onOpen={openDetail} />
          <WeatherMetricGrid weather={weather} asOf={asOf} onOpen={openDetail} />
          <footer className={styles.sourceFooter}>
            <p>Weather data by <a href={weather.forecastSource === "weatherapi" ? "https://www.weatherapi.com/" : "https://open-meteo.com/"} target="_blank" rel="noreferrer">{sourceName(weather)}</a>
              {weather.forecastSource === "weatherapi" && weather.daily.some((day) => day.source === "open-meteo") && <> + <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></>} · {weather.timezone}</p>
            <p>Checks every 5 minutes while visible. Last checked {weatherClock(localTime)}.</p>
            <p>Forecast totals are estimates. Measured daily rainfall requires local observations.</p>
          </footer>
        </>}
      </div>

      <nav className={styles.dock} aria-label="Weather navigation">
        <Link href="/dashboard" className={styles.iconButton} aria-label="Back to dashboard" title="Back to dashboard"><ArrowLeft size={23} /></Link>
        <div className={styles.dockCenter}>
          <span>{farm?.name ?? "Your locations"}</span>
          <div className={styles.farmDots} aria-hidden="true">
            {farms.length <= 7 ? farms.map((entry) => <span key={entry.id} className={styles.farmDot} data-active={entry.id === farm?.id} />) : <span>{farms.findIndex((entry) => entry.id === farm?.id) + 1} / {farms.length}</span>}
          </div>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Open farm locations" title="Farm locations" onClick={() => setSheet("farms")}><List size={24} /></button>
      </nav>

      {sheet === "farms" && <WeatherSheet title="Your locations" subtitle="Weather at your farms and gardens" onClose={closeSheet}>
        <div className={styles.farmList}>
          {farms.map((entry) => <button type="button" key={entry.id} className={styles.farmOption}
            aria-pressed={entry.id === farm?.id} onClick={() => { setSelectedFarmId(entry.id); closeSheet(); }}>
            <span><strong>{entry.name}</strong><small>{entry.location || (entry.type === "garden" ? "Garden" : "Farm")}</small>
              <small>{!entry.coordinates ? "Location needed" : entry.id === farm?.id && weather ? weather.current.condition.label : "Open local forecast"}</small>
            </span>
            {entry.id === farm?.id && weather ? <span className={styles.farmOptionTemperature}>{temperature(weather.current.temperature)}</span> : entry.id === farm?.id ? <Check size={22} /> : <MapPin size={22} />}
          </button>)}
        </div>
        <div className={styles.farmListFooter}>
          <p>{farms.length ? `${farms.length} saved ${farms.length === 1 ? "location" : "locations"}` : "No farms or gardens yet"}</p>
          <Link href="/farms/new" className={styles.action}><Plus size={18} />Add farm</Link>
        </div>
      </WeatherSheet>}
      {sheet && sheet !== "farms" && weather && <WeatherSheet title={WEATHER_METRICS[sheet.metric].title} subtitle={`${farm?.name} · ${weather.timezone}`} onClose={closeSheet}>
        <WeatherDetail weather={weather} asOf={asOf} selection={sheet} onSelection={openDetail} />
      </WeatherSheet>}
    </main>
  );
}
