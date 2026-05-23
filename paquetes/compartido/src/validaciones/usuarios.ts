import { z } from "zod";
import { contrasena, correo, fechaIso, genero, rolUsuario } from "./comunes";

export const perfilUsuarioSchema = z.object({
  nombres: z.string().trim().min(2).max(120),
  apellidos: z.string().trim().min(2).max(120),
  tipo_documento: z.string().trim().max(30).nullable().optional(),
  numero_documento: z.string().trim().max(60).nullable().optional(),
  telefono: z.string().trim().max(40).nullable().optional(),
  fecha_nacimiento: fechaIso.nullable().optional(),
  genero: genero.nullable().optional(),
  direccion: z.string().trim().max(255).nullable().optional(),
  ciudad: z.string().trim().max(120).nullable().optional()
});

export const crearUsuarioSchema = z.object({
  correo,
  contrasena,
  rol: rolUsuario,
  perfil: perfilUsuarioSchema
});

export const actualizarUsuarioSchema = z.object({
  estado: z.enum(["pendiente", "activo", "bloqueado", "inactivo"]).optional(),
  perfil: perfilUsuarioSchema.partial().optional()
});
