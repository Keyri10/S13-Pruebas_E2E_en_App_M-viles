export type Role = "client" | "professional";
export type Status = "pending" | "confirmed" | "completed" | "cancelled";

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

export type Session = {
  token: string;
  user: User;
};
