import type { Context, Next } from "hono";
import type { VariablesContexto } from "../tipos/contexto";
import { consultarUno } from "../base_datos/conexion";
import { ErrorAplicacion } from "../utilidades/errores";
import { verificarAccessToken } from "../utilidades/seguridad";

type UsuarioFila = {
  id_usuario: number;
  correo: string;
  rol: "administrador" | "profesional" | "cuidador";
  estado: "pendiente" | "activo" | "bloqueado" | "inactivo";
  nombres: string;
  apellidos: string;
  permisos: string;
};

export async function requiereAutenticacion(c: Context<{ Variables: VariablesContexto }>, next: Next) {
  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ErrorAplicacion("NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const payload = await verificarAccessToken(token);
  const usuario = await consultarUno<UsuarioFila>(
    `SELECT u.id_usuario, u.correo, u.rol, u.estado, p.nombres, p.apellidos,
      COALESCE(JSON_ARRAYAGG(pe.codigo), JSON_ARRAY()) permisos
     FROM usuario u
     JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
     LEFT JOIN permiso_rol pr ON pr.rol = u.rol
     LEFT JOIN permiso pe ON pe.id_permiso = pr.id_permiso
     WHERE u.id_usuario = ?
     GROUP BY u.id_usuario, p.id_perfil_usuario`,
    [payload.id_usuario]
  );
  if (!usuario || usuario.estado !== "activo") {
    throw new ErrorAplicacion("USUARIO_INACTIVO", "La sesion no corresponde a un usuario activo.", 401);
  }
  c.set("usuario", {
    ...usuario,
    permisos: Array.isArray(usuario.permisos) ? usuario.permisos : JSON.parse(String(usuario.permisos || "[]"))
  });
  await next();
}

export function requierePermiso(...permisos: string[]) {
  return async (c: Context<{ Variables: VariablesContexto }>, next: Next) => {
    const usuario = c.get("usuario");
    if (!usuario) throw new ErrorAplicacion("NO_AUTENTICADO", "Debes iniciar sesion.", 401);
    if (usuario.rol === "administrador" || permisos.some((permiso) => usuario.permisos.includes(permiso))) {
      await next();
      return;
    }
    throw new ErrorAplicacion("SIN_PERMISO", "No tienes permiso para esta accion.", 403);
  };
}
