import { Hono } from "hono";
import type { VariablesContexto } from "../../tipos/contexto";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";

export const rutasIa = new Hono<{ Variables: VariablesContexto }>();
rutasIa.use("*", requiereAutenticacion, requierePermiso("planes:gestionar"));
rutasIa.get("/estado", (c) => c.json({ datos: { proveedor: "gemini", configurado: Boolean(process.env.GEMINI_API_KEY) } }));
