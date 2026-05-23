import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { loginSchema } from "@tybacha/compartido";
import { consultarUno, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion } from "../../utilidades/errores";
import { compararContrasena, crearAccessToken, crearRefreshToken, sha256, verificarRefreshToken } from "../../utilidades/seguridad";
import { registrarAutenticacion } from "../auditoria/servicio";

type UsuarioLogin = {
  id_usuario: number;
  correo: string;
  contrasena_hash: string;
  rol: "administrador" | "profesional" | "cuidador";
  estado: "pendiente" | "activo" | "bloqueado" | "inactivo";
  nombres: string;
  apellidos: string;
};

export const rutasAutenticacion = new Hono<{ Variables: VariablesContexto }>();

rutasAutenticacion.post("/login", async (c) => {
  const cuerpo = loginSchema.parse(await c.req.json());
  const usuario = await consultarUno<UsuarioLogin>(
    `SELECT u.id_usuario, u.correo, u.contrasena_hash, u.rol, u.estado, p.nombres, p.apellidos
     FROM usuario u JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
     WHERE u.correo = ?`,
    [cuerpo.correo]
  );

  if (!usuario || usuario.estado !== "activo" || !(await compararContrasena(cuerpo.contrasena, usuario.contrasena_hash))) {
    await registrarAutenticacion({
      correo: cuerpo.correo,
      accion: "login_fallido",
      resultado: "fallido",
      motivo: "Credenciales invalidas o usuario inactivo",
      ip: c.get("direccionIp"),
      agente: c.get("agenteUsuario")
    });
    throw new ErrorAplicacion("CREDENCIALES_INVALIDAS", "Correo o contrasena invalidos.", 401);
  }

  const sesion = await ejecutar(
    `INSERT INTO sesion_usuario
      (id_usuario, token_refresco_hash, dispositivo, direccion_ip, agente_usuario, recordar_sesion, expira_en)
     VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 30 DAY))`,
    [usuario.id_usuario, "pendiente", cuerpo.dispositivo ?? null, c.get("direccionIp"), c.get("agenteUsuario"), cuerpo.recordar_sesion ? 1 : 0]
  );
  const refresh = await crearRefreshToken(usuario.id_usuario, Number(sesion.insertId));
  await ejecutar("UPDATE sesion_usuario SET token_refresco_hash = ? WHERE id_sesion_usuario = ?", [
    refresh.hash,
    sesion.insertId
  ]);

  const usuarioSeguro = {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    permisos: []
  };
  const accessToken = await crearAccessToken(usuarioSeguro);
  await ejecutar("UPDATE usuario SET ultimo_acceso_en = UTC_TIMESTAMP(3) WHERE id_usuario = ?", [usuario.id_usuario]);
  await registrarAutenticacion({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    accion: "login_exitoso",
    resultado: "exitoso",
    ip: c.get("direccionIp"),
    agente: c.get("agenteUsuario")
  });
  setCookie(c, "tybacha_refresh", refresh.token, {
    httpOnly: true,
    secure: c.req.url.startsWith("https://"),
    sameSite: "None",
    path: "/api/auth",
    maxAge: 60 * 60 * 24 * 30
  });
  return c.json({ datos: { access_token: accessToken, refresh_token: refresh.token, usuario: usuarioSeguro } });
});

rutasAutenticacion.post("/refresh", async (c) => {
  const cuerpo = await c.req.json().catch(() => ({}));
  const token = String(cuerpo.refresh_token ?? getCookie(c, "tybacha_refresh") ?? "");
  if (!token) throw new ErrorAplicacion("SIN_REFRESH", "No hay token de refresco.", 401);
  const payload = await verificarRefreshToken(token);
  const hash = sha256(token);
  const sesion = await consultarUno<{ id_usuario: number; revocada_en: string | null; expira_en: string }>(
    `SELECT id_usuario, revocada_en, expira_en FROM sesion_usuario
     WHERE id_sesion_usuario = ? AND token_refresco_hash = ? AND expira_en > UTC_TIMESTAMP(3)`,
    [payload.id_sesion_usuario, hash]
  );
  if (!sesion || sesion.revocada_en) throw new ErrorAplicacion("REFRESH_INVALIDO", "La sesion expiro.", 401);
  const usuario = await consultarUno<UsuarioLogin>(
    `SELECT u.id_usuario, u.correo, u.contrasena_hash, u.rol, u.estado, p.nombres, p.apellidos
     FROM usuario u JOIN perfil_usuario p ON p.id_usuario = u.id_usuario WHERE u.id_usuario = ?`,
    [payload.id_usuario]
  );
  if (!usuario || usuario.estado !== "activo") throw new ErrorAplicacion("USUARIO_INACTIVO", "Usuario inactivo.", 401);
  const accessToken = await crearAccessToken({ ...usuario, permisos: [] });
  await registrarAutenticacion({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    accion: "refresh",
    resultado: "exitoso",
    ip: c.get("direccionIp"),
    agente: c.get("agenteUsuario")
  });
  return c.json({ datos: { access_token: accessToken } });
});

rutasAutenticacion.post("/logout", requiereAutenticacion, async (c) => {
  const cuerpo = await c.req.json().catch(() => ({}));
  const token = String(cuerpo.refresh_token ?? getCookie(c, "tybacha_refresh") ?? "");
  if (token) {
    await ejecutar("UPDATE sesion_usuario SET revocada_en = UTC_TIMESTAMP(3) WHERE token_refresco_hash = ?", [sha256(token)]);
  }
  const usuario = c.get("usuario");
  await registrarAutenticacion({
    id_usuario: usuario?.id_usuario,
    correo: usuario?.correo ?? "desconocido",
    accion: "logout",
    resultado: "exitoso",
    ip: c.get("direccionIp"),
    agente: c.get("agenteUsuario")
  });
  deleteCookie(c, "tybacha_refresh", { path: "/api/auth" });
  return c.json({ datos: { ok: true } });
});

rutasAutenticacion.get("/me", requiereAutenticacion, async (c) => c.json({ datos: c.get("usuario") }));
