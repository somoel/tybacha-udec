# Plan De Implementacion

## Diagnostico Del Mock

El mock HTML usa una interfaz clinica clara: fondo `#f4f7fb`, superficies blancas, verde principal `#0c8f83`, azul informativo `#3d6edb`, naranja de acento `#ef7c45`, estados semanticos, sidebar, topbar, cards compactas, tablas, graficas simples, badges, formularios y modales. La implementacion lo reinterpreta en React Native y NativeWind, con navegacion por rol, mejor espaciado, estados accesibles y responsive para Android y Web.

El mock usa `localStorage`, datos simulados y un rol `older_adult`. En Tybacha productivo se elimina ese rol y todos los datos vienen de la API.

## Diagnostico Del Esquema

El esquema recibido cubre las entidades principales, pero incluye `adulto_mayor` como rol y `adulto_mayor.id_usuario`. Eso contradice la regla funcional critica. Tambien faltan tokens push por dispositivo, relacion profesional-cuidador, versionamiento para sincronizacion y auditoria especifica de autenticacion.

## Cambios Necesarios Al Esquema

- Roles validos: `administrador`, `profesional`, `cuidador`.
- El adulto mayor no tiene usuario autenticable.
- `adulto_mayor` mantiene `creado_por`, `actualizado_por`, `id_local` y `version`.
- Se agregan `profesional_cuidador`, `dispositivo_push_usuario`, `auditoria_autenticacion` y campos de sincronizacion.
- Las fotos se guardan en SQL con `MEDIUMBLOB`.

## Arquitectura Propuesta

Monorepo `pnpm` con app Expo, API Hono serverless y paquete compartido. La API concentra autenticacion, permisos, SQL, Gemini, Expo Push, auditoria y sincronizacion. La app nunca toca TiDB ni secretos.

## Fases

1. Base monorepo, docs y variables.
2. Migraciones, seeds y paquete compartido.
3. API serverless con modulos y pruebas.
4. App Expo con UI completa, forms, sesion y offline.
5. Verificacion, build y documentacion de despliegue.

## Riesgos

- TiDB, Gemini, Expo Push y EAS requieren credenciales externas para pruebas reales.
- Vercel Cron debe configurarse fuera del codigo.
- La generacion de IA depende de respuestas estructuradas; por eso se valida con zod.

## Supuestos

No hay registro publico. El administrador inicial nace por seed. Las exportaciones iniciales son CSV y JSON.
