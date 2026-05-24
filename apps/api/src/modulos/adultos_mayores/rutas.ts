import { Hono } from "hono";
import { adultoMayorSchema, actualizarAdultoMayorSchema, fotoAdultoMayorSchema, idNumerico, paginacionConsulta } from "../../compartido";
import { consultar, consultarUno, ejecutar, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion, exigir } from "../../utilidades/errores";
import { sha256 } from "../../utilidades/seguridad";
import { registrarAccesoDato, registrarCambio } from "../auditoria/servicio";
import { filtroAlcanceAdultos, usuarioPuedeAccederAdulto } from "./alcance";

export const rutasAdultosMayores = new Hono<{ Variables: VariablesContexto }>();
rutasAdultosMayores.use("*", requiereAutenticacion);

rutasAdultosMayores.get("/", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const q = paginacionConsulta.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const alcance = filtroAlcanceAdultos(usuario);
  const valores: unknown[] = [];
  let where = `WHERE 1=1 ${alcance.sql}`;
  valores.push(...alcance.valores);
  if (q.busqueda) {
    where += " AND (am.nombres LIKE ? OR am.apellidos LIKE ? OR am.numero_documento LIKE ?)";
    valores.push(`%${q.busqueda}%`, `%${q.busqueda}%`, `%${q.busqueda}%`);
  }
  if (q.estado) {
    where += " AND am.estado = ?";
    valores.push(q.estado);
  }
  const filas = await consultar(
    `SELECT am.*, EXISTS(SELECT 1 FROM foto_perfil_adulto_mayor f WHERE f.id_adulto_mayor = am.id_adulto_mayor) tiene_foto,
       COUNT(DISTINCT aa.id_cuidador) cuidadores_activos
     FROM adulto_mayor am
     LEFT JOIN asignacion_cuidador_adulto_mayor aa ON aa.id_adulto_mayor = am.id_adulto_mayor AND aa.estado = 'activa'
     ${where}
     GROUP BY am.id_adulto_mayor
     ORDER BY am.actualizado_en DESC LIMIT ? OFFSET ?`,
    [...valores, q.limite, (q.pagina - 1) * q.limite]
  );
  return c.json({ datos: filas });
});

