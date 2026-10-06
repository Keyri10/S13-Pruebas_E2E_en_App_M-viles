export const TIMEZONE = "America/Mexico_City";
export const OPEN_START_MIN = 10 * 60;
export const OPEN_END_MIN = 18 * 60;
export const SLOT_STEP_MIN = 30;
export const BOOKABLE_DAYS = 6;

export type Role = "client" | "professional";
export type Status = "pending" | "confirmed" | "completed" | "cancelled";

const transitions: Record<Status, Partial<Record<Role, readonly Status[]>>> = {
  pending: {
    client: ["cancelled"],
    professional: ["confirmed", "cancelled"],
  },
  confirmed: {
    client: ["cancelled"],
    professional: ["completed", "cancelled"],
  },
  completed: {
    client: [],
    professional: [],
  },
  cancelled: {
    client: [],
    professional: [],
  },
};

export function canTransition(from: Status, to: Status, role: Role): boolean {
  return (transitions[from][role] ?? []).includes(to);
}

export function todayInMexico(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function weekdayIndex(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isOpenDay(isoDate: string): boolean {
  return weekdayIndex(isoDate) !== 0;
}

export function nextOpenDays(count = BOOKABLE_DAYS, now = new Date()): string[] {
  const days: string[] = [];
  let cursor = addCalendarDays(todayInMexico(now), 1);
  while (days.length < count) {
    if (isOpenDay(cursor)) days.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }
  return days;
}

export function slotStarts(durationMin: number): string[] {
  const slots: string[] = [];
  for (
    let minute = OPEN_START_MIN;
    minute + durationMin <= OPEN_END_MIN;
    minute += SLOT_STEP_MIN
  ) {
    const hours = String(Math.floor(minute / 60)).padStart(2, "0");
    const mins = String(minute % 60).padStart(2, "0");
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

export function toInstant(isoDate: string, hhmm: string): string {
  return new Date(`${isoDate}T${hhmm}:00-06:00`).toISOString();
}

export function addMinutes(instantIso: string, minutes: number): string {
  return new Date(new Date(instantIso).getTime() + minutes * 60_000).toISOString();
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

export function mexicoDateAndTime(instantIso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instantIso));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour")}:${read("minute")}`,
  };
}
