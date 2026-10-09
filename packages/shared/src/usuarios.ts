import { z } from "zod";

export const ROLES = ["Director", "Administrador", "Supervisor"] as const;
export type NombreRol = (typeof ROLES)[number];

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(ROLES),
});

export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    rol: z.enum(ROLES).optional(),
    activo: z.boolean().optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;