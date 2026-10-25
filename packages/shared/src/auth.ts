import { z } from "zod";

// Datos que se envían al iniciar sesión
export const loginSchema = z.object({
  // El email se limpia (espacios, mayúsculas) y se valida su formato
  email: z.string().trim().toLowerCase().email("Email inválido"),
  // En login solo exigimos que no esté vacía; las reglas de longitud aplican al crearla
  password: z.string().min(1, "La contraseña es requerida"),
});

// Tipo de TypeScript derivado del esquema
export type LoginInput = z.infer<typeof loginSchema>;