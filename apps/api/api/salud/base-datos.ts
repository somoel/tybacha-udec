import mysql from "mysql2/promise";

type SolicitudVercel = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type RespuestaVercel = {
  setHeader: (nombre: string, valor: string) => void;
  status: (codigo: number) => RespuestaVercel;
  json: (cuerpo: unknown) => void;
  end: () => void;
};

function aplicarCors(req: SolicitudVercel, res: RespuestaVercel) {
  const origen = req.headers.origin;
  const origenTexto = Array.isArray(origen) ? origen[0] : origen;
  const permitidos = String(process.env.CORS_ORIGEN ?? "")
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);
  const permitido = origenTexto && permitidos.includes(origenTexto) ? origenTexto : permitidos[0] || "*";
  res.setHeader("Access-Control-Allow-Origin", permitido);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-cron-secret");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Vary", "Origin");
}

export default async function handler(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  try {
    const conexion = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT || 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE,
      ssl: String(process.env.TIDB_ENABLE_SSL) === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: false } : undefined,
      connectTimeout: 8000
    });
    await conexion.query("SELECT 1");
    await conexion.end();
    res.status(200).json({ datos: { estado: "ok", base_datos: "conectada", fecha: new Date().toISOString() } });
  } catch (error) {
    res.status(503).json({
      error: {
        codigo: "BASE_DATOS_NO_DISPONIBLE",
        mensaje: "La API esta viva, pero TiDB no respondio correctamente.",
        detalle: error instanceof Error ? error.message : "Error desconocido"
      }
    });
  }
}
