import { Hono } from "hono";
import { actualizarUsuarioSchema, crearUsuarioSchema, paginacionConsulta } from "../../compartido";
import { ejecutar, consultar, consultarUno, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion } from "../../utilidades/errores";
import { hashContrasena } from "../../utilidades/seguridad";
import { registrarCambio } from "../auditoria/servicio";

export const rutasUsuarios = new Hono<{ Variables: VariablesContexto }>();

rutasUsuarios.use("*", requiereAutenticacion);

rutasUsuarios.get("/", requierePermiso("usuarios:gestionar"), async (c) => {
  const consulta = paginacionConsulta.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const offset = (consulta.pagina - 1) * consulta.limite;
  const valores: unknown[] = [];
  let where = "WHERE 1=1";
  if (consulta.busqueda) {
    where += " AND (u.correo LIKE ? OR p.nombres LIKE ? OR p.apellidos LIKE ?)";
    valores.push(`%${consulta.busqueda}%`, `%${consulta.busqueda}%`, `%${consulta.busqueda}%`);
  }
  if (consulta.estado) {
    where += " AND u.estado = ?";
    valores.push(consulta.estado);
  }
  const filas = await consultar(
    `SELECT u.id_usuario, u.correo, u.rol, u.estado, u.ultimo_acceso_en, u.creado_en,
            p.nombres, p.apellidos, p.telefono, p.ciudad
     FROM usuario u JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
     ${where}
     ORDER BY u.creado_en DESC LIMIT ? OFFSET ?`,
    [...valores, consulta.limite, offset]
  );
  return c.json({ datos: filas });
});

rutasUsuarios.post("/", requierePermiso("usuarios:gestionar"), async (c) => {
  const datos = crearUsuarioSchema.parse(await c.req.json());
  const usuarioActual = c.get("usuario");
  if (usuarioActual?.rol !== "administrador") {
    throw new ErrorAplicacion("SOLO_ADMIN", "Solo administradores pueden crear usuarios desde este modulo.", 403);
  }
  const existente = await consultarUno("SELECT id_usuario FROM usuario WHERE correo = ?", [datos.correo]);
  if (existente) throw new ErrorAplicacion("CORREO_DUPLICADO", "El correo ya esta registrado.", 409);
  const id = await transaccion(async (conexion) => {
    const [resultado] = await conexion.execute(
      "INSERT INTO usuario (correo, contrasena_hash, rol, estado, correo_verificado) VALUES (?, ?, ?, 'activo', 1)",
      [datos.correo, await hashContrasena(datos.contrasena), datos.rol]
    );
    const idUsuario = Number((resultado as { insertId: number }).insertId);
    await conexion.execute(
      `INSERT INTO perfil_usuario
       (id_usuario, nombres, apellidos, tipo_documento, numero_documento, telefono, fecha_nacimiento, genero, direccion, ciudad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idUsuario,
        datos.perfil.nombres,
        datos.perfil.apellidos,
        datos.perfil.tipo_documento ?? null,
        datos.perfil.numero_documento ?? null,
        datos.perfil.telefono ?? null,
        datos.perfil.fecha_nacimiento ?? null,
        datos.perfil.genero ?? null,
        datos.perfil.direccion ?? null,
        datos.perfil.ciudad ?? null
      ]
    );
    return idUsuario;
  });
  await registrarCambio({
    tabla: "usuario",
    id,
    accion: "crear",
    usuario: usuarioActual?.id_usuario,
    nuevos: { correo: datos.correo, rol: datos.rol },
    ip: c.get("direccionIp"),
    agente: c.get("agenteUsuario")
  });
  return c.json({ datos: { id_usuario: id } }, 201);
});

rutasUsuarios.put("/:id", requierePermiso("usuarios:gestionar"), async (c) => {
  const id = Number(c.req.param("id"));
  const datos = actualizarUsuarioSchema.parse(await c.req.json());
  if (datos.estado) await ejecutar("UPDATE usuario SET estado = ? WHERE id_usuario = ?", [datos.estado, id]);
  if (datos.perfil) {
    await ejecutar(
      `UPDATE perfil_usuario SET
       nombres = COALESCE(?, nombres), apellidos = COALESCE(?, apellidos), telefono = COALESCE(?, telefono),
       direccion = COALESCE(?, direccion), ciudad = COALESCE(?, ciudad)
       WHERE id_usuario = ?`,
      [
        datos.perfil.nombres ?? null,
        datos.perfil.apellidos ?? null,
        datos.perfil.telefono ?? null,
        datos.perfil.direccion ?? null,
        datos.perfil.ciudad ?? null,
        id
      ]
    );
  }
  await registrarCambio({ tabla: "usuario", id, accion: "actualizar", usuario: c.get("usuario")?.id_usuario, nuevos: datos });
  return c.json({ datos: { ok: true } });
});
