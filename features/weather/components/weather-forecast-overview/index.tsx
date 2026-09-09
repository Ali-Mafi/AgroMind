import { T } from "@/features/settings/components/translated-text";
import { useWeatherFormat } from "../hooks/use-weather-format";
import { memo, type CSSProperties } from "react";
import { CalendarDays, ChevronRight, Clock3, Sprout } from "lucide-react";
import { WeatherIcon } from "../weather-icon";
import { buildWeatherTimeline } from "@/features/weather/lib/build-weather-timeline";
import {
  forecastDays, forecastSourceNames, localWeatherTime, nextNight,
  sourceName, upcomingHours,
} from "@/features/weather/lib/weather-presentation";
import type { WeatherData } from "@/features/weather/types/weather";
import type { WeatherDetailSelection } from "@/features/weather/types/weather-detail";
import styles from "../weather-experience/weather-experience.module.css";

export const WeatherForecastOverview = memo(function WeatherForecastOverview({ weather, asOf, onOpen }: {
  weather: WeatherData; asOf: number; onOpen: (selection: WeatherDetailSelection) => void;
}) {
  const { chanceLabel, fieldOutlook, temperature, weatherClock, weatherDayLabel, rainAmount, symbol, measure, number, t } = useWeatherFormat();
  const todayKey = localWeatherTime(weather.timezone, asOf).slice(0, 10);
  const days = forecastDays(weather, asOf);
  const today = days.find((day) => day.date === todayKey);
  const cards = buildWeatherTimeline(weather, asOf);
  const hours = upcomingHours(weather, asOf);
  const night = nextNight(hours);
  const minimum = Math.min(...days.map((day) => day.temperatureMin));
  const maximum = Math.max(...days.map((day) => day.temperatureMax));
  const span = Math.max(1, maximum - minimum);
  const isOld = asOf - Date.parse(weather.current.time) > 30 * 60 * 1000;

  return (
    <>
      <section className={`${styles.glass} ${styles.hourly}`} aria-label={t("Hourly forecast")}>
        <p className={styles.outlook}>{fieldOutlook(hours)}</p>
        <div className={`${styles.sectionTitle} ${styles.hourlyHeader}`}>
          <span><Clock3 />{" "}<T text="Hourly forecast" /></span>
          <button type="button" className={styles.sectionLink} onClick={() => onOpen({ metric: "temperature", date: todayKey })}><T text="Chart" />{" "}<ChevronRight size={16} /></button>
        </div>
        <div className={styles.hourStrip}>
          {cards.map((card) => {
            const isCurrent = card.kind === "current";
            const label = isCurrent ? (isOld ? "Last report" : "Now") : weatherClock(card.time);
            const date = isCurrent ? todayKey : card.time.slice(0, 10);
            return (
              <button type="button" key={card.key} className={styles.hour} data-current={isCurrent} data-weather-kind={card.kind}
                aria-label={`${label}, ${isCurrent ? "latest report" : `${weatherDayLabel(date, todayKey)} forecast`}, ${temperature(card.temperature)} ${symbol("temperature")}, ${card.condition.label}. Open details`}
                onClick={() => onOpen({ metric: "temperature", date, hour: isCurrent ? undefined : card.time })}>
                <span className={styles.hourTime}>{label}</span>
                <WeatherIcon condition={card.condition.condition} isDay={card.isDay} className={styles.weatherIcon} />
                <span className={styles.hourChance} title={chanceLabel(card.precipitationProbabilityKind)}>
                  {card.precipitationProbability !== null && card.precipitationProbability > 0
                    ? `${number(card.precipitationProbability, 0)}%` : isCurrent ? (weather.current.source === "weatherapi" ? "Report" : "Model") : ""}
                </span>
                <span className={styles.hourTemperature}>{temperature(card.temperature)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className={styles.forecastLayout}>
        <section className={`${styles.glass} ${styles.daily}`} aria-label={t("Daily forecast")}>
          <h2 className={styles.sectionTitle}><span><CalendarDays /> {days.length ? t("{count}-day forecast", { count: number(days.length, 0) }) : t("Daily forecast")}</span></h2>
          {days.length ? <div className={styles.dayList}>
            {days.map((day) => {
              const left = Math.min(99, (day.temperatureMin - minimum) / span * 100);
              const width = Math.min(100 - left, Math.max(1, (day.temperatureMax - day.temperatureMin) / span * 100));
              const currentPosition = Math.max(0, Math.min(100, (weather.current.temperature - minimum) / span * 100));
              return (
                <button type="button" key={day.date} className={styles.day}
                  aria-label={`${weatherDayLabel(day.date, todayKey, true)}, ${day.condition.label}, low ${temperature(day.temperatureMin)}, high ${temperature(day.temperatureMax)}, forecast precipitation ${rainAmount(day.precipitationSum)} ${symbol("precipitation")}. Open daily details`}
                  onClick={() => onOpen({ metric: "temperature", date: day.date })}>
                  <span className={styles.dayName}>{weatherDayLabel(day.date, todayKey)}<small>{sourceName(weather, day)}</small></span>
                  <span className={styles.dayWeather}>
                    <WeatherIcon condition={day.condition.condition} className={styles.weatherIcon} />
                    {day.precipitationProbability !== null && day.precipitationProbability > 0 &&
                      <small title={chanceLabel(day.precipitationProbabilityKind)}>{number(day.precipitationProbability, 0)}%</small>}
                  </span>
                  <span className={styles.low}>{temperature(day.temperatureMin)}</span>
                  <span className={styles.temperatureTrack} aria-hidden="true" style={{
                    "--range-start": `${left}%`, "--range-width": `${width}%`, "--current-position": `${currentPosition}%`,
                  } as CSSProperties}>
                    <span className={styles.temperatureRange} />
                    {day.date === todayKey && <span className={styles.temperatureDot} />}
                  </span>
                  <span className={styles.high}>{temperature(day.temperatureMax)}</span>
                </button>
              );
            })}
          </div> : <p className={styles.detailNote}><T text="Daily forecast is unavailable." /></p>}
          <p className={styles.dailyNote}>{forecastSourceNames(weather, days)}{" "}<T text="· All times are local to this farm." /></p>
          {weather.forecastExtensionStatus === "unavailable" && <p className={styles.detailNote}><T text="The extended forecast is temporarily unavailable. Showing" />{" "}{days.length}{" "}<T text="available days." /></p>}
        </section>

        <section className={`${styles.glass} ${styles.fieldPanel}`} aria-label={t("Field outlook")}>
          <h2 className={styles.sectionTitle}><span><Sprout />{" "}<T text="Field outlook" /></span></h2>
          <div className={styles.fieldFacts}>
            <div className={styles.fieldFact}><strong>{rainAmount(today?.precipitationSum)} <small>{symbol("precipitation")}</small></strong><T text="Today's total forecast" /></div>
            <div className={styles.fieldFact}><strong>{hours.length ? measure(Math.max(...hours.map((hour) => hour.windGusts)), "wind", 0) : "—"}</strong><T text="Peak forecast gust" /></div>
            <div className={styles.fieldFact}><strong>{temperature(night.length ? Math.min(...night.map((hour) => hour.temperature)) : null)}</strong>{weather.current.isDay ? t("Next night · forecast low") : t("Rest of night · forecast low")}</div>
            <div className={styles.fieldFact}><strong>{hours.length ? `${number(Math.min(...hours.map((hour) => hour.humidity)), 0)}–${number(Math.max(...hours.map((hour) => hour.humidity)), 0)}%` : "—"}</strong><T text="Forecast humidity range" /></div>
          </div>
          <p className={styles.fieldCaption}><T text="Wind and humidity use available forecasts within the next 24 hours. Check rain timing before adjusting irrigation; soil moisture and crop needs are separate inputs." /></p>
          <button type="button" className={styles.sectionLink} onClick={() => onOpen({ metric: "precipitation", date: todayKey })}><T text="Rain timing & amounts" />{" "}<ChevronRight size={16} /></button>
        </section>
      </div>
    </>
  );
});
