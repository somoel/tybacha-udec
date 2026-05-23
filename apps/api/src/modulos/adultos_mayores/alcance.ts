import type { UsuarioAutenticado } from "@tybacha/compartido";
import { consultarUno } from "../../base_datos/conexion";

export async function usuarioPuedeAccederAdulto(usuario: UsuarioAutenticado, idAdultoMayor: number) {
  if (usuario.rol === "administrador") return true;
  if (usuario.rol === "cuidador") {
    const fila = await consultarUno(
      `SELECT 1 permitido FROM asignacion_cuidador_adulto_mayor
       WHERE id_adulto_mayor = ? AND id_cuidador = ? AND estado = 'activa' LIMIT 1`,
      [idAdultoMayor, usuario.id_usuario]
    );
    return Boolean(fila);
  }
  const fila = await consultarUno(
    `SELECT 1 permitido
     FROM asignacion_cuidador_adulto_mayor a
     JOIN profesional_cuidador pc ON pc.id_cuidador = a.id_cuidador AND pc.estado = 'activo'
     WHERE a.id_adulto_mayor = ? AND pc.id_profesional = ? AND a.estado = 'activa'
     LIMIT 1`,
    [idAdultoMayor, usuario.id_usuario]
  );
  return Boolean(fila);
}

export function filtroAlcanceAdultos(usuario: UsuarioAutenticado) {
  if (usuario.rol === "administrador") return { sql: "", valores: [] as unknown[] };
  if (usuario.rol === "cuidador") {
    return {
      sql: ` AND EXISTS (
        SELECT 1 FROM asignacion_cuidador_adulto_mayor aa
        WHERE aa.id_adulto_mayor = am.id_adulto_mayor AND aa.id_cuidador = ? AND aa.estado = 'activa'
      )`,
      valores: [usuario.id_usuario]
    };
  }
  return {
    sql: ` AND EXISTS (
      SELECT 1 FROM asignacion_cuidador_adulto_mayor aa
      JOIN profesional_cuidador pc ON pc.id_cuidador = aa.id_cuidador AND pc.estado = 'activo'
      WHERE aa.id_adulto_mayor = am.id_adulto_mayor AND pc.id_profesional = ? AND aa.estado = 'activa'
    )`,
    valores: [usuario.id_usuario]
  };
}
