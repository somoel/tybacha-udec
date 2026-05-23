import { z } from "zod";
import { fechaIso, genero } from "./comunes";

export const adultoMayorSchema = z.object({
  nombres: z.string().trim().min(2).max(120),
  apellidos: z.string().trim().min(2).max(120),
  fecha_nacimiento: fechaIso,
  genero: genero.default("no_informa"),
  tipo_documento: z.string().trim().max(30).nullable().optional(),
  numero_documento: z.string().trim().max(60).nullable().optional(),
  telefono: z.string().trim().max(40).nullable().optional(),
  correo_contacto: z.string().trim().email().max(255).nullable().optional(),
  direccion: z.string().trim().max(255).nullable().optional(),
  ciudad: z.string().trim().max(120).nullable().optional(),
  nombre_contacto_emergencia: z.string().trim().max(160).nullable().optional(),
  telefono_contacto_emergencia: z.string().trim().max(40).nullable().optional(),
  id_local: z.string().trim().max(80).nullable().optional(),
  version: z.number().int().min(1).optional()
});

export const actualizarAdultoMayorSchema = adultoMayorSchema.partial().extend({
  motivo_inactivacion: z.string().trim().max(255).nullable().optional()
});

export const fotoAdultoMayorSchema = z.object({
  base64: z.string().min(16),
  tipo_mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  ancho_pixeles: z.number().int().positive().max(4096).optional(),
  alto_pixeles: z.number().int().positive().max(4096).optional()
});
