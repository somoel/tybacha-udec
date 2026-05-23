import { Hono } from "hono";
import { z } from "zod";
import { consultar, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion, exigir } from "../../utilidades/errores";
import { usuarioPuedeAccederAdulto } from "../adultos_mayores/alcance";
import { registrarCambio } from "../auditoria/servicio";

export const rutasSeguimiento = new Hono<{ Variables: VariablesContexto }>();
rutasSeguimiento.use("*", requiereAutenticacion);

rutasSeguimiento.get("/adultos/:id_adulto_mayor", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = Number(c.req.param("id_adulto_mayor"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes consultar seguimiento.", 403);
  const actividades = await consultar("SELECT * FROM registro_actividad_diaria WHERE id_adulto_mayor = ? ORDER BY fecha_actividad DESC", [id]);
  const ejercicios = await consultar("SELECT * FROM registro_ejercicio_plan WHERE id_adulto_mayor = ? ORDER BY fecha_programada DESC", [id]);
  const totales = await consultar(
    `SELECT estado, COUNT(*) total FROM registro_ejercicio_plan WHERE id_adulto_mayor = ? GROUP BY estado`,
    [id]
  );
  return c.json({ datos: { actividades, ejercicios, totales } });
});

rutasSeguimiento.post("/actividades", requierePermiso("seguimiento:gestionar_asignados"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const datos = z.object({
    id_adulto_mayor: z.number().int().positive(),
    id_plan_ejercicio: z.number().int().positive().nullable().optional(),
    id_local: z.string().optional(),
    fecha_actividad: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    resumen: z.string().optional(),
    nivel_energia: z.enum(["bajo", "medio", "alto", "no_registrado"]).default("no_registrado"),
    observaciones: z.string().optional()
  }).parse(await c.req.json());
  if (!(await usuarioPuedeAccederAdulto(usuario, datos.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes registrar seguimiento.", 403);
  const r = await ejecutar(
    `INSERT INTO registro_actividad_diaria
      (id_adulto_mayor, id_plan_ejercicio, id_local, fecha_actividad, resumen, nivel_energia, observaciones, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE resumen = VALUES(resumen), nivel_energia = VALUES(nivel_energia),
       observaciones = VALUES(observaciones), registrado_por = VALUES(registrado_por), version = version + 1`,
    [
      datos.id_adulto_mayor,
      datos.id_plan_ejercicio ?? null,
      datos.id_local ?? null,
      datos.fecha_actividad,
      datos.resumen ?? null,
      datos.nivel_energia,
      datos.observaciones ?? null,
      usuario.id_usuario
    ]
  );
  await registrarCambio({ tabla: "registro_actividad_diaria", id: Number(r.insertId || 0), accion: "crear", usuario: usuario.id_usuario, nuevos: datos });
  return c.json({ datos: { id_registro_actividad_diaria: r.insertId } }, 201);
});

rutasSeguimiento.post("/ejercicios", requierePermiso("seguimiento:gestionar_asignados"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const datos = z.object({
    id_ejercicio_plan: z.number().int().positive(),
    id_adulto_mayor: z.number().int().positive(),
    id_registro_actividad_diaria: z.number().int().positive().nullable().optional(),
    id_local: z.string().optional(),
    fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estado: z.enum(["pendiente", "completado", "omitido", "parcial"]),
    duracion_real_segundos: z.number().int().optional(),
    repeticiones_realizadas: z.number().int().optional(),
    esfuerzo_percibido: z.number().int().min(0).max(10).optional(),
    dolor_reportado: z.number().int().min(0).max(10).optional(),
    comentario: z.string().optional()
  }).parse(await c.req.json());
  if (!(await usuarioPuedeAccederAdulto(usuario, datos.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes registrar ejercicio.", 403);
  const r = await ejecutar(
    `INSERT INTO registro_ejercicio_plan
      (id_ejercicio_plan, id_adulto_mayor, id_registro_actividad_diaria, id_local, fecha_programada, fecha_realizacion,
       estado, duracion_real_segundos, repeticiones_realizadas, esfuerzo_percibido, dolor_reportado, comentario, registrado_por)
     VALUES (?, ?, ?, ?, ?, IF(? IN ('completado','parcial'), UTC_TIMESTAMP(3), NULL), ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE estado = VALUES(estado), fecha_realizacion = VALUES(fecha_realizacion),
       duracion_real_segundos = VALUES(duracion_real_segundos), repeticiones_realizadas = VALUES(repeticiones_realizadas),
       esfuerzo_percibido = VALUES(esfuerzo_percibido), dolor_reportado = VALUES(dolor_reportado), comentario = VALUES(comentario),
       registrado_por = VALUES(registrado_por), version = version + 1`,
    [
      datos.id_ejercicio_plan,
      datos.id_adulto_mayor,
      datos.id_registro_actividad_diaria ?? null,
      datos.id_local ?? null,
      datos.fecha_programada,
      datos.estado,
      datos.estado,
      datos.duracion_real_segundos ?? null,
      datos.repeticiones_realizadas ?? null,
      datos.esfuerzo_percibido ?? null,
      datos.dolor_reportado ?? null,
      datos.comentario ?? null,
      usuario.id_usuario
    ]
  );
  await registrarCambio({ tabla: "registro_ejercicio_plan", id: Number(r.insertId || 0), accion: "crear", usuario: usuario.id_usuario, nuevos: datos });
  return c.json({ datos: { id_registro_ejercicio_plan: r.insertId } }, 201);
});
