import type { Context, Next } from "hono";
import type { VariablesContexto } from "../tipos/contexto";

export async function agregarContexto(c: Context<{ Variables: VariablesContexto }>, next: Next) {
  c.set("direccionIp", c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0");
  c.set("agenteUsuario", c.req.header("user-agent") ?? "desconocido");
  await next();
}
