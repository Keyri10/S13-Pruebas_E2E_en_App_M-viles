import { DatabaseSync } from "node:sqlite";
import {
  addMinutes,
  nextOpenDays,
  toInstant,
  type Status,
} from "./domain.ts";

export type Sql = DatabaseSync;

const schema = `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client', 'professional')),
  studio_name TEXT,
  bio TEXT
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  price_cents INTEGER NOT NULL
);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id),
  client_id TEXT NOT NULL REFERENCES users(id),
  professional_id TEXT NOT NULL REFERENCES users(id),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
`;

export function openDatabase(filename: string): Sql {
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys = ON");
  resetAndSeed(db);
  return db;
}

export function resetAndSeed(db: Sql): void {
  db.exec(`
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS services;
    DROP TABLE IF EXISTS users;
  `);
  db.exec(schema);
  seed(db);
}

function seed(db: Sql): void {
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, role, studio_name, bio) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const people: Array<[string, string, string, string, string | null, string | null]> = [
    ["user-ana", "Ana Gómez", "ana@lumina.app", "client", null, null],
    [
      "user-lucia",
      "Lucía Navarro",
      "lucia@lumina.app",
      "professional",
      "Lúmina",
      "Ocho años en la Roma Norte. Gel, nail art y cuidado de la uña natural.",
    ],
    ["user-sofia", "Sofía Ruiz", "sofia@lumina.app", "client", null, null],
    ["user-camila", "Camila Ortiz", "camila@lumina.app", "client", null, null],
    ["user-elena", "Elena Díaz", "elena@lumina.app", "client", null, null],
  ];
  for (const person of people) insertUser.run(...person);

  const insertService = db.prepare(
    `INSERT INTO services (id, professional_id, name, description, duration_min, price_cents)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const services: Array<[string, string, string, string, number, number]> = [
    [
      "svc-manicure",
      "user-lucia",
      "Manicure clásico",
      "Limpieza, limado y esmalte tradicional.",
      45,
      28000,
    ],
    [
      "svc-gel",
      "user-lucia",
      "Gel semipermanente",
      "Color de larga duración, curado en lámpara.",
      70,
      42000,
    ],
    [
      "svc-art",
      "user-lucia",
      "Nail art",
      "Diseño a mano sobre gel. Cuéntale a Lucía la idea en la nota.",
      90,
      56000,
    ],
    [
      "svc-retiro",
      "user-lucia",
      "Retiro y cuidado",
      "Retiro de gel e hidratación de cutícula.",
      30,
      16000,
    ],
  ];
  for (const service of services) insertService.run(...service);

  const [first, second, third] = nextOpenDays(3);
  insertAppointment(db, {
    id: "apt-sofia-pending",
    serviceId: "svc-manicure",
    clientId: "user-sofia",
    date: first,
    time: "10:00",
    durationMin: 45,
    status: "pending",
    notes: "Prefiere forma almendra.",
  });
  insertAppointment(db, {
    id: "apt-camila-confirmed",
    serviceId: "svc-art",
    clientId: "user-camila",
    date: first,
    time: "16:00",
    durationMin: 90,
    status: "confirmed",
    notes: "Quiere florecitas pequeñas.",
  });
  insertAppointment(db, {
    id: "apt-elena-pending",
    serviceId: "svc-retiro",
    clientId: "user-elena",
    date: second,
    time: "13:00",
    durationMin: 30,
    status: "pending",
    notes: "",
  });
  insertAppointment(db, {
    id: "apt-ana-pending",
    serviceId: "svc-gel",
    clientId: "user-ana",
    date: third,
    time: "11:00",
    durationMin: 70,
    status: "pending",
    notes: "Color vino, sin brillo.",
  });
}

function insertAppointment(
  db: Sql,
  input: {
    id: string;
    serviceId: string;
    clientId: string;
    date: string;
    time: string;
    durationMin: number;
    status: Status;
    notes: string;
  },
): void {
  const startsAt = toInstant(input.date, input.time);
  const endsAt = addMinutes(startsAt, input.durationMin);
  db.prepare(
    `INSERT INTO appointments (
      id, service_id, client_id, professional_id, starts_at, ends_at, status, notes
    ) VALUES (?, ?, ?, 'user-lucia', ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.serviceId,
    input.clientId,
    startsAt,
    endsAt,
    input.status,
    input.notes,
  );
}
