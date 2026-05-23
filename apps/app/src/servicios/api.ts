import { useSesion } from "../estado/sesion";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ErrorApi extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
    public estado: number,
    public detalles?: unknown
  ) {
    super(mensaje);
  }
}

async function parsearRespuesta<T>(respuesta: Response): Promise<T> {
  const tipo = respuesta.headers.get("content-type") ?? "";
  const cuerpo = tipo.includes("application/json") ? await respuesta.json() : await respuesta.text();
  if (!respuesta.ok) {
    const error = typeof cuerpo === "object" && cuerpo && "error" in cuerpo ? (cuerpo as any).error : null;
    throw new ErrorApi(error?.codigo ?? "ERROR_API", error?.mensaje ?? "Error de API", respuesta.status, error?.detalles);
  }
  return (typeof cuerpo === "object" && cuerpo && "datos" in cuerpo ? (cuerpo as any).datos : cuerpo) as T;
}

export async function api<T>(ruta: string, opciones: RequestInit = {}, reintentar = true): Promise<T> {
  const { accessToken, cargarRefreshToken, fijarAccessToken } = useSesion.getState();
  const headers = new Headers(opciones.headers);
  if (!headers.has("content-type") && opciones.body) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers, credentials: "include" });
  if (respuesta.status === 401 && reintentar) {
    const refresh = await cargarRefreshToken();
    const refrescado = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (refrescado.ok) {
      const datos = await parsearRespuesta<{ access_token: string }>(refrescado);
      fijarAccessToken(datos.access_token);
      return api<T>(ruta, opciones, false);
    }
  }
  return parsearRespuesta<T>(respuesta);
}

export const rutasApi = {
  login: "/auth/login",
  me: "/auth/me",
  adultos: "/adultos-mayores",
  profesionales: "/profesionales",
  cuidadores: "/cuidadores",
  sft: "/sft",
  planes: "/planes",
  seguimiento: "/seguimiento",
  notificaciones: "/notificaciones",
  reportes: "/reportes",
  auditoria: "/auditoria",
  consentimientos: "/consentimientos",
  sincronizacion: "/sincronizacion"
};
