import { z } from "zod";
import { generos } from "../constantes/estados";
import { roles } from "../constantes/roles";

export const idNumerico = z.coerce.number().int().positive();

export const paginacionConsulta = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  busqueda: z.string().trim().max(120).optional(),
  estado: z.string().trim().max(40).optional()
});

export const correo = z.string().trim().email().max(255).transform((valor) => valor.toLowerCase());

export const contrasena = z.string().min(10).max(120);

export const rolUsuario = z.enum(roles);

export const genero = z.enum(generos);

export const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
