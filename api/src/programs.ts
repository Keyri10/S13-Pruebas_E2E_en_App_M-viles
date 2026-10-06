import { Context, Effect, Exit } from "effect";
import type { DatabaseSync } from "node:sqlite";
import {
  BOOKABLE_DAYS,
  addMinutes,
  canTransition,
  isOpenDay,
  mexicoDateAndTime,
  nextOpenDays,
  overlaps,
  slotStarts,
  type Role,
  type Status,
} from "./domain.ts";
import {
  Conflict,
  DbError,
  Forbidden,
  NotFound,
  Unauthorized,
  ValidationError,
  type AppError,
} from "./errors.ts";

export class Database extends Context.Tag("Database")<Database, DatabaseSync>() {}

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studioName: string | null;
  bio: string | null;
};

export type Service = {
  id: string;
  professionalId: string;
  professionalName: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
};

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceCents: number;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  startsAt: string;
  endsAt: string;
  status: Status;
  notes: string;
};

export type Slot = {
  time: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studio_name: string | null;
  bio: string | null;
};

type ServiceRow = {
  id: string;
  professional_id: string;
  professional_name: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
};

type AppointmentRow = {
  id: string;
  service_id: string;
  service_name: string;
  duration_min: number;
  price_cents: number;
  client_id: string;
  client_name: string;
  professional_id: string;
  professional_name: string;
  starts_at: string;
  ends_at: string;
  status: Status;
  notes: string;
};

const appointmentSelect = `
  SELECT
    a.id,
    a.service_id,
    s.name AS service_name,
    s.duration_min,
    s.price_cents,
    a.client_id,
    c.name AS client_name,
    a.professional_id,
    p.name AS professional_name,
    a.starts_at,
    a.ends_at,
    a.status,
    a.notes
  FROM appointments a
  JOIN services s ON s.id = a.service_id
  JOIN users c ON c.id = a.client_id
  JOIN users p ON p.id = a.professional_id
`;

const sqlite = <A>(run: () => A) =>
  Effect.try({
    try: run,
    catch: (cause) =>
      new DbError({
        message: cause instanceof Error ? cause.message : "Error de base de datos",
      }),
  });

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    studioName: row.studio_name,
    bio: row.bio,
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    professionalId: row.professional_id,
    professionalName: row.professional_name,
    name: row.name,
    description: row.description,
    durationMin: row.duration_min,
    priceCents: row.price_cents,
  };
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    durationMin: row.duration_min,
    priceCents: row.price_cents,
    clientId: row.client_id,
    clientName: row.client_name,
    professionalId: row.professional_id,
    professionalName: row.professional_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes,
  };
}

const findUserByEmail = (email: string) =>
  Effect.gen(function* () {
    const db = yield* Database;
    return yield* sqlite(() =>
      db
        .prepare(
          `SELECT id, name, email, role, studio_name, bio FROM users WHERE email = ?`,
        )
        .get(email) as UserRow | undefined,
    );
  });

const requireUser = (token: string | undefined) =>
  Effect.gen(function* () {
    if (!token) {
      return yield* Effect.fail(new Unauthorized({ message: "Falta iniciar sesión." }));
    }
    const db = yield* Database;
    const row = yield* sqlite(() =>
      db
        .prepare(
          `SELECT u.id, u.name, u.email, u.role, u.studio_name, u.bio
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = ?`,
        )
        .get(token) as UserRow | undefined,
    );
    if (!row) {
      return yield* Effect.fail(new Unauthorized({ message: "La sesión no es válida." }));
    }
    return mapUser(row);
  });

const findService = (serviceId: string) =>
  Effect.gen(function* () {
    const db = yield* Database;
    return yield* sqlite(() =>
      db
        .prepare(
          `SELECT s.id, s.professional_id, p.name AS professional_name, s.name,
                  s.description, s.duration_min, s.price_cents
           FROM services s JOIN users p ON p.id = s.professional_id
           WHERE s.id = ?`,
        )
        .get(serviceId) as ServiceRow | undefined,
    );
  });

const activeAppointments = (professionalId: string) =>
  Effect.gen(function* () {
    const db = yield* Database;
    const rows = yield* sqlite(() =>
      db
        .prepare(
          `${appointmentSelect}
           WHERE a.professional_id = ? AND a.status != 'cancelled'
           ORDER BY a.starts_at ASC`,
        )
        .all(professionalId) as unknown as AppointmentRow[],
    );
    return rows.map(mapAppointment);
  });

const transaction = <A, E>(body: Effect.Effect<A, E, Database>) =>
  Effect.gen(function* () {
    const db = yield* Database;
    yield* sqlite(() => db.exec("BEGIN IMMEDIATE"));
    const exit = yield* Effect.exit(body);
    if (Exit.isSuccess(exit)) {
      yield* sqlite(() => db.exec("COMMIT"));
      return exit.value;
    }
    yield* sqlite(() => db.exec("ROLLBACK"));
    return yield* Effect.failCause(exit.cause);
  });

export const login = (email: string) =>
  Effect.gen(function* () {
    const row = yield* findUserByEmail(email.toLowerCase());
    if (!row) {
      return yield* Effect.fail(
        new Unauthorized({ message: "No encontramos una cuenta con ese correo." }),
      );
    }
    const db = yield* Database;
    const token = crypto.randomUUID();
    yield* sqlite(() =>
      db
        .prepare(`INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)`)
        .run(token, row.id, new Date().toISOString()),
    );
    return { token, user: mapUser(row) };
  });

