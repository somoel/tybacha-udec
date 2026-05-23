import { Hono } from "hono";
import { crearUsuarioSchema, paginacionConsulta } from "@tybacha/compartido";
import { consultar, consultarUno, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion } from "../../utilidades/errores";
import { hashContrasena } from "../../utilidades/seguridad";
import { registrarCambio } from "../auditoria/servicio";

export const rutasCuidadores = new Hono<{ Variables: VariablesContexto }>();
rutasCuidadores.use("*", requiereAutenticacion);

rutasCuidadores.get("/", requierePermiso("cuidadores:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  const q = paginacionConsulta.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const filtro = usuario?.rol === "profesional" ? " AND pc.id_profesional = ?" : "";
  const valores = usuario?.rol === "profesional" ? [usuario.id_usuario, q.limite, (q.pagina - 1) * q.limite] : [q.limite, (q.pagina - 1) * q.limite];
  const filas = await consultar(
    `SELECT u.id_usuario, u.correo, u.estado, p.nombres, p.apellidos, p.telefono, p.ciudad,
      COUNT(DISTINCT aa.id_adulto_mayor) adultos_asignados
     FROM usuario u
     JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
     LEFT JOIN profesional_cuidador pc ON pc.id_cuidador = u.id_usuario AND pc.estado = 'activo'
     LEFT JOIN asignacion_cuidador_adulto_mayor aa ON aa.id_cuidador = u.id_usuario AND aa.estado = 'activa'
     WHERE u.rol = 'cuidador' ${filtro}
     GROUP BY u.id_usuario, p.id_perfil_usuario
     ORDER BY p.apellidos, p.nombres LIMIT ? OFFSET ?`,
    valores
  );
  return c.json({ datos: filas });
});

rutasCuidadores.post("/", requierePermiso("cuidadores:gestionar"), async (c) => {
  const datos = crearUsuarioSchema.parse({ ...(await c.req.json()), rol: "cuidador" });
  const usuario = c.get("usuario");
  if (usuario?.rol !== "profesional") throw new ErrorAplicacion("SOLO_PROFESIONAL", "Solo profesionales crean cuidadores.", 403);
  if (await consultarUno("SELECT id_usuario FROM usuario WHERE correo = ?", [datos.correo])) {
    throw new ErrorAplicacion("CORREO_DUPLICADO", "El correo ya esta registrado.", 409);
  }
  const id = await transaccion(async (conexion) => {
    const [r] = await conexion.execute(
      "INSERT INTO usuario (correo, contrasena_hash, rol, estado, correo_verificado) VALUES (?, ?, 'cuidador', 'activo', 1)",
      [datos.correo, await hashContrasena(datos.contrasena)]
    );
    const idUsuario = Number((r as { insertId: number }).insertId);
    await conexion.execute("INSERT INTO perfil_usuario (id_usuario, nombres, apellidos, telefono, ciudad, genero) VALUES (?, ?, ?, ?, ?, ?)", [
      idUsuario,
      datos.perfil.nombres,
      datos.perfil.apellidos,
      datos.perfil.telefono ?? null,
      datos.perfil.ciudad ?? null,
      datos.perfil.genero ?? null
    ]);
    await conexion.execute("INSERT INTO profesional_cuidador (id_profesional, id_cuidador, creado_por) VALUES (?, ?, ?)", [
      usuario.id_usuario,
      idUsuario,
      usuario.id_usuario
    ]);
    return idUsuario;
  });
  await registrarCambio({ tabla: "usuario", id, accion: "crear", usuario: usuario.id_usuario, nuevos: { rol: "cuidador" } });
  return c.json({ datos: { id_usuario: id } }, 201);
});

rutasCuidadores.post("/:id/transferir", requierePermiso("cuidadores:gestionar"), async (c) => {
  const origen = Number(c.req.param("id"));
  const cuerpo = await c.req.json();
  const destino = Number(cuerpo.id_cuidador_destino);
  const usuario = c.get("usuario");
  await transaccion(async (conexion) => {
    await conexion.execute(
      "UPDATE asignacion_cuidador_adulto_mayor SET estado = 'finalizada', fecha_fin = CURRENT_DATE(), motivo_finalizacion = ? WHERE id_cuidador = ? AND estado = 'activa'",
      [cuerpo.motivo ?? "Transferencia", origen]
    );
    await conexion.execute(
      `INSERT INTO asignacion_cuidador_adulto_mayor (id_adulto_mayor, id_cuidador, asignado_por, fecha_inicio)
       SELECT id_adulto_mayor, ?, ?, CURRENT_DATE()
       FROM asignacion_cuidador_adulto_mayor
       WHERE id_cuidador = ? AND fecha_fin = CURRENT_DATE()`,
      [destino, usuario?.id_usuario ?? null, origen]
    );
  });
  await registrarCambio({ tabla: "asignacion_cuidador_adulto_mayor", id: origen, accion: "actualizar", usuario: usuario?.id_usuario, nuevos: { destino } });
  return c.json({ datos: { ok: true } });
});
