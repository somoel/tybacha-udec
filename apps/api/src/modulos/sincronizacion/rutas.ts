import { Hono } from "hono";
import { loteSincronizacionSchema } from "../../compartido";
import { requiereAutenticacion } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ejecutar } from "../../base_datos/conexion";
import { registrarCambio } from "../auditoria/servicio";

export const rutasSincronizacion = new Hono<{ Variables: VariablesContexto }>();
rutasSincronizacion.use("*", requiereAutenticacion);

rutasSincronizacion.post("/", async (c) => {
  const usuario = c.get("usuario");
  const lote = loteSincronizacionSchema.parse(await c.req.json());
  const resultados = [];
  for (const operacion of lote.operaciones) {
    try {
      if (operacion.entidad === "adulto_mayor" && operacion.accion === "crear") {
        const p = operacion.payload as any;
        const r = await ejecutar(
          `INSERT INTO adulto_mayor
           (id_local, nombres, apellidos, fecha_nacimiento, genero, telefono, direccion, ciudad, creado_por, actualizado_por)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nombres = VALUES(nombres), apellidos = VALUES(apellidos), telefono = VALUES(telefono),
            direccion = VALUES(direccion), ciudad = VALUES(ciudad), version = version + 1`,
          [
            operacion.id_local,
            p.nombres,
            p.apellidos,
            p.fecha_nacimiento,
            p.genero ?? "no_informa",
            p.telefono ?? null,
            p.direccion ?? null,
            p.ciudad ?? null,
            usuario?.id_usuario ?? null,
            usuario?.id_usuario ?? null
          ]
        );
        resultados.push({ id_local: operacion.id_local, estado: "aplicada", id_remoto: r.insertId || p.id_adulto_mayor });
      } else if (operacion.entidad === "registro_actividad_diaria") {
        const p = operacion.payload as any;
        const r = await ejecutar(
          `INSERT INTO registro_actividad_diaria
           (id_local, id_adulto_mayor, id_plan_ejercicio, fecha_actividad, resumen, nivel_energia, observaciones, registrado_por)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE resumen = VALUES(resumen), nivel_energia = VALUES(nivel_energia),
            observaciones = VALUES(observaciones), version = version + 1`,
          [
            operacion.id_local,
            p.id_adulto_mayor,
            p.id_plan_ejercicio ?? null,
            p.fecha_actividad,
            p.resumen ?? null,
            p.nivel_energia ?? "no_registrado",
            p.observaciones ?? null,
            usuario?.id_usuario ?? null
          ]
        );
        resultados.push({ id_local: operacion.id_local, estado: "aplicada", id_remoto: r.insertId || p.id_registro_actividad_diaria });
      } else {
        resultados.push({ id_local: operacion.id_local, estado: "error", mensaje: "Entidad no soportada por sincronizacion inicial." });
      }
      await registrarCambio({ tabla: operacion.entidad, id: 0, accion: "actualizar", usuario: usuario?.id_usuario, nuevos: operacion });
    } catch (error) {
      resultados.push({ id_local: operacion.id_local, estado: "error", mensaje: error instanceof Error ? error.message : "Error de sincronizacion" });
    }
  }
  return c.json({ datos: { resultados } });
});
