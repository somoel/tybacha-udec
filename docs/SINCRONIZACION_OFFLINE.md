# Sincronizacion Offline

## Arquitectura

La app mantiene una cola local persistente. Cada operacion registra `id_local`, `entidad`, `accion`, `payload`, fechas locales, intentos, estado, error y si requiere autenticacion.

## Entidades Soportadas

- adulto_mayor
- contacto_adulto_mayor
- patologia_adulto_mayor
- medicamento_adulto_mayor
- registro_actividad_diaria
- registro_ejercicio_plan

## Endpoint

`POST /api/sincronizacion` recibe `{ operaciones: [] }` y responde resultados por operacion.

## Conflictos

Si `version` o `actualizado_en` no coinciden, la API responde `conflicto`. La app conserva la operacion y muestra el conflicto para reintento.

## Limitaciones

La sincronizacion no intenta fusionar automaticamente cambios clinicos conflictivos.
