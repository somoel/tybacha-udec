import { Hono } from "hono";
import { crearUsuarioSchema, paginacionConsulta } from "@tybacha/compartido";
import { consultar, consultarUno, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion } from "../../utilidades/errores";
import { hashContrasena } from "../../utilidades/seguridad";
import { registrarCambio } from "../auditoria/servicio";

export const rutasProfesionales = new Hono<{ Variables: VariablesContexto }>();
rutasProfesionales.use("*", requiereAutenticacion);

rutasProfesionales.get("/", requierePermiso("profesionales:gestionar"), async (c) => {
  const q = paginacionConsulta.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const filas = await consultar(
    `SELECT u.id_usuario, u.correo, u.estado, p.nombres, p.apellidos, p.telefono, p.ciudad
     FROM usuario u JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
     WHERE u.rol = 'profesional'
     ORDER BY p.apellidos, p.nombres LIMIT ? OFFSET ?`,
    [q.limite, (q.pagina - 1) * q.limite]
  );
  return c.json({ datos: filas });
});

rutasProfesionales.post("/", requierePermiso("profesionales:gestionar"), async (c) => {
  const datos = crearUsuarioSchema.parse({ ...(await c.req.json()), rol: "profesional" });
  if (c.get("usuario")?.rol !== "administrador") throw new ErrorAplicacion("SOLO_ADMIN", "Solo administradores crean profesionales.", 403);
  if (await consultarUno("SELECT id_usuario FROM usuario WHERE correo = ?", [datos.correo])) {
    throw new ErrorAplicacion("CORREO_DUPLICADO", "El correo ya esta registrado.", 409);
  }
  const id = await transaccion(async (conexion) => {
    const [r] = await conexion.execute(
      "INSERT INTO usuario (correo, contrasena_hash, rol, estado, correo_verificado) VALUES (?, ?, 'profesional', 'activo', 1)",
      [datos.correo, await hashContrasena(datos.contrasena)]
    );
    const idUsuario = Number((r as { insertId: number }).insertId);
    await conexion.execute(
      "INSERT INTO perfil_usuario (id_usuario, nombres, apellidos, telefono, ciudad, genero) VALUES (?, ?, ?, ?, ?, ?)",
      [idUsuario, datos.perfil.nombres, datos.perfil.apellidos, datos.perfil.telefono ?? null, datos.perfil.ciudad ?? null, datos.perfil.genero ?? null]
    );
    return idUsuario;
  });
  await registrarCambio({ tabla: "usuario", id, accion: "crear", usuario: c.get("usuario")?.id_usuario, nuevos: { rol: "profesional" } });
  return c.json({ datos: { id_usuario: id } }, 201);
});
