import { ejecutar } from "../../base_datos/conexion";

export async function registrarCambio(parametros: {
  tabla: string;
  id: number;
  accion: "crear" | "actualizar" | "inactivar" | "reactivar" | "eliminar";
  usuario?: number | null;
  anteriores?: unknown;
  nuevos?: unknown;
  ip?: string;
  agente?: string;
}) {
  await ejecutar(
    `INSERT INTO auditoria_cambio
      (tabla_afectada, id_registro_afectado, accion, valores_anteriores, valores_nuevos, realizado_por, direccion_ip, agente_usuario)
     VALUES (?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?)`,
    [
      parametros.tabla,
      parametros.id,
      parametros.accion,
      JSON.stringify(parametros.anteriores ?? null),
      JSON.stringify(parametros.nuevos ?? null),
      parametros.usuario ?? null,
      parametros.ip ?? null,
      parametros.agente ?? null
    ]
  );
}

export async function registrarAccesoDato(parametros: {
  id_usuario?: number | null;
  id_adulto_mayor?: number | null;
  tipo_dato: "personal" | "clinico" | "sft" | "plan" | "reporte" | "otro";
  accion: "consultar" | "exportar" | "descargar" | "compartir";
  resultado: "permitido" | "denegado";
  motivo?: string | null;
  ip?: string;
  agente?: string;
}) {
  await ejecutar(
    `INSERT INTO auditoria_acceso_dato
      (id_usuario, id_adulto_mayor, tipo_dato, accion, resultado, motivo, direccion_ip, agente_usuario)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      parametros.id_usuario ?? null,
      parametros.id_adulto_mayor ?? null,
      parametros.tipo_dato,
      parametros.accion,
      parametros.resultado,
      parametros.motivo ?? null,
      parametros.ip ?? null,
      parametros.agente ?? null
    ]
  );
}

export async function registrarAutenticacion(parametros: {
  id_usuario?: number | null;
  correo: string;
  accion: "login_exitoso" | "login_fallido" | "refresh" | "logout";
  resultado: "exitoso" | "fallido";
  motivo?: string | null;
  ip?: string;
  agente?: string;
}) {
  await ejecutar(
    `INSERT INTO auditoria_autenticacion
      (id_usuario, correo, accion, resultado, motivo, direccion_ip, agente_usuario)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      parametros.id_usuario ?? null,
      parametros.correo,
      parametros.accion,
      parametros.resultado,
      parametros.motivo ?? null,
      parametros.ip ?? null,
      parametros.agente ?? null
    ]
  );
}
