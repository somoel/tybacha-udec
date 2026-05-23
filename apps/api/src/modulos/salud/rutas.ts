import { Hono } from "hono";
import { obtenerPool } from "../../base_datos/conexion";

export const rutasSalud = new Hono();

rutasSalud.get("/", async (c) => {
  await obtenerPool().query("SELECT 1");
  return c.json({ datos: { estado: "ok", servicio: "tybacha-api", fecha: new Date().toISOString() } });
});
