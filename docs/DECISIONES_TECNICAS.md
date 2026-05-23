# Decisiones Tecnicas

- Hono se usa para API serverless por compatibilidad con Vercel Functions y bajo overhead.
- SQL puro con `mysql2/promise`; no se usa ORM.
- JWT access token vive en memoria de la app. Refresh token se guarda hasheado en base de datos.
- Web usa cookie httpOnly para refresh cuando el navegador lo permite. Android usa Expo Secure Store.
- Gemini solo se invoca desde backend.
- Expo Push se integra mediante API HTTP de Expo.
- Fotos de adulto mayor se envian como base64 para compatibilidad con Vercel Functions y se guardan como `MEDIUMBLOB`.
- Offline usa cola de operaciones con `id_local`, `version` y resolucion inicial por conflicto.
- El rol `adulto_mayor` se elimina aunque aparezca en mock o PDF.
