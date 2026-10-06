import { z } from "zod";

export const LoginBody = z.object({
  email: z
    .string({ required_error: "Escribe un correo." })
    .trim()
    .email("El correo no tiene un formato válido."),
});

export const AvailabilityQuery = z.object({
  serviceId: z.string().min(1, "Falta el servicio."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser AAAA-MM-DD."),
});

export const BookBody = z.object({
  serviceId: z.string().min(1, "Falta el servicio."),
  startsAt: z.string().datetime({ offset: true, message: "La hora de inicio no es válida." }),
  notes: z.string().max(200, "La nota admite hasta 200 caracteres.").optional().default(""),
});

export const StatusBody = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"], {
    errorMap: () => ({ message: "El estado pedido no es válido." }),
  }),
});
