import { Hono } from "hono";
import { consultar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";

export const rutasAuditoria = new Hono<{ Variables: VariablesContexto }>();
rutasAuditoria.use("*", requiereAutenticacion, requierePermiso("auditoria:ver"));

rutasAuditoria.get("/cambios", async (c) => c.json({ datos: await consultar("SELECT * FROM auditoria_cambio ORDER BY creado_en DESC LIMIT 200") }));
rutasAuditoria.get("/accesos", async (c) => c.json({ datos: await consultar("SELECT * FROM auditoria_acceso_dato ORDER BY creado_en DESC LIMIT 200") }));
rutasAuditoria.get("/autenticacion", async (c) => c.json({ datos: await consultar("SELECT * FROM auditoria_autenticacion ORDER BY creado_en DESC LIMIT 200") }));
