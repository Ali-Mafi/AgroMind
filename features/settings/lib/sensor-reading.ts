import type { createFormatters } from "./units";
type Formatters = ReturnType<typeof createFormatters>;

/** Sensor values retain their source unit; convert only explicitly supported measurements. */
export function sensorReading(value: string, unit: string, format: Formatters) {
  const numeric = value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(numeric)) return { value, unit };
  if (/^L(?:\/(?:min|h|s))?$/i.test(unit)) {
    return { value: format.number(format.convert(numeric, "volume"), 1), unit: format.symbol("volume") + unit.slice(1) };
  }
  const kind = unit === "°C" ? "temperature" : unit === "mm" ? "precipitation" : unit === "km/h" ? "wind" : unit === "hPa" ? "pressure" : null;
  return kind ? { value: format.number(format.convert(numeric, kind), 2), unit: format.symbol(kind) } : { value: format.number(numeric, 1), unit };
}
