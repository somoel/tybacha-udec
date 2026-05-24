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

export default function handler(req: SolicitudVercel, res: RespuestaVercel) {
  aplicarCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  res.status(200).json({
    datos: {
      estado: "ok",
      servicio: "tybacha-api",
      ruta: "api/salud.ts",
      base_datos: "no_verificada",
      fecha: new Date().toISOString()
    }
  });
}
