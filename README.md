# Tybacha

Tybacha es una plataforma de gestion, seguimiento y monitoreo de adultos mayores. Incluye app Expo para Android y Web SPA, API serverless para Vercel Functions y base de datos TiDB Cloud compatible con MySQL.

## Arquitectura

- `apps/app`: Expo, React Native, Expo Router, NativeWind, TanStack Query, Zustand y cola offline.
- `apps/api`: Hono sobre Vercel Functions, SQL puro con `mysql2/promise`, JWT, bcrypt, zod, Gemini y Expo Push.
- `paquetes/compartido`: tipos, constantes y validaciones compartidas.

El adulto mayor es una entidad gestionada. No inicia sesion, no tiene usuario y no existe rol `adulto_mayor`.

## Requisitos

- Node.js 20 o superior.
- pnpm 9.
- TiDB Cloud compatible MySQL.
- Cuenta de Gemini para generacion de planes.
- Cuenta Expo para push notifications y EAS Build.
- Vercel CLI para ejecucion local de la API serverless.

## Instalacion

```bash
pnpm install
```

## Variables De Entorno

Copia `.env.example`, `apps/api/.env.example` y `apps/app/.env.example` a sus archivos `.env` correspondientes.

La API requiere `TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`, `TIDB_ENABLE_SSL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGEN`, `GEMINI_API_KEY`, `EXPO_ACCESS_TOKEN`, `CRON_SECRET` y `BCRYPT_SALT_ROUNDS`.

La app requiere `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_NOMBRE_APP` y `EXPO_PUBLIC_ENTORNO`.

## Desarrollo Local

```bash
pnpm dev:api
pnpm dev:app
```

La API se ejecuta con Vercel Functions. La app web consume `EXPO_PUBLIC_API_URL`.

## Migraciones Y Seeds

```bash
pnpm --filter @tybacha/api migrar
pnpm --filter @tybacha/api seed
```

Credenciales de desarrollo creadas por seed:

- `admin@tybacha.local` / `TybachaAdmin123!`
- `profesional@tybacha.local` / `TybachaProfesional123!`
- `cuidador@tybacha.local` / `TybachaCuidador123!`

## Calidad

```bash
pnpm lint
pnpm test
pnpm build
pnpm verificar
```

## Despliegue Web En Vercel

- Proyecto: `tybacha-web`
- Root Directory: `apps/app`
- Framework Preset: `Other`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Variables: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_NOMBRE_APP`, `EXPO_PUBLIC_ENTORNO`

## Despliegue API En Vercel

- Proyecto: `tybacha-api`
- Root Directory: `apps/api`
- Framework Preset: `Other`
- Build Command: `pnpm build`
- Variables: todas las variables de `apps/api/.env.example`

## TiDB Cloud

Crear una base MySQL compatible, habilitar SSL si aplica, configurar las variables `TIDB_*`, ejecutar migraciones y luego seeds.

## Gemini

Configurar `GEMINI_API_KEY` solo en la API. La app nunca llama Gemini ni expone la clave.

## Expo Push Notifications

Configurar `EXPO_ACCESS_TOKEN`, registrar tokens desde la app y usar el endpoint protegido de cron para recordatorios programados.

## Android Con EAS Build

```bash
cd apps/app
eas build -p android
```

## Offline Y Sincronizacion

La app guarda operaciones locales para adultos mayores y seguimiento. Al recuperar conexion envia lotes a `/api/sincronizacion`, la API valida permisos y responde aplicado, error o conflicto.

## Auditoria

Se auditan login, logout, cambios de datos, accesos sensibles, exportaciones, foto, SFT, planes, consentimientos y sincronizacion aplicada.

## Troubleshooting

- Si Vercel rechaza cookies en desarrollo, validar `CORS_ORIGEN` y usar HTTPS en produccion.
- Si TiDB no conecta, revisar SSL y allowlist de IP.
- Si Gemini falla, la API registra la generacion como fallida y devuelve error seguro.
- Si Expo Push falla, revisar `EXPO_ACCESS_TOKEN` y token de dispositivo.

## Checklist Produccion

- Variables configuradas en Vercel.
- Migraciones ejecutadas.
- Seeds ejecutados solo con credenciales temporales rotadas.
- CORS limitado a dominios reales.
- JWT secrets largos.
- Cron protegido con `CRON_SECRET`.
- Gemini y Expo configurados.
- `pnpm verificar` exitoso.
