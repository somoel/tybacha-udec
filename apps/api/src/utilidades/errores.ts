import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

function aplicarCorsEnError(c: Context) {
  const origen = c.req.header("origin");
  const permitidos = String(process.env.CORS_ORIGEN ?? "")
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);
  const permitido = origen && permitidos.includes(origen) ? origen : permitidos[0];
  if (permitido) c.header("Access-Control-Allow-Origin", permitido);
  c.header("Vary", "Origin");
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-cron-secret");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

export class ErrorAplicacion extends Error {
  constructor(
    public codigo: string,
    public mensaje: string,
    public estado = 400,
    public detalles?: unknown
  ) {
    super(mensaje);
  }
}

export async function manejarErrores(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    aplicarCorsEnError(c);
    if (error instanceof ErrorAplicacion) {
      return c.json({ error: { codigo: error.codigo, mensaje: error.mensaje, detalles: error.detalles } }, error.estado as any);
    }
    if (error instanceof ZodError) {
      return c.json(
        { error: { codigo: "VALIDACION", mensaje: "La solicitud contiene datos invalidos.", detalles: error.flatten() } },
        422 as any
      );
    }
    if (error instanceof HTTPException) {
      return c.json({ error: { codigo: "HTTP", mensaje: error.message } }, error.status as any);
    }
    console.error(error);
    return c.json({ error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrio un error inesperado." } }, 500 as any);
  }
}

export function exigir(condicion: unknown, codigo: string, mensaje: string, estado = 400): asserts condicion {
  if (!condicion) throw new ErrorAplicacion(codigo, mensaje, estado);
}
