import { SignJWT } from "jose";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";

type SolicitudVercel = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type RespuestaVercel = {
  setHeader: (nombre: string, valor: string | string[]) => void;
  status: (codigo: number) => RespuestaVercel;
  json: (cuerpo: unknown) => void;
  end: () => void;
};

type UsuarioLogin = {
  id_usuario: number;
  correo: string;
  contrasena_hash: string;
  rol: "administrador" | "profesional" | "cuidador";
  estado: "pendiente" | "activo" | "bloqueado" | "inactivo";
  nombres: string;
  apellidos: string;
};

const permisosPorRol = {
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

function aplicarCors(req: SolicitudVercel, res: RespuestaVercel) {
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

function crearConexion() {
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

function sha256(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

function depuracionActiva(req: SolicitudVercel) {
  const valor = req.headers["x-debug-login"];
  const valorTexto = Array.isArray(valor) ? valor[0] : valor;
  return valorTexto === process.env.CRON_SECRET || process.env.DEBUG_LOGIN === "true";
}

async function crearAccessToken(usuario: UsuarioLogin) {
  const secreto = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
  return new SignJWT({
    correo: usuario.correo,
    rol: usuario.rol,
    permisos: permisosPorRol[usuario.rol]
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuario.id_usuario))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secreto);
}

async function crearRefreshToken(idUsuario: number, idSesion: number) {
  const secreto = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
  const token = await new SignJWT({ sid: idSesion, jti: randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secreto);
  return { token, hash: sha256(token) };
}

function cuerpoComoObjeto(body: unknown): Record<string, unknown> {
  if (typeof body === "string") return JSON.parse(body);
  if (body && typeof body === "object") return body as Record<string, unknown>;
  return {};
}

export default async function handler(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: { codigo: "METODO_NO_PERMITIDO", mensaje: "Metodo no permitido." } });
    return;
  }

  let conexion: mysql.Connection | null = null;
  try {
    const debug = depuracionActiva(req);
    const cuerpo = cuerpoComoObjeto(req.body);
    const correo = String(cuerpo.correo ?? "").trim().toLowerCase();
    const contrasena = String(cuerpo.contrasena ?? "");
    if (!correo || !contrasena) {
      res.status(422).json({
        error: {
          codigo: "VALIDACION",
          mensaje: "Correo y contrasena son obligatorios.",
          depuracion: debug
            ? {
                body_tipo: typeof req.body,
                body_claves: cuerpo && typeof cuerpo === "object" ? Object.keys(cuerpo) : [],
                correo_recibido: Boolean(correo),
                contrasena_recibida: Boolean(contrasena)
              }
            : undefined
        }
      });
      return;
    }

    conexion = await crearConexion();
    const [filas] = await conexion.execute(
      `SELECT u.id_usuario, u.correo, u.contrasena_hash, u.rol, u.estado, p.nombres, p.apellidos
       FROM usuario u JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
       WHERE u.correo = ?`,
      [correo] as any
    );
    const usuario = (filas as UsuarioLogin[])[0];
    const contrasenaCoincide = usuario ? await bcrypt.compare(contrasena, usuario.contrasena_hash) : false;
    if (!usuario || usuario.estado !== "activo" || !contrasenaCoincide) {
      res.status(401).json({
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Correo o contrasena invalidos.",
          depuracion: debug
            ? {
                correo_normalizado: correo,
                usuario_encontrado: Boolean(usuario),
                estado_usuario: usuario?.estado ?? null,
                rol_usuario: usuario?.rol ?? null,
                hash_prefijo: usuario?.contrasena_hash?.slice(0, 7) ?? null,
                hash_longitud: usuario?.contrasena_hash?.length ?? null,
                hash_huella: usuario?.contrasena_hash ? sha256(usuario.contrasena_hash).slice(0, 12) : null,
                contrasena_longitud: contrasena.length,
                contrasena_coincide: contrasenaCoincide
              }
            : undefined
        }
      });
      return;
    }

    const [resultadoSesion] = await conexion.execute(
      `INSERT INTO sesion_usuario
        (id_usuario, token_refresco_hash, dispositivo, direccion_ip, agente_usuario, recordar_sesion, expira_en)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 30 DAY))`,
      [
        usuario.id_usuario,
        "pendiente",
        String(cuerpo.dispositivo ?? "web"),
        Array.isArray(req.headers["x-forwarded-for"]) ? req.headers["x-forwarded-for"][0] : req.headers["x-forwarded-for"] || null,
        Array.isArray(req.headers["user-agent"]) ? req.headers["user-agent"][0] : req.headers["user-agent"] || null,
        cuerpo.recordar_sesion ? 1 : 0
      ] as any
    );
    const idSesion = Number((resultadoSesion as { insertId: number }).insertId);
    const refresh = await crearRefreshToken(usuario.id_usuario, idSesion);
    await conexion.execute("UPDATE sesion_usuario SET token_refresco_hash = ? WHERE id_sesion_usuario = ?", [
      refresh.hash,
      idSesion
    ] as any);
    await conexion.execute("UPDATE usuario SET ultimo_acceso_en = UTC_TIMESTAMP(3) WHERE id_usuario = ?", [
      usuario.id_usuario
    ] as any);

    const accessToken = await crearAccessToken(usuario);
    res.setHeader(
      "Set-Cookie",
      `tybacha_refresh=${refresh.token}; HttpOnly; Secure; SameSite=None; Path=/api/auth; Max-Age=${60 * 60 * 24 * 30}`
    );
    res.status(200).json({
      datos: {
        access_token: accessToken,
        refresh_token: refresh.token,
        usuario: {
          id_usuario: usuario.id_usuario,
          correo: usuario.correo,
          rol: usuario.rol,
          estado: usuario.estado,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          permisos: permisosPorRol[usuario.rol]
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        codigo: "LOGIN_ERROR",
        mensaje: "No fue posible iniciar sesion.",
        detalle: error instanceof Error ? error.message : "Error desconocido"
      }
    });
  } finally {
    await conexion?.end().catch(() => undefined);
  }
}
