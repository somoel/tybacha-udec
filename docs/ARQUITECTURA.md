# Arquitectura

## Frontend

Expo Router organiza rutas publicas y autenticadas. NativeWind aplica tokens visuales inspirados en el mock. TanStack Query maneja cache de API y Zustand maneja sesion, UI y cola offline.

## Backend

Hono expone modulos bajo `/api/*` en Vercel Functions. Middlewares validan CORS, autenticacion, permisos, errores y auditoria. Los servicios usan SQL puro y transacciones.

## Base De Datos

TiDB Cloud compatible MySQL. Migraciones SQL puras, seeds TypeScript y helper de pool serverless.

## IA

Gemini recibe un prompt clinico-operativo con perfil, historial, SFT y planes previos. La respuesta se valida y se persiste como plan borrador.

## Notificaciones

Expo Push tokens se registran por usuario/dispositivo. Recordatorios programados se ejecutan con Vercel Cron contra endpoint protegido.

## Sincronizacion

La app encola operaciones offline y la API aplica lotes con validacion de permisos, version y auditoria.
