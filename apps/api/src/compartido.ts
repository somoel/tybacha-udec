import { z } from "zod";

export const roles = ["administrador", "profesional", "cuidador"] as const;
export type Rol = (typeof roles)[number];

export const permisosPorRol: Record<Rol, string[]> = {
  administrador: [
    "dashboard:ver",
    "usuarios:gestionar",
    "profesionales:gestionar",
    "cuidadores:gestionar",
    "adultos_mayores:gestionar",
    "historial_medico:gestionar",
    "sft:gestionar",
    "planes:gestionar",
    "seguimiento:ver",
    "notificaciones:gestionar",
    "reportes:ver",
    "auditoria:ver",
    "consentimientos:gestionar",
    "sincronizacion:gestionar"
  ],
  profesional: [
    "dashboard:ver",
    "cuidadores:gestionar",
    "adultos_mayores:ver",
    "historial_medico:gestionar",
    "sft:gestionar",
    "planes:gestionar",
    "seguimiento:ver",
    "notificaciones:ver",
    "reportes:ver",
    "consentimientos:gestionar"
  ],
  cuidador: [
    "dashboard:ver",
    "adultos_mayores:gestionar_asignados",
    "historial_medico:ver_asignados",
    "planes:ver_asignados",
    "seguimiento:gestionar_asignados",
    "notificaciones:ver",
    "sincronizacion:gestionar"
  ]
};

export function rolValido(rol: string): rol is Rol {
  return roles.includes(rol as Rol);
}

export function permisoDeRol(rol: Rol, permiso: string): boolean {
  return permisosPorRol[rol].includes(permiso);
}

export type UsuarioAutenticado = {
  id_usuario: number;
  correo: string;
  rol: Rol;
  estado: "pendiente" | "activo" | "bloqueado" | "inactivo";
  nombres: string;
  apellidos: string;
  permisos: string[];
};

export const estadosUsuario = ["pendiente", "activo", "bloqueado", "inactivo"] as const;
export const generos = ["femenino", "masculino", "otro", "no_informa"] as const;
export const estadosPlan = [
  "borrador",
  "generado",
  "revisado",
  "asignado",
  "activo",
  "pausado",
  "finalizado",
  "cancelado"
] as const;
export const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

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

export const loginSchema = z.object({
  correo,
  contrasena: z.string().min(1).max(120),
  dispositivo: z.string().max(120).optional(),
  recordar_sesion: z.boolean().optional()
});

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
  estado: z.enum(estadosUsuario).optional(),
  perfil: perfilUsuarioSchema.partial().optional()
});

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
  fecha_inicio: fechaIso.nullable().optional(),
  fecha_fin: fechaIso.nullable().optional(),
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
