import { Hono } from "hono";
import { z } from "zod";
import { consultar, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { sha256 } from "../../utilidades/seguridad";
import { registrarAccesoDato } from "../auditoria/servicio";

export const rutasReportes = new Hono<{ Variables: VariablesContexto }>();
rutasReportes.use("*", requiereAutenticacion, requierePermiso("reportes:ver"));

rutasReportes.get("/", async (c) => c.json({ datos: await consultar("SELECT * FROM reporte_generado ORDER BY creado_en DESC LIMIT 100") }));

rutasReportes.post("/generar", async (c) => {
  const usuario = c.get("usuario");
  const filtros = z.object({ tipo_reporte: z.enum(["progreso", "actividad", "sft", "cumplimiento", "administrativo"]), formato: z.enum(["json", "csv"]).default("json"), id_adulto_mayor: z.number().int().positive().optional() }).parse(await c.req.json());
  const resumen = {
    adultos: await consultar("SELECT estado, COUNT(*) total FROM adulto_mayor GROUP BY estado"),
    actividades: await consultar("SELECT estado, COUNT(*) total FROM registro_ejercicio_plan GROUP BY estado"),
    sft: await consultar("SELECT COUNT(*) total FROM aplicacion_sft"),
    planes: await consultar("SELECT estado, COUNT(*) total FROM plan_ejercicio GROUP BY estado")
  };
  const r = await ejecutar(
    "INSERT INTO reporte_generado (tipo_reporte, titulo, filtros, resumen, formato, generado_por) VALUES (?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?)",
    [filtros.tipo_reporte, `Reporte ${filtros.tipo_reporte}`, JSON.stringify(filtros), JSON.stringify(resumen), filtros.formato, usuario?.id_usuario ?? null]
  );
  const texto = filtros.formato === "csv" ? "tipo,total\nadultos," + JSON.stringify(resumen.adultos.length) : JSON.stringify(resumen);
  await ejecutar(
    "INSERT INTO archivo_exportado (id_reporte_generado, nombre_archivo, tipo_mime, contenido_texto, tamano_bytes, huella_sha256) VALUES (?, ?, ?, ?, ?, ?)",
    [r.insertId, `tybacha-${filtros.tipo_reporte}.${filtros.formato}`, filtros.formato === "csv" ? "text/csv" : "application/json", texto, Buffer.byteLength(texto), sha256(texto)]
  );
  await registrarAccesoDato({ id_usuario: usuario?.id_usuario, id_adulto_mayor: filtros.id_adulto_mayor ?? null, tipo_dato: "reporte", accion: "exportar", resultado: "permitido" });
  return c.json({ datos: { id_reporte_generado: r.insertId, resumen } }, 201);
});
