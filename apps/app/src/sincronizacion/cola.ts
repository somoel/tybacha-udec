import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OperacionSincronizacion, ResultadoSincronizacion } from "@tybacha/compartido";
import { api } from "../servicios/api";

const clave = "tybacha_cola_offline";

export async function leerCola(): Promise<OperacionSincronizacion[]> {
  const texto = await AsyncStorage.getItem(clave);
  return texto ? JSON.parse(texto) : [];
}

export async function guardarCola(cola: OperacionSincronizacion[]) {
  await AsyncStorage.setItem(clave, JSON.stringify(cola));
}

export async function encolarOperacion(operacion: Omit<OperacionSincronizacion, "creado_en_local" | "actualizado_en_local" | "intentos" | "estado">) {
  const ahora = new Date().toISOString();
  const cola = await leerCola();
  cola.push({ ...operacion, creado_en_local: ahora, actualizado_en_local: ahora, intentos: 0, estado: "pendiente" });
  await guardarCola(cola);
}

export async function sincronizarPendientes() {
  const cola = await leerCola();
  const pendientes = cola.filter((op) => op.estado === "pendiente" || op.estado === "error");
  if (!pendientes.length) return [];
  const respuesta = await api<{ resultados: ResultadoSincronizacion[] }>("/sincronizacion", {
    method: "POST",
    body: JSON.stringify({ operaciones: pendientes.map((op) => ({ ...op, intentos: op.intentos + 1 })) })
  });
  const nueva = cola.map((op) => {
    const resultado = respuesta.resultados.find((item) => item.id_local === op.id_local);
    if (!resultado) return op;
    return { ...op, estado: resultado.estado, error: resultado.mensaje ?? null, intentos: op.intentos + 1 };
  });
  await guardarCola(nueva.filter((op) => op.estado !== "aplicada"));
  return respuesta.resultados;
}
