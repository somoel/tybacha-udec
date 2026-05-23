# Despliegue En Vercel

## tybacha-web

- Root Directory: `apps/app`
- Framework Preset: `Other`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Variables: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_NOMBRE_APP`, `EXPO_PUBLIC_ENTORNO`

`apps/app/vercel.json` redirige todas las rutas a `index.html`.

## tybacha-api

- Root Directory: `apps/api`
- Framework Preset: `Other`
- Build Command: `pnpm build`
- Functions: `api/[...ruta].ts`
- Variables: ver `apps/api/.env.example`

## CORS

`CORS_ORIGEN` debe apuntar al dominio web final. En desarrollo puede incluir `http://localhost:8081`.

## Cron

Crear Vercel Cron contra `/api/notificaciones/cron/recordatorios` y enviar header `x-cron-secret` con `CRON_SECRET`.

## Troubleshooting

- Error de TiDB: revisar SSL, puerto 4000 y allowlist.
- Error de cookie: validar HTTPS, `SameSite=None` en produccion y CORS con credenciales.
- Error de build web: confirmar que `web.output` sea `single`.
