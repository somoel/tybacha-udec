import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ejecutar, obtenerPool } from "./conexion";

function separarSentencias(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((sentencia) => sentencia.trim())
    .filter(Boolean);
}

async function main() {
  const raiz = join(fileURLToPath(new URL("../../..", import.meta.url)), "migraciones");
  const archivos = (await readdir(raiz)).filter((archivo) => archivo.endsWith(".sql")).sort();

  for (const archivo of archivos) {
    await ejecutar(
      `CREATE TABLE IF NOT EXISTS migracion (
        id_migracion BIGINT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(180) NOT NULL,
        aplicada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id_migracion),
        UNIQUE KEY uk_migracion_nombre (nombre)
      )`
    );
    const contenido = await readFile(join(raiz, archivo), "utf8");
    for (const sentencia of separarSentencias(contenido)) {
      await ejecutar(sentencia);
    }
    await ejecutar("INSERT IGNORE INTO migracion (nombre) VALUES (?)", [archivo]);
    console.log(`Migracion aplicada: ${archivo}`);
  }

  await obtenerPool().end();
}

main().catch(async (error) => {
  console.error(error);
  await obtenerPool().end();
  process.exit(1);
});
