import assert from "node:assert/strict";
import test from "node:test";
import { openDatabase } from "./db.ts";
import { createApp } from "./http.ts";

function setup() {
  const db = openDatabase(":memory:");
  return createApp(db);
}

async function call(
  app: ReturnType<typeof createApp>,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) {
  const response = await app.request(path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json()) as Record<string, unknown>;
  return { status: response.status, data };
}

async function loginAs(app: ReturnType<typeof createApp>, email: string) {
  const result = await call(app, "/auth/login", { method: "POST", body: { email } });
  assert.equal(result.status, 200);
  return result.data as { token: string; user: { role: string; name: string } };
}

test("rechaza un correo desconocido y un cuerpo inválido", async () => {
  const app = setup();
  const unknown = await call(app, "/auth/login", {
    method: "POST",
    body: { email: "nadie@lumina.app" },
  });
  assert.equal(unknown.status, 401);
  assert.match(String(unknown.data.error), /No encontramos/);

  const invalid = await call(app, "/auth/login", {
    method: "POST",
    body: { email: "ana" },
  });
  assert.equal(invalid.status, 400);
});

test("Ana reserva un hueco libre y no puede tomar el de Sofía", async () => {
  const app = setup();
  const ana = await loginAs(app, "ana@lumina.app");
  const lucia = await loginAs(app, "lucia@lumina.app");
  const agenda = await call(app, "/appointments", { token: lucia.token });
  const incoming = agenda.data as unknown as Array<{ id: string; startsAt: string; clientName: string }>;
  const sofia = incoming.find((item) => item.id === "apt-sofia-pending");
  assert.ok(sofia);

  const clash = await call(app, "/appointments", {
    method: "POST",
    token: ana.token,
    body: { serviceId: "svc-manicure", startsAt: sofia.startsAt, notes: "" },
  });
  assert.equal(clash.status, 409);

  const calendar = await call(app, "/calendar", { token: ana.token });
  const days = (calendar.data as { days: string[] }).days;
  const slots = await call(
    app,
    `/availability?serviceId=svc-manicure&date=${days[0]}`,
    { token: ana.token },
  );
  const available = (
    slots.data as { slots: Array<{ time: string; startsAt: string; available: boolean }> }
  ).slots;
  const ten = available.find((slot) => slot.time === "10:00");
  const eleven = available.find((slot) => slot.time === "11:00");
  assert.equal(ten?.available, false);
  assert.equal(eleven?.available, true);

  const booked = await call(app, "/appointments", {
    method: "POST",
    token: ana.token,
    body: { serviceId: "svc-manicure", startsAt: eleven!.startsAt, notes: "Uñas cortas" },
  });
  assert.equal(booked.status, 201);
  assert.equal((booked.data as { status: string }).status, "pending");

  const again = await call(app, "/appointments", {
    method: "POST",
    token: ana.token,
    body: { serviceId: "svc-gel", startsAt: eleven!.startsAt, notes: "" },
  });
  assert.equal(again.status, 409);
});

test("cada rol solo mueve las citas que le corresponden", async () => {
  const app = setup();
  const ana = await loginAs(app, "ana@lumina.app");
  const lucia = await loginAs(app, "lucia@lumina.app");

  const forbidden = await call(app, "/appointments/apt-sofia-pending", {
    method: "PATCH",
    token: ana.token,
    body: { status: "confirmed" },
  });
  assert.equal(forbidden.status, 403);

  const cancelled = await call(app, "/appointments/apt-ana-pending", {
    method: "PATCH",
    token: ana.token,
    body: { status: "cancelled" },
  });
  assert.equal(cancelled.status, 200);
  assert.equal((cancelled.data as { status: string }).status, "cancelled");

  const confirmed = await call(app, "/appointments/apt-sofia-pending", {
    method: "PATCH",
    token: lucia.token,
    body: { status: "confirmed" },
  });
  assert.equal((confirmed.data as { status: string }).status, "confirmed");

  const completed = await call(app, "/appointments/apt-camila-confirmed", {
    method: "PATCH",
    token: lucia.token,
    body: { status: "completed" },
  });
  assert.equal((completed.data as { status: string }).status, "completed");

  const skipped = await call(app, "/appointments/apt-elena-pending", {
    method: "PATCH",
    token: lucia.token,
    body: { status: "completed" },
  });
  assert.equal(skipped.status, 409);

  const dropped = await call(app, "/appointments/apt-elena-pending", {
    method: "PATCH",
    token: lucia.token,
    body: { status: "cancelled" },
  });
  assert.equal((dropped.data as { status: string }).status, "cancelled");

  const mine = await call(app, "/appointments", { token: ana.token });
  const anaRows = mine.data as unknown as Array<{ id: string }>;
  assert.ok(anaRows.some((row) => row.id === "apt-ana-pending"));
  assert.equal(
    anaRows.some((row) => row.id === "apt-sofia-pending"),
    false,
  );
});

test("el reinicio de demostración borra lo reservado en la sesión", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  const ana = await loginAs(app, "ana@lumina.app");
  const calendar = await call(app, "/calendar", { token: ana.token });
  const day = (calendar.data as { days: string[] }).days[1];
  const slots = await call(app, `/availability?serviceId=svc-retiro&date=${day}`, {
    token: ana.token,
  });
  const free = (
    slots.data as { slots: Array<{ time: string; startsAt: string; available: boolean }> }
  ).slots.find((slot) => slot.time === "10:00");
  assert.equal(free?.available, true);
  const booked = await call(app, "/appointments", {
    method: "POST",
    token: ana.token,
    body: { serviceId: "svc-retiro", startsAt: free!.startsAt },
  });
  assert.equal(booked.status, 201);

  const reset = await call(app, "/dev/reset", { method: "POST" });
  assert.equal(reset.status, 200);
  const after = await call(app, "/appointments", { token: ana.token });
  assert.equal(after.status, 401);
});
