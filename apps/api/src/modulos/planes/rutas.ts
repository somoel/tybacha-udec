import { Hono } from "hono";
import { cambiarEstadoPlanSchema, crearPlanSchema, generarPlanIaSchema, respuestaGeminiPlanSchema } from "@tybacha/compartido";
import { consultar, consultarUno, ejecutar, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { configuracion } from "../../utilidades/configuracion";
import { ErrorAplicacion, exigir } from "../../utilidades/errores";
import { registrarCambio } from "../auditoria/servicio";
import { usuarioPuedeAccederAdulto } from "../adultos_mayores/alcance";

export const rutasPlanes = new Hono<{ Variables: VariablesContexto }>();
rutasPlanes.use("*", requiereAutenticacion);

async function insertarPlan(datos: ReturnType<typeof crearPlanSchema.parse>, usuarioId: number, origen: "manual" | "ia") {
  return transaccion(async (conexion) => {
    const [r] = await conexion.execute(
      `INSERT INTO plan_ejercicio (id_adulto_mayor, titulo, objetivo, origen, estado, nivel_dificultad, fecha_inicio, fecha_fin, creado_por)
       VALUES (?, ?, ?, ?, 'borrador', ?, ?, ?, ?)`,
      [datos.id_adulto_mayor, datos.titulo, datos.objetivo ?? null, origen, datos.nivel_dificultad, datos.fecha_inicio ?? null, datos.fecha_fin ?? null, usuarioId]
    );
    const idPlan = Number((r as { insertId: number }).insertId);
    for (const ejercicio of datos.ejercicios) {
      await conexion.execute(
        `INSERT INTO ejercicio_plan
          (id_plan_ejercicio, id_ejercicio, nombre_personalizado, descripcion_personalizada, dia_semana, orden, series,
           repeticiones, duracion_segundos, descanso_segundos, dificultad, instrucciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idPlan,
          ejercicio.id_ejercicio ?? null,
          ejercicio.nombre_personalizado,
          ejercicio.descripcion_personalizada ?? null,
          ejercicio.dia_semana,
          ejercicio.orden,
          ejercicio.series ?? null,
          ejercicio.repeticiones ?? null,
          ejercicio.duracion_segundos ?? null,
          ejercicio.descanso_segundos ?? null,
          ejercicio.dificultad,
          ejercicio.instrucciones
        ]
      );
    }
    await conexion.execute("INSERT INTO cambio_estado_plan (id_plan_ejercicio, estado_nuevo, cambiado_por) VALUES (?, 'borrador', ?)", [
      idPlan,
      usuarioId
    ]);
    return idPlan;
  });
}

rutasPlanes.get("/adultos/:id_adulto_mayor", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = Number(c.req.param("id_adulto_mayor"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes consultar planes.", 403);
  const planes = await consultar("SELECT * FROM plan_ejercicio WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]);
  return c.json({ datos: planes });
});

rutasPlanes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const plan = await consultarUno("SELECT * FROM plan_ejercicio WHERE id_plan_ejercicio = ?", [id]);
  const ejercicios = await consultar("SELECT * FROM ejercicio_plan WHERE id_plan_ejercicio = ? ORDER BY dia_semana, orden", [id]);
  return c.json({ datos: { plan, ejercicios } });
});

rutasPlanes.post("/", requierePermiso("planes:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const datos = crearPlanSchema.parse(await c.req.json());
  if (!(await usuarioPuedeAccederAdulto(usuario, datos.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes crear planes.", 403);
  const id = await insertarPlan(datos, usuario.id_usuario, "manual");
  await registrarCambio({ tabla: "plan_ejercicio", id, accion: "crear", usuario: usuario.id_usuario, nuevos: datos });
  return c.json({ datos: { id_plan_ejercicio: id } }, 201);
});

rutasPlanes.post("/:id/estado", requierePermiso("planes:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = Number(c.req.param("id"));
  const datos = cambiarEstadoPlanSchema.parse(await c.req.json());
  const plan = await consultarUno<{ estado: string }>("SELECT estado FROM plan_ejercicio WHERE id_plan_ejercicio = ?", [id]);
  if (!plan) throw new ErrorAplicacion("NO_ENCONTRADO", "Plan no encontrado.", 404);
  await transaccion(async (conexion) => {
    await conexion.execute(
      `UPDATE plan_ejercicio SET estado = ?, revisado_por = IF(? = 'revisado', ?, revisado_por),
       revisado_en = IF(? = 'revisado', UTC_TIMESTAMP(3), revisado_en),
       asignado_por = IF(? IN ('asignado','activo'), ?, asignado_por),
       asignado_en = IF(? IN ('asignado','activo'), UTC_TIMESTAMP(3), asignado_en)
       WHERE id_plan_ejercicio = ?`,
      [datos.estado, datos.estado, usuario.id_usuario, datos.estado, datos.estado, usuario.id_usuario, datos.estado, id]
    );
    await conexion.execute(
      "INSERT INTO cambio_estado_plan (id_plan_ejercicio, estado_anterior, estado_nuevo, motivo, cambiado_por) VALUES (?, ?, ?, ?, ?)",
      [id, plan.estado, datos.estado, datos.motivo ?? null, usuario.id_usuario]
    );
  });
  await registrarCambio({ tabla: "plan_ejercicio", id, accion: "actualizar", usuario: usuario.id_usuario, nuevos: datos });
  return c.json({ datos: { ok: true } });
});

rutasPlanes.post("/generar-ia", requierePermiso("planes:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const parametros = generarPlanIaSchema.parse(await c.req.json());
  if (!configuracion.GEMINI_API_KEY) throw new ErrorAplicacion("GEMINI_NO_CONFIGURADO", "GEMINI_API_KEY no esta configurada.", 503);
  if (!(await usuarioPuedeAccederAdulto(usuario, parametros.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes generar plan para este adulto mayor.", 403);
  const adulto = await consultarUno("SELECT * FROM adulto_mayor WHERE id_adulto_mayor = ?", [parametros.id_adulto_mayor]);
  const historial = {
    patologias: await consultar("SELECT nombre, descripcion, estado FROM patologia_adulto_mayor WHERE id_adulto_mayor = ?", [parametros.id_adulto_mayor]),
    medicamentos: await consultar("SELECT nombre, dosis, frecuencia, estado FROM medicamento_adulto_mayor WHERE id_adulto_mayor = ?", [parametros.id_adulto_mayor]),
    sft: await consultar("SELECT * FROM aplicacion_sft WHERE id_adulto_mayor = ? ORDER BY fecha_aplicacion DESC LIMIT 3", [parametros.id_adulto_mayor]),
    planes: await consultar("SELECT titulo, objetivo, estado FROM plan_ejercicio WHERE id_adulto_mayor = ? ORDER BY creado_en DESC LIMIT 3", [parametros.id_adulto_mayor])
  };
  const solicitud = {
    contents: [
      {
        parts: [
          {
            text: `Genera un plan de ejercicio seguro para Tybacha. Responde solo JSON con titulo, objetivo y exactamente 5 ejercicios. Adulto: ${JSON.stringify(adulto)}. Historial: ${JSON.stringify(historial)}. Parametros: ${JSON.stringify(parametros)}`
          }
        ]
      }
    ],
    generationConfig: { responseMimeType: "application/json" }
  };
  const respuesta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${configuracion.GEMINI_API_KEY}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(solicitud) }
  );
  if (!respuesta.ok) throw new ErrorAplicacion("GEMINI_ERROR", "Gemini no pudo generar el plan.", 502);
  const json = await respuesta.json();
  const texto = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const propuesta = respuestaGeminiPlanSchema.parse(JSON.parse(texto));
  const datosPlan = crearPlanSchema.parse({
    id_adulto_mayor: parametros.id_adulto_mayor,
    titulo: propuesta.titulo,
    objetivo: propuesta.objetivo,
    nivel_dificultad: parametros.nivel_dificultad,
    ejercicios: propuesta.ejercicios
  });
  const id = await insertarPlan(datosPlan, usuario.id_usuario, "ia");
  await ejecutar(
    "INSERT INTO generacion_ia_plan (id_plan_ejercicio, modelo, solicitud, respuesta, estado, creado_por) VALUES (?, 'gemini-1.5-flash', CAST(? AS JSON), CAST(? AS JSON), 'exitosa', ?)",
    [id, JSON.stringify(solicitud), JSON.stringify(json), usuario.id_usuario]
  );
  await registrarCambio({ tabla: "plan_ejercicio", id, accion: "crear", usuario: usuario.id_usuario, nuevos: { origen: "ia" } });
  return c.json({ datos: { id_plan_ejercicio: id, plan: propuesta } }, 201);
});
