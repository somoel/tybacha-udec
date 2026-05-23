import { Hono } from "hono";
import { z } from "zod";
import { consultar, ejecutar, transaccion } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion, exigir } from "../../utilidades/errores";
import { usuarioPuedeAccederAdulto } from "../adultos_mayores/alcance";
import { registrarCambio } from "../auditoria/servicio";

export const rutasSft = new Hono<{ Variables: VariablesContexto }>();
rutasSft.use("*", requiereAutenticacion);

rutasSft.get("/baterias", async (c) => c.json({ datos: await consultar("SELECT * FROM bateria_sft ORDER BY estado, nombre") }));

rutasSft.post("/baterias", requierePermiso("sft:gestionar"), async (c) => {
  const datos = z.object({ nombre: z.string().min(2), descripcion: z.string().optional(), version: z.string().default("1.0") }).parse(await c.req.json());
  const r = await ejecutar("INSERT INTO bateria_sft (nombre, descripcion, version, creada_por) VALUES (?, ?, ?, ?)", [
    datos.nombre,
    datos.descripcion ?? null,
    datos.version,
    c.get("usuario")?.id_usuario ?? null
  ]);
  return c.json({ datos: { id_bateria_sft: r.insertId } }, 201);
});

rutasSft.post("/pruebas", requierePermiso("sft:gestionar"), async (c) => {
  const datos = z.object({ id_bateria_sft: z.number().int().positive(), nombre: z.string().min(2), unidad_resultado: z.string().optional(), orden: z.number().int().positive() }).parse(await c.req.json());
  const r = await ejecutar("INSERT INTO prueba_sft (id_bateria_sft, nombre, unidad_resultado, orden) VALUES (?, ?, ?, ?)", [
    datos.id_bateria_sft,
    datos.nombre,
    datos.unidad_resultado ?? null,
    datos.orden
  ]);
  return c.json({ datos: { id_prueba_sft: r.insertId } }, 201);
});

rutasSft.get("/adultos/:id_adulto_mayor", async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = Number(c.req.param("id_adulto_mayor"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes consultar SFT.", 403);
  const datos = await consultar(
    `SELECT a.*, b.nombre bateria FROM aplicacion_sft a JOIN bateria_sft b ON b.id_bateria_sft = a.id_bateria_sft
     WHERE a.id_adulto_mayor = ? ORDER BY a.fecha_aplicacion DESC`,
    [id]
  );
  return c.json({ datos });
});

rutasSft.post("/aplicaciones", requierePermiso("sft:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const datos = z.object({
    id_adulto_mayor: z.number().int().positive(),
    id_bateria_sft: z.number().int().positive(),
    fecha_aplicacion: z.string(),
    observaciones: z.string().optional(),
    resultados: z.array(z.object({ id_prueba_sft: z.number().int().positive(), valor_numerico: z.number().optional(), valor_texto: z.string().optional(), clasificacion: z.string().optional(), observaciones: z.string().optional() })).default([])
  }).parse(await c.req.json());
  if (!(await usuarioPuedeAccederAdulto(usuario, datos.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes registrar SFT.", 403);
  const id = await transaccion(async (conexion) => {
    const [r] = await conexion.execute(
      "INSERT INTO aplicacion_sft (id_adulto_mayor, id_bateria_sft, responsable, fecha_aplicacion, observaciones) VALUES (?, ?, ?, ?, ?)",
      [datos.id_adulto_mayor, datos.id_bateria_sft, usuario.id_usuario, datos.fecha_aplicacion, datos.observaciones ?? null]
    );
    const idAplicacion = Number((r as { insertId: number }).insertId);
    for (const resultado of datos.resultados) {
      await conexion.execute(
        "INSERT INTO resultado_sft (id_aplicacion_sft, id_prueba_sft, valor_numerico, valor_texto, clasificacion, observaciones) VALUES (?, ?, ?, ?, ?, ?)",
        [idAplicacion, resultado.id_prueba_sft, resultado.valor_numerico ?? null, resultado.valor_texto ?? null, resultado.clasificacion ?? null, resultado.observaciones ?? null]
      );
    }
    return idAplicacion;
  });
  await registrarCambio({ tabla: "aplicacion_sft", id, accion: "crear", usuario: usuario.id_usuario, nuevos: datos });
  return c.json({ datos: { id_aplicacion_sft: id } }, 201);
});
