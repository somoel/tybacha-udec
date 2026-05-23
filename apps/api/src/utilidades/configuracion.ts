import { z } from "zod";

const esquema = z.object({
  NODE_ENV: z.string().default("development"),
  TIDB_HOST: z.string().min(1).default("localhost"),
  TIDB_PORT: z.coerce.number().int().positive().default(4000),
  TIDB_USER: z.string().min(1).default("root"),
  TIDB_PASSWORD: z.string().default(""),
  TIDB_DATABASE: z.string().min(1).default("tybacha"),
  TIDB_ENABLE_SSL: z
    .string()
    .default("false")
    .transform((valor) => valor === "true"),
  JWT_ACCESS_SECRET: z.string().min(32).default("desarrollo_access_secret_cambiar_en_produccion_12345"),
  JWT_REFRESH_SECRET: z.string().min(32).default("desarrollo_refresh_secret_cambiar_en_produccion_12345"),
  CORS_ORIGEN: z.string().default("http://localhost:8081"),
  GEMINI_API_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().min(16).default("desarrollo_cron_secret"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12)
});

export const configuracion = esquema.parse(process.env);

export function validarVariablesProduccion() {
  const faltantes: string[] = [];
  for (const clave of [
    "TIDB_HOST",
    "TIDB_USER",
    "TIDB_PASSWORD",
    "TIDB_DATABASE",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGEN",
    "GEMINI_API_KEY",
    "EXPO_ACCESS_TOKEN",
    "CRON_SECRET"
  ]) {
    if (!process.env[clave]) faltantes.push(clave);
  }
  return faltantes;
}
