import { Hono } from "hono";
import { z } from "zod";
import { consultar, consultarUno, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { registrarCambio } from "../auditoria/servicio";

export const rutasConsentimientos = new Hono<{ Variables: VariablesContexto }>();
rutasConsentimientos.use("*", requiereAutenticacion);

rutasConsentimientos.get("/adultos/:id_adulto_mayor", async (c) => {
  const id = Number(c.req.param("id_adulto_mayor"));
  return c.json({ datos: await consultar("SELECT * FROM consentimiento_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]) });
});

rutasConsentimientos.get("/adultos/:id_adulto_mayor/vigente", async (c) => {
  const id = Number(c.req.param("id_adulto_mayor"));
  return c.json({ datos: await consultarUno("SELECT * FROM consentimiento_adulto_mayor WHERE id_adulto_mayor = ? AND estado = 'vigente' ORDER BY creado_en DESC LIMIT 1", [id]) });
});

rutasConsentimientos.post("/", requierePermiso("consentimientos:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  const datos = z.object({
    id_adulto_mayor: z.number().int().positive(),
    tipo_consentimiento: z.enum(["tratamiento_datos", "evaluacion_funcional", "plan_ejercicio", "investigacion", "otro"]),
    estado: z.enum(["vigente", "revocado", "vencido", "pendiente"]).default("vigente"),
    otorgado_por_nombre: z.string().optional(),
    otorgado_por_documento: z.string().optional(),
    fecha_otorgamiento: z.string().optional(),
    fecha_vencimiento: z.string().optional(),
    observaciones: z.string().optional()
  }).parse(await c.req.json());
  const r = await ejecutar(
    `INSERT INTO consentimiento_adulto_mayor
      (id_adulto_mayor, tipo_consentimiento, estado, otorgado_por_nombre, otorgado_por_documento,
       fecha_otorgamiento, fecha_vencimiento, observaciones, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.id_adulto_mayor,
      datos.tipo_consentimiento,
      datos.estado,
      datos.otorgado_por_nombre ?? null,
      datos.otorgado_por_documento ?? null,
      datos.fecha_otorgamiento ?? null,
      datos.fecha_vencimiento ?? null,
      datos.observaciones ?? null,
      usuario?.id_usuario ?? null
    ]
  );
  await registrarCambio({ tabla: "consentimiento_adulto_mayor", id: Number(r.insertId), accion: "crear", usuario: usuario?.id_usuario, nuevos: datos });
  return c.json({ datos: { id_consentimiento_adulto_mayor: r.insertId } }, 201);
});

rutasConsentimientos.post("/:id/revocar", requierePermiso("consentimientos:gestionar"), async (c) => {
  const id = Number(c.req.param("id"));
  await ejecutar("UPDATE consentimiento_adulto_mayor SET estado = 'revocado' WHERE id_consentimiento_adulto_mayor = ?", [id]);
  await registrarCambio({ tabla: "consentimiento_adulto_mayor", id, accion: "actualizar", usuario: c.get("usuario")?.id_usuario, nuevos: { estado: "revocado" } });
  return c.json({ datos: { ok: true } });
});
