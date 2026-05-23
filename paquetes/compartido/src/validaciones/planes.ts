import { z } from "zod";
import { diasSemana, estadosPlan } from "../constantes/estados";

export const ejercicioPlanSchema = z.object({
  id_ejercicio: z.number().int().positive().nullable().optional(),
  nombre_personalizado: z.string().trim().min(2).max(160),
  descripcion_personalizada: z.string().trim().max(2000).nullable().optional(),
  dia_semana: z.enum(diasSemana),
  orden: z.number().int().min(1).max(20).default(1),
  series: z.number().int().min(1).max(20).nullable().optional(),
  repeticiones: z.number().int().min(1).max(200).nullable().optional(),
  duracion_segundos: z.number().int().min(1).max(7200).nullable().optional(),
  descanso_segundos: z.number().int().min(0).max(1800).nullable().optional(),
  dificultad: z.enum(["bajo", "medio", "alto"]).default("bajo"),
  instrucciones: z.string().trim().min(2).max(3000)
});

export const crearPlanSchema = z.object({
  id_adulto_mayor: z.number().int().positive(),
  titulo: z.string().trim().min(2).max(160),
  objetivo: z.string().trim().max(3000).nullable().optional(),
  nivel_dificultad: z.enum(["bajo", "medio", "alto"]).default("bajo"),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  ejercicios: z.array(ejercicioPlanSchema).min(1).max(30)
});

export const cambiarEstadoPlanSchema = z.object({
  estado: z.enum(estadosPlan),
  motivo: z.string().trim().max(255).optional()
});

export const generarPlanIaSchema = z.object({
  id_adulto_mayor: z.number().int().positive(),
  objetivo: z.string().trim().max(800).optional(),
  nivel_dificultad: z.enum(["bajo", "medio", "alto"]).default("bajo"),
  restricciones: z.string().trim().max(1200).optional()
});

export const respuestaGeminiPlanSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  objetivo: z.string().trim().min(2).max(2000),
  ejercicios: z.array(ejercicioPlanSchema).length(5)
});
