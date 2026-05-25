import { aplicarCors, crearConexion, manejarError, obtenerUsuario, responderOptions, type SolicitudVercel, type RespuestaVercel } from "./_comun";

export default async function handler(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (responderOptions(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: { codigo: "METODO_NO_PERMITIDO", mensaje: "Metodo no permitido." } });
    return;
  }
  let conexion: Awaited<ReturnType<typeof crearConexion>> | null = null;
  try {
    await obtenerUsuario(req);
    conexion = await crearConexion();
    const [filas] = await conexion.execute("SELECT * FROM reporte_generado ORDER BY creado_en DESC LIMIT 100");
    res.status(200).json({ datos: filas });
  } catch (error) {
    manejarError(res, error);
  } finally {
    await conexion?.end().catch(() => undefined);
  }
}
