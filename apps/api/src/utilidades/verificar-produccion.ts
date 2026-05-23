import { validarVariablesProduccion } from "./configuracion";

const faltantes = validarVariablesProduccion();
if (process.env.NODE_ENV === "production" && faltantes.length) {
  console.error(`Variables faltantes: ${faltantes.join(", ")}`);
  process.exit(1);
}
console.log("Verificacion de produccion completada.");
