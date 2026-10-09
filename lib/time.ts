import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export const DEFAULT_TZ = "America/Sao_Paulo";

/** "yyyy-MM-dd" de um instante, no fuso da instituição. */
export function localDate(iso: string | Date, tz = DEFAULT_TZ) {
  return formatInTimeZone(iso, tz, "yyyy-MM-dd");
}
export function localTime(iso: string | Date, tz = DEFAULT_TZ) {
  return formatInTimeZone(iso, tz, "HH:mm");
}
export function fmt(iso: string | Date, pattern: string, tz = DEFAULT_TZ) {
  return formatInTimeZone(iso, tz, pattern, { locale: ptBR });
}
/** Data + hora local ("2026-10-08", "07:00") -> ISO UTC. */
export function toInstant(date: string, time: string, tz = DEFAULT_TZ) {
  return fromZonedTime(`${date}T${time}:00`, tz).toISOString();
}

/** Aritmética de datas de calendário (sem fuso). */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
export function weekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function startOfWeek(date: string) {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd); // semana começa na segunda
}
export function startOfMonth(date: string) {
  return date.slice(0, 8) + "01";
}
export function daysInMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export function today(tz = DEFAULT_TZ) {
  return localDate(new Date(), tz);
}
export function diffDays(a: string, b: string) {
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

export type CalendarView = "dia" | "semana" | "mes" | "lista";

/** Intervalo de datas exibido por cada visualização (fim exclusivo). */
export function viewRange(view: CalendarView, anchor: string): { start: string; end: string; days: string[] } {
  let start: string, end: string;
  if (view === "dia") { start = anchor; end = addDays(anchor, 1); }
  else if (view === "semana") { start = startOfWeek(anchor); end = addDays(start, 7); }
  else if (view === "mes") {
    start = startOfWeek(startOfMonth(anchor));
    const last = addDays(startOfMonth(anchor), daysInMonth(anchor) - 1);
    end = addDays(startOfWeek(last), 7);
  } else { start = anchor; end = addDays(anchor, 14); }
  const days: string[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) days.push(d);
  return { start, end, days };
}

export function shiftView(view: CalendarView, anchor: string, dir: -1 | 1) {
  if (view === "dia") return addDays(anchor, dir);
  if (view === "semana") return addDays(anchor, 7 * dir);
  if (view === "lista") return addDays(anchor, 14 * dir);
  const [y, m] = anchor.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + dir, 1));
  return dt.toISOString().slice(0, 10);
}

export function hoursBetween(startIso: string, endIso: string, breakMinutes = 0) {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000 - breakMinutes / 60;
}

export function formatHours(h: number) {
  const r = Math.round(h * 10) / 10;
  return `${r.toLocaleString("pt-BR")}h`;
}

export function relativeDay(date: string, tz = DEFAULT_TZ) {
  const diff = diffDays(today(tz), date);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  return fmt(`${date}T12:00:00Z`, "EEEE, d 'de' MMM", "UTC");
}
