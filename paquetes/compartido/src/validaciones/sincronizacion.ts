import { z } from "zod";

export const operacionSincronizacionSchema = z.object({
  id_local: z.string().trim().min(1).max(120),
  entidad: z.string().trim().min(1).max(120),
  accion: z.enum(["crear", "actualizar", "eliminar", "registrar"]),
  payload: z.record(z.unknown()),
  creado_en_local: z.string().min(1),
  actualizado_en_local: z.string().min(1),
  intentos: z.number().int().min(0).default(0),
  estado: z.enum(["pendiente", "aplicada", "error", "conflicto"]).default("pendiente"),
  error: z.string().nullable().optional(),
  requiere_autenticacion: z.boolean().default(true)
});

export const loteSincronizacionSchema = z.object({
  operaciones: z.array(operacionSincronizacionSchema).min(1).max(100)
});
