import { Effect, Either } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { DatabaseSync } from "node:sqlite";
import { resetAndSeed } from "./db.ts";
import { statusFor, type AppError } from "./errors.ts";
import {
  availability,
  book,
  calendar,
  changeStatus,
  Database,
  listAppointments,
  listServices,
  login,
} from "./programs.ts";
import { AvailabilityQuery, BookBody, LoginBody, StatusBody } from "./schemas.ts";

function bearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

async function run<A>(
  effect: Effect.Effect<A, AppError, Database>,
  db: DatabaseSync,
): Promise<{ ok: true; value: A } | { ok: false; status: number; error: string }> {
  const result = await Effect.runPromise(
    effect.pipe(Effect.provideService(Database, db), Effect.either),
  );
  if (Either.isLeft(result)) {
    return { ok: false, status: statusFor(result.left), error: result.left.message };
  }
  return { ok: true, value: result.right };
}

export function createApp(db: DatabaseSync) {
  const app = new Hono();
  app.use("*", cors());

  app.get("/health", (c) => c.json({ ok: true, service: "lumina-api" }));

  app.post("/dev/reset", (c) => {
    if (process.env.NODE_ENV === "production") {
      return c.json({ error: "El reinicio de demostración está apagado." }, 404);
    }
    resetAndSeed(db);
    return c.json({ ok: true });
  });

  app.post("/auth/login", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = LoginBody.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        400,
      );
    }
    const result = await run(login(parsed.data.email), db);
    if (!result.ok) return c.json({ error: result.error }, result.status as 401);
    return c.json(result.value);
  });

  app.get("/services", async (c) => {
    const result = await run(listServices(bearer(c.req.header("authorization"))), db);
    if (!result.ok) return c.json({ error: result.error }, result.status as 401);
    return c.json(result.value);
  });

  app.get("/calendar", async (c) => {
    const result = await run(calendar(bearer(c.req.header("authorization"))), db);
    if (!result.ok) return c.json({ error: result.error }, result.status as 401);
    return c.json(result.value);
  });

  app.get("/availability", async (c) => {
    const parsed = AvailabilityQuery.safeParse({
      serviceId: c.req.query("serviceId"),
      date: c.req.query("date"),
    });
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        400,
      );
    }
    const result = await run(
      availability(
        bearer(c.req.header("authorization")),
        parsed.data.serviceId,
        parsed.data.date,
      ),
      db,
    );
    if (!result.ok) return c.json({ error: result.error }, result.status as 400);
    return c.json(result.value);
  });

  app.get("/appointments", async (c) => {
    const result = await run(listAppointments(bearer(c.req.header("authorization"))), db);
    if (!result.ok) return c.json({ error: result.error }, result.status as 401);
    return c.json(result.value);
  });

  app.post("/appointments", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = BookBody.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        400,
      );
    }
    const result = await run(
      book(bearer(c.req.header("authorization")), parsed.data),
      db,
    );
    if (!result.ok) return c.json({ error: result.error }, result.status as 409);
    return c.json(result.value, 201);
  });

  app.patch("/appointments/:id", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = StatusBody.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        400,
      );
    }
    const result = await run(
      changeStatus(
        bearer(c.req.header("authorization")),
        c.req.param("id"),
        parsed.data.status,
      ),
      db,
    );
    if (!result.ok) return c.json({ error: result.error }, result.status as 409);
    return c.json(result.value);
  });

  app.notFound((c) => c.json({ error: "Ruta no encontrada." }, 404));

  return app;
}
