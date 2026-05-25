import { aplicarCors, crearConexion, manejarError, obtenerUsuario, responderOptions, valorQuery, type SolicitudVercel, type RespuestaVercel } from "./_comun";

export default async function handler(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (responderOptions(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: { codigo: "METODO_NO_PERMITIDO", mensaje: "Metodo no permitido." } });
    return;
  }

  let conexion: Awaited<ReturnType<typeof crearConexion>> | null = null;
  try {
    const usuario = await obtenerUsuario(req);
    const limite = Math.min(Math.max(Number(valorQuery(req, "limite", "20")) || 20, 1), 100);
    const pagina = Math.max(Number(valorQuery(req, "pagina", "1")) || 1, 1);
    const offset = (pagina - 1) * limite;
    const busqueda = valorQuery(req, "busqueda");
    const estado = valorQuery(req, "estado");
    const valores: unknown[] = [];
    let where = "WHERE 1=1";

    if (usuario.rol === "cuidador") {
      where += ` AND EXISTS (
        SELECT 1 FROM asignacion_cuidador_adulto_mayor aa
        WHERE aa.id_adulto_mayor = am.id_adulto_mayor AND aa.id_cuidador = ? AND aa.estado = 'activa'
      )`;
      valores.push(usuario.id_usuario);
    } else if (usuario.rol === "profesional") {
      where += ` AND EXISTS (
        SELECT 1 FROM asignacion_cuidador_adulto_mayor aa
        JOIN profesional_cuidador pc ON pc.id_cuidador = aa.id_cuidador AND pc.estado = 'activo'
        WHERE aa.id_adulto_mayor = am.id_adulto_mayor AND pc.id_profesional = ? AND aa.estado = 'activa'
      )`;
      valores.push(usuario.id_usuario);
    }

    if (busqueda) {
      where += " AND (am.nombres LIKE ? OR am.apellidos LIKE ? OR am.numero_documento LIKE ?)";
      valores.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }
    if (estado) {
      where += " AND am.estado = ?";
      valores.push(estado);
    }

    conexion = await crearConexion();
    const [filas] = await conexion.execute(
      `SELECT am.*, EXISTS(SELECT 1 FROM foto_perfil_adulto_mayor f WHERE f.id_adulto_mayor = am.id_adulto_mayor) tiene_foto,
        COUNT(DISTINCT aa.id_cuidador) cuidadores_activos
       FROM adulto_mayor am
       LEFT JOIN asignacion_cuidador_adulto_mayor aa ON aa.id_adulto_mayor = am.id_adulto_mayor AND aa.estado = 'activa'
       ${where}
       GROUP BY am.id_adulto_mayor
       ORDER BY am.actualizado_en DESC
       LIMIT ? OFFSET ?`,
      [...valores, limite, offset] as any
    );
    res.status(200).json({ datos: filas });
  } catch (error) {
    manejarError(res, error);
  } finally {
    await conexion?.end().catch(() => undefined);
  }
}
