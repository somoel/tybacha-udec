import { Hono } from "hono";
import { z } from "zod";
import { consultar, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { configuracion } from "../../utilidades/configuracion";
import { ErrorAplicacion } from "../../utilidades/errores";

export const rutasNotificaciones = new Hono<{ Variables: VariablesContexto }>();
rutasNotificaciones.use("/tokens/*", requiereAutenticacion);
rutasNotificaciones.use("/", requiereAutenticacion);

async function enviarExpo(mensajes: unknown[]) {
  if (!configuracion.EXPO_ACCESS_TOKEN) throw new ErrorAplicacion("EXPO_NO_CONFIGURADO", "EXPO_ACCESS_TOKEN no esta configurado.", 503);
  const respuesta = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${configuracion.EXPO_ACCESS_TOKEN}`
    },
    body: JSON.stringify(mensajes)
  });
  if (!respuesta.ok) throw new ErrorAplicacion("EXPO_ERROR", "Expo no pudo enviar la notificacion.", 502);
  return respuesta.json();
}

rutasNotificaciones.get("/", async (c) => {
  const usuario = c.get("usuario");
  const filas = await consultar("SELECT * FROM notificacion WHERE id_usuario_destinatario = ? ORDER BY creado_en DESC LIMIT 100", [
    usuario?.id_usuario
  ]);
  return c.json({ datos: filas });
});

rutasNotificaciones.post("/tokens", async (c) => {
  const usuario = c.get("usuario");
  const datos = z.object({ expo_push_token: z.string().min(10), plataforma: z.enum(["android", "web", "ios", "desconocida"]).default("desconocida"), dispositivo: z.string().optional() }).parse(await c.req.json());
  await ejecutar(
    `INSERT INTO dispositivo_push_usuario (id_usuario, expo_push_token, plataforma, dispositivo, activo)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario), plataforma = VALUES(plataforma), dispositivo = VALUES(dispositivo), activo = 1`,
    [usuario?.id_usuario, datos.expo_push_token, datos.plataforma, datos.dispositivo ?? null]
  );
  return c.json({ datos: { ok: true } });
});

rutasNotificaciones.delete("/tokens/:token", async (c) => {
  await ejecutar("UPDATE dispositivo_push_usuario SET activo = 0 WHERE expo_push_token = ? AND id_usuario = ?", [
    c.req.param("token"),
    c.get("usuario")?.id_usuario
  ]);
  return c.json({ datos: { ok: true } });
});

rutasNotificaciones.post("/prueba", requierePermiso("notificaciones:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  const tokens = await consultar<{ expo_push_token: string }>("SELECT expo_push_token FROM dispositivo_push_usuario WHERE id_usuario = ? AND activo = 1", [
    usuario?.id_usuario
  ]);
  const respuesta = await enviarExpo(tokens.map((t) => ({ to: t.expo_push_token, title: "Tybacha", body: "Notificacion de prueba enviada correctamente." })));
  await ejecutar(
    "INSERT INTO notificacion (id_usuario_destinatario, tipo_notificacion, titulo, mensaje, canal, estado, enviada_en) VALUES (?, 'sistema', 'Tybacha', 'Notificacion de prueba enviada correctamente.', 'push', 'enviada', UTC_TIMESTAMP(3))",
    [usuario?.id_usuario]
  );
  return c.json({ datos: respuesta });
});

rutasNotificaciones.post("/:id/leida", async (c) => {
  await ejecutar("UPDATE notificacion SET estado = 'leida', leida_en = UTC_TIMESTAMP(3) WHERE id_notificacion = ? AND id_usuario_destinatario = ?", [
    Number(c.req.param("id")),
    c.get("usuario")?.id_usuario
  ]);
  return c.json({ datos: { ok: true } });
});

rutasNotificaciones.post("/cron/recordatorios", async (c) => {
  if (c.req.header("x-cron-secret") !== configuracion.CRON_SECRET) throw new ErrorAplicacion("CRON_INVALIDO", "Secreto de cron invalido.", 401);
  const alertas = await consultar(
    `SELECT a.*, d.expo_push_token FROM alerta_programada a
     JOIN dispositivo_push_usuario d ON d.id_usuario = a.id_usuario_destinatario AND d.activo = 1
     WHERE a.estado = 'activa' AND a.canal = 'push' AND (a.fecha_programada IS NULL OR a.fecha_programada <= UTC_TIMESTAMP(3))
     LIMIT 100`
  );
  const mensajes = alertas.map((a: any) => ({ to: a.expo_push_token, title: a.titulo, body: a.mensaje }));
  if (mensajes.length) await enviarExpo(mensajes);
  return c.json({ datos: { enviados: mensajes.length } });
});
