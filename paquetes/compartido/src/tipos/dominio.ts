import type { Rol } from "../constantes/roles";

export type UsuarioAutenticado = {
  id_usuario: number;
  correo: string;
  rol: Rol;
  estado: "pendiente" | "activo" | "bloqueado" | "inactivo";
  nombres: string;
  apellidos: string;
  permisos: string[];
};

export type RespuestaApi<T> = {
  datos: T;
  mensaje?: string;
};

export type ErrorApi = {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
};

export type OperacionSincronizacion = {
  id_local: string;
  entidad: string;
  accion: "crear" | "actualizar" | "eliminar" | "registrar";
  payload: Record<string, unknown>;
  creado_en_local: string;
  actualizado_en_local: string;
  intentos: number;
  estado: "pendiente" | "aplicada" | "error" | "conflicto";
  error?: string | null;
  requiere_autenticacion: boolean;
};

export type ResultadoSincronizacion = {
  id_local: string;
  estado: "aplicada" | "error" | "conflicto";
  id_remoto?: number;
  version?: number;
  mensaje?: string;
};