export const listServices = (token: string | undefined) =>
  Effect.gen(function* () {
    yield* requireUser(token);
    const db = yield* Database;
    const rows = yield* sqlite(() =>
      db
        .prepare(
          `SELECT s.id, s.professional_id, p.name AS professional_name, s.name,
                  s.description, s.duration_min, s.price_cents
           FROM services s JOIN users p ON p.id = s.professional_id
           ORDER BY s.price_cents ASC`,
        )
        .all() as unknown as ServiceRow[],
    );
    return rows.map(mapService);
  });

export const calendar = (token: string | undefined) =>
  Effect.gen(function* () {
    yield* requireUser(token);
    return {
      timezone: "America/Mexico_City",
      hours: { start: "10:00", end: "18:00" },
      days: nextOpenDays(BOOKABLE_DAYS),
    };
  });

export const availability = (
  token: string | undefined,
  serviceId: string,
  date: string,
) =>
  Effect.gen(function* () {
    yield* requireUser(token);
    const row = yield* findService(serviceId);
    if (!row) {
      return yield* Effect.fail(new NotFound({ message: "No encontramos ese servicio." }));
    }
    if (!isOpenDay(date) || !nextOpenDays(BOOKABLE_DAYS).includes(date)) {
      return yield* Effect.fail(
        new ValidationError({
          message: "Ese día no está abierto. El estudio trabaja de lunes a sábado.",
        }),
      );
    }
    const service = mapService(row);
    const taken = yield* activeAppointments(service.professionalId);
    const slots: Slot[] = slotStarts(service.durationMin).map((time) => {
      const startsAt = new Date(`${date}T${time}:00-06:00`).toISOString();
      const endsAt = addMinutes(startsAt, service.durationMin);
      const available = !taken.some((appointment) =>
        overlaps(appointment.startsAt, appointment.endsAt, startsAt, endsAt),
      );
      return { time, startsAt, endsAt, available };
    });
    return { date, service, slots };
  });

export const book = (
  token: string | undefined,
  input: { serviceId: string; startsAt: string; notes: string },
) =>
  Effect.gen(function* () {
    const user = yield* requireUser(token);
    if (user.role !== "client") {
      return yield* Effect.fail(
        new Forbidden({ message: "Solo un cliente puede reservar una cita." }),
      );
    }
    const row = yield* findService(input.serviceId);
    if (!row) {
      return yield* Effect.fail(new NotFound({ message: "No encontramos ese servicio." }));
    }
    const service = mapService(row);
    const when = mexicoDateAndTime(input.startsAt);
    const validStart = slotStarts(service.durationMin).includes(when.time);
    const dayIsBookable = nextOpenDays(BOOKABLE_DAYS).includes(when.date);
    if (!validStart || !dayIsBookable) {
      return yield* Effect.fail(
        new ValidationError({ message: "Ese horario no pertenece a la agenda del estudio." }),
      );
    }
    const startsAt = new Date(`${when.date}T${when.time}:00-06:00`).toISOString();
    const endsAt = addMinutes(startsAt, service.durationMin);

    return yield* transaction(
      Effect.gen(function* () {
        const taken = yield* activeAppointments(service.professionalId);
        const clash = taken.some((appointment) =>
          overlaps(appointment.startsAt, appointment.endsAt, startsAt, endsAt),
        );
        if (clash) {
          return yield* Effect.fail(
            new Conflict({ message: "Ese horario ya está ocupado." }),
          );
        }
        const db = yield* Database;
        const id = crypto.randomUUID();
        yield* sqlite(() =>
          db
            .prepare(
              `INSERT INTO appointments (
                id, service_id, client_id, professional_id, starts_at, ends_at, status, notes
              ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            )
            .run(
              id,
              service.id,
              user.id,
              service.professionalId,
              startsAt,
              endsAt,
              input.notes.trim(),
            ),
        );
        const created = yield* sqlite(() =>
          db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(id) as
            | AppointmentRow
            | undefined,
        );
        if (!created) {
          return yield* Effect.fail(new DbError({ message: "La cita no quedó guardada." }));
        }
        return mapAppointment(created);
      }),
    );
  });

export const listAppointments = (token: string | undefined) =>
  Effect.gen(function* () {
    const user = yield* requireUser(token);
    const db = yield* Database;
    const column = user.role === "client" ? "a.client_id" : "a.professional_id";
    const rows = yield* sqlite(() =>
      db
        .prepare(`${appointmentSelect} WHERE ${column} = ? ORDER BY a.starts_at ASC`)
        .all(user.id) as unknown as AppointmentRow[],
    );
    return rows.map(mapAppointment);
  });

export const changeStatus = (
  token: string | undefined,
  appointmentId: string,
  status: Status,
) =>
  Effect.gen(function* () {
    const user = yield* requireUser(token);
    const db = yield* Database;
    const row = yield* sqlite(() =>
      db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(appointmentId) as
        | AppointmentRow
        | undefined,
    );
    if (!row) {
      return yield* Effect.fail(new NotFound({ message: "No encontramos esa cita." }));
    }
    const current = mapAppointment(row);
    const owns =
      user.role === "client"
        ? current.clientId === user.id
        : current.professionalId === user.id;
    if (!owns) {
      return yield* Effect.fail(
        new Forbidden({ message: "Esta cita pertenece a otra persona." }),
      );
    }
    if (!canTransition(current.status, status, user.role)) {
      return yield* Effect.fail(
        new Conflict({ message: "Esa cita no puede pasar a ese estado." }),
      );
    }
    yield* sqlite(() =>
      db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`).run(status, appointmentId),
    );
    const updated = yield* sqlite(() =>
      db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(appointmentId) as AppointmentRow,
    );
    return mapAppointment(updated);
  });

export type ProgramError = AppError;
