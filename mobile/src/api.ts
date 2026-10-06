import type { Status } from "./types";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("No hay conexión con el estudio. Revisa que la API esté encendida.", 0);
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(data.error ?? "No se pudo completar la acción.", response.status);
  }
  return data as T;
}

export function money(cents: number): string {
  const amount = cents / 100;
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `Q${formatted}`;
}

export function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00-06:00`));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export const statusLabel: Record<Status, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};
