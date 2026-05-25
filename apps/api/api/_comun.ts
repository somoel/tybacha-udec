import { jwtVerify } from "jose";
import mysql from "mysql2/promise";

export type SolicitudVercel = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type RespuestaVercel = {
  setHeader: (nombre: string, valor: string | string[]) => void;
  status: (codigo: number) => RespuestaVercel;
  json: (cuerpo: unknown) => void;
  end: () => void;
};

export type UsuarioToken = {
  id_usuario: number;
  rol: "administrador" | "profesional" | "cuidador";
  permisos: string[];
};

export function aplicarCors(req: SolicitudVercel, res: RespuestaVercel) {
  const origen = req.headers.origin;
  const origenTexto = Array.isArray(origen) ? origen[0] : origen;
  const permitidos = String(process.env.CORS_ORIGEN ?? "")
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);
  const permitido = origenTexto && permitidos.includes(origenTexto) ? origenTexto : permitidos[0] || "*";
  res.setHeader("Access-Control-Allow-Origin", permitido);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-cron-secret");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Vary", "Origin");
}

export function responderOptions(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function crearConexion() {
  return mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT || 4000),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: String(process.env.TIDB_ENABLE_SSL) === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: false } : undefined,
    connectTimeout: 8000
  });
}

export async function obtenerUsuario(req: SolicitudVercel): Promise<UsuarioToken> {
  const header = req.headers.authorization;
  const texto = Array.isArray(header) ? header[0] : header;
  const token = texto?.startsWith("Bearer ") ? texto.slice(7) : "";
  if (!token) throw new Error("NO_AUTENTICADO");
  const secreto = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
  const verificado = await jwtVerify(token, secreto);
  return {
    id_usuario: Number(verificado.payload.sub),
    rol: verificado.payload.rol as UsuarioToken["rol"],
    permisos: (verificado.payload.permisos as string[]) ?? []
  };
}

export function valorQuery(req: SolicitudVercel, clave: string, defecto = "") {
  const valor = req.query?.[clave];
  return Array.isArray(valor) ? valor[0] ?? defecto : valor ?? defecto;
}

export function manejarError(res: RespuestaVercel, error: unknown) {
  const mensaje = error instanceof Error ? error.message : "Error desconocido";
  const estado = mensaje === "NO_AUTENTICADO" ? 401 : 500;
  res.status(estado).json({
    error: {
      codigo: mensaje === "NO_AUTENTICADO" ? "NO_AUTENTICADO" : "ERROR_API",
      mensaje: mensaje === "NO_AUTENTICADO" ? "Debes iniciar sesion." : "No fue posible completar la solicitud.",
      detalle: mensaje
    }
  });
}
