import { z } from "zod";
import { contrasena, correo } from "./comunes";

export const loginSchema = z.object({
  correo,
  contrasena: z.string().min(1).max(120),
  dispositivo: z.string().max(120).optional(),
  recordar_sesion: z.boolean().optional()
});

export const cambiarContrasenaSchema = z.object({
  contrasena_actual: z.string().min(1).max(120),
  contrasena_nueva: contrasena
});