rutasAdultosMayores.post("/", requierePermiso("adultos_mayores:gestionar_asignados", "adultos_mayores:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const datos = adultoMayorSchema.parse(await c.req.json());
  if (usuario.rol !== "cuidador" && usuario.rol !== "administrador") {
    throw new ErrorAplicacion("CREADOR_INVALIDO", "Solo cuidadores o administradores crean adultos mayores.", 403);
  }
  const id = await transaccion(async (conexion) => {
    const [r] = await conexion.execute(
      `INSERT INTO adulto_mayor
       (id_local, nombres, apellidos, fecha_nacimiento, genero, tipo_documento, numero_documento, telefono,
        correo_contacto, direccion, ciudad, nombre_contacto_emergencia, telefono_contacto_emergencia, creado_por, actualizado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id_local ?? null,
        datos.nombres,
        datos.apellidos,
        datos.fecha_nacimiento,
        datos.genero,
        datos.tipo_documento ?? null,
        datos.numero_documento ?? null,
        datos.telefono ?? null,
        datos.correo_contacto ?? null,
        datos.direccion ?? null,
        datos.ciudad ?? null,
        datos.nombre_contacto_emergencia ?? null,
        datos.telefono_contacto_emergencia ?? null,
        usuario.id_usuario,
        usuario.id_usuario
      ]
    );
    const idAdulto = Number((r as { insertId: number }).insertId);
    if (usuario.rol === "cuidador") {
      await conexion.execute(
        `INSERT INTO asignacion_cuidador_adulto_mayor
         (id_adulto_mayor, id_cuidador, asignado_por, fecha_inicio)
         VALUES (?, ?, ?, CURRENT_DATE())`,
        [idAdulto, usuario.id_usuario, usuario.id_usuario]
      );
    }
    return idAdulto;
  });
  await registrarCambio({ tabla: "adulto_mayor", id, accion: "crear", usuario: usuario.id_usuario, nuevos: datos, ip: c.get("direccionIp"), agente: c.get("agenteUsuario") });
  return c.json({ datos: { id_adulto_mayor: id } }, 201);
});

rutasAdultosMayores.get("/:id", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = idNumerico.parse(c.req.param("id"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) {
    await registrarAccesoDato({ id_usuario: usuario.id_usuario, id_adulto_mayor: id, tipo_dato: "personal", accion: "consultar", resultado: "denegado" });
    throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes acceder a este adulto mayor.", 403);
  }
  const adulto = await consultarUno("SELECT * FROM adulto_mayor WHERE id_adulto_mayor = ?", [id]);
  if (!adulto) throw new ErrorAplicacion("NO_ENCONTRADO", "Adulto mayor no encontrado.", 404);
  const [contactos, patologias, medicamentos, notas, consentimientos, cuidadores] = await Promise.all([
    consultar("SELECT * FROM contacto_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY es_emergencia DESC, nombre", [id]),
    consultar("SELECT * FROM patologia_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    consultar("SELECT * FROM medicamento_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    consultar("SELECT * FROM nota_historial_medico WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    consultar("SELECT * FROM consentimiento_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    consultar(
      `SELECT aa.*, p.nombres, p.apellidos, u.correo
       FROM asignacion_cuidador_adulto_mayor aa
       JOIN usuario u ON u.id_usuario = aa.id_cuidador
       JOIN perfil_usuario p ON p.id_usuario = u.id_usuario
       WHERE aa.id_adulto_mayor = ? ORDER BY aa.estado, aa.creado_en DESC`,
      [id]
    )
  ]);
  await registrarAccesoDato({ id_usuario: usuario.id_usuario, id_adulto_mayor: id, tipo_dato: "personal", accion: "consultar", resultado: "permitido" });
  return c.json({ datos: { adulto, contactos, patologias, medicamentos, notas, consentimientos, cuidadores } });
});

rutasAdultosMayores.put("/:id", requierePermiso("adultos_mayores:gestionar_asignados", "adultos_mayores:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = idNumerico.parse(c.req.param("id"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes modificar este adulto mayor.", 403);
  const datos = actualizarAdultoMayorSchema.parse(await c.req.json());
  const anterior = await consultarUno("SELECT * FROM adulto_mayor WHERE id_adulto_mayor = ?", [id]);
  await ejecutar(
    `UPDATE adulto_mayor SET
      nombres = COALESCE(?, nombres), apellidos = COALESCE(?, apellidos), fecha_nacimiento = COALESCE(?, fecha_nacimiento),
      genero = COALESCE(?, genero), telefono = COALESCE(?, telefono), correo_contacto = COALESCE(?, correo_contacto),
      direccion = COALESCE(?, direccion), ciudad = COALESCE(?, ciudad), nombre_contacto_emergencia = COALESCE(?, nombre_contacto_emergencia),
      telefono_contacto_emergencia = COALESCE(?, telefono_contacto_emergencia), actualizado_por = ?, version = version + 1
     WHERE id_adulto_mayor = ?`,
    [
      datos.nombres ?? null,
      datos.apellidos ?? null,
      datos.fecha_nacimiento ?? null,
      datos.genero ?? null,
      datos.telefono ?? null,
      datos.correo_contacto ?? null,
      datos.direccion ?? null,
      datos.ciudad ?? null,
      datos.nombre_contacto_emergencia ?? null,
      datos.telefono_contacto_emergencia ?? null,
      usuario.id_usuario,
      id
    ]
  );
  await registrarCambio({ tabla: "adulto_mayor", id, accion: "actualizar", usuario: usuario.id_usuario, anteriores: anterior, nuevos: datos });
  return c.json({ datos: { ok: true } });
});

rutasAdultosMayores.post("/:id/desactivar", requierePermiso("adultos_mayores:gestionar"), async (c) => {
  const id = idNumerico.parse(c.req.param("id"));
  const cuerpo = await c.req.json().catch(() => ({}));
  await ejecutar(
    "UPDATE adulto_mayor SET estado = 'inactivo', motivo_inactivacion = ?, inactivado_en = UTC_TIMESTAMP(3), version = version + 1 WHERE id_adulto_mayor = ?",
    [cuerpo.motivo ?? "Desactivacion administrativa", id]
  );
  await registrarCambio({ tabla: "adulto_mayor", id, accion: "inactivar", usuario: c.get("usuario")?.id_usuario });
  return c.json({ datos: { ok: true } });
});

rutasAdultosMayores.post("/:id/reactivar", requierePermiso("adultos_mayores:gestionar"), async (c) => {
  const id = idNumerico.parse(c.req.param("id"));
  await ejecutar("UPDATE adulto_mayor SET estado = 'activo', motivo_inactivacion = NULL, inactivado_en = NULL, version = version + 1 WHERE id_adulto_mayor = ?", [id]);
  await registrarCambio({ tabla: "adulto_mayor", id, accion: "reactivar", usuario: c.get("usuario")?.id_usuario });
  return c.json({ datos: { ok: true } });
});

rutasAdultosMayores.put("/:id/foto", requierePermiso("adultos_mayores:gestionar_asignados", "adultos_mayores:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = idNumerico.parse(c.req.param("id"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes modificar esta foto.", 403);
  const datos = fotoAdultoMayorSchema.parse(await c.req.json());
  const buffer = Buffer.from(datos.base64.replace(/^data:image\/[a-z]+;base64,/, ""), "base64");
  if (buffer.byteLength > 1024 * 1024) throw new ErrorAplicacion("FOTO_GRANDE", "La foto comprimida supera 1 MB.", 413);
  const huella = sha256(buffer);
  await ejecutar(
    `INSERT INTO foto_perfil_adulto_mayor
      (id_adulto_mayor, foto_binaria, tipo_mime, tamano_bytes, ancho_pixeles, alto_pixeles, huella_sha256, creada_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE foto_binaria = VALUES(foto_binaria), tipo_mime = VALUES(tipo_mime),
      tamano_bytes = VALUES(tamano_bytes), ancho_pixeles = VALUES(ancho_pixeles), alto_pixeles = VALUES(alto_pixeles),
      huella_sha256 = VALUES(huella_sha256), creada_por = VALUES(creada_por)`,
    [id, buffer, datos.tipo_mime, buffer.byteLength, datos.ancho_pixeles ?? null, datos.alto_pixeles ?? null, huella, usuario.id_usuario]
  );
  await registrarCambio({ tabla: "foto_perfil_adulto_mayor", id, accion: "actualizar", usuario: usuario.id_usuario, nuevos: { tipo_mime: datos.tipo_mime, tamano_bytes: buffer.byteLength } });
  return c.json({ datos: { huella_sha256: huella, tamano_bytes: buffer.byteLength } });
});

rutasAdultosMayores.get("/:id/foto", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = idNumerico.parse(c.req.param("id"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes ver esta foto.", 403);
  const foto = await consultarUno<{ foto_binaria: Buffer; tipo_mime: string; tamano_bytes: number }>(
    "SELECT foto_binaria, tipo_mime, tamano_bytes FROM foto_perfil_adulto_mayor WHERE id_adulto_mayor = ?",
    [id]
  );
  if (!foto) throw new ErrorAplicacion("FOTO_NO_ENCONTRADA", "El adulto mayor no tiene foto.", 404);
  await registrarAccesoDato({ id_usuario: usuario.id_usuario, id_adulto_mayor: id, tipo_dato: "personal", accion: "descargar", resultado: "permitido" });
  return new Response(new Uint8Array(foto.foto_binaria), { headers: { "content-type": foto.tipo_mime, "content-length": String(foto.tamano_bytes), "cache-control": "private, max-age=300" } });
});

rutasAdultosMayores.delete("/:id/foto", requierePermiso("adultos_mayores:gestionar"), async (c) => {
  const id = idNumerico.parse(c.req.param("id"));
  await ejecutar("DELETE FROM foto_perfil_adulto_mayor WHERE id_adulto_mayor = ?", [id]);
  await registrarCambio({ tabla: "foto_perfil_adulto_mayor", id, accion: "eliminar", usuario: c.get("usuario")?.id_usuario });
  return c.json({ datos: { ok: true } });
});
