import { Hono } from "hono";
import { obtenerPool } from "../../base_datos/conexion";

export const rutasSalud = new Hono();

rutasSalud.get("/", (c) =>
  c.json({
    datos: {
      estado: "ok",
      servicio: "tybacha-api",
      base_datos: "no_verificada",
      fecha: new Date().toISOString()
    }
  })
);

rutasSalud.get("/base-datos", async (c) => {
  try {
    await obtenerPool().query("SELECT 1");
    return c.json({ datos: { estado: "ok", base_datos: "conectada", fecha: new Date().toISOString() } });
  } catch (error) {
    console.error("Fallo salud/base-datos", error);
    return c.json(
      {
        error: {
          codigo: "BASE_DATOS_NO_DISPONIBLE",
          mensaje: "La API esta viva, pero no pudo conectar con TiDB.",
          detalle: error instanceof Error ? error.message : "Error desconocido"
        }
      },
      503
    );
  }
});
