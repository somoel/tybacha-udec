import mysql, { PoolConnection, type Pool, type QueryResult } from "mysql2/promise";
import { configuracion } from "../utilidades/configuracion";

let pool: Pool | null = null;

export function obtenerPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: configuracion.TIDB_HOST,
      port: configuracion.TIDB_PORT,
      user: configuracion.TIDB_USER,
      password: configuracion.TIDB_PASSWORD,
      database: configuracion.TIDB_DATABASE,
      waitForConnections: true,
      connectionLimit: 4,
      namedPlaceholders: true,
      ssl: configuracion.TIDB_ENABLE_SSL ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined
    });
  }
  return pool;
}

export async function consultar<T = Record<string, unknown>>(sql: string, valores?: unknown) {
  const [filas] = await obtenerPool().execute<QueryResult>(sql, valores as any);
  return filas as T[];
}

export async function consultarUno<T = Record<string, unknown>>(sql: string, valores?: unknown) {
  const filas = await consultar<T>(sql, valores);
  return filas[0] ?? null;
}

export async function ejecutar(sql: string, valores?: unknown) {
  const [resultado] = await obtenerPool().execute(sql, valores as any);
  return resultado as mysql.ResultSetHeader;
}

export async function transaccion<T>(operacion: (conexion: PoolConnection) => Promise<T>): Promise<T> {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
