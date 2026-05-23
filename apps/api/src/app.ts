import { Hono } from "hono";
import { cors } from "hono/cors";
import type { VariablesContexto } from "./tipos/contexto";
import { configuracion } from "./utilidades/configuracion";
import { manejarErrores } from "./utilidades/errores";
import { agregarContexto } from "./middlewares/contexto";
import { rutasSalud } from "./modulos/salud/rutas";
import { rutasAutenticacion } from "./modulos/autenticacion/rutas";
import { rutasUsuarios } from "./modulos/usuarios/rutas";
import { rutasProfesionales } from "./modulos/profesionales/rutas";
import { rutasCuidadores } from "./modulos/cuidadores/rutas";
import { rutasAdultosMayores } from "./modulos/adultos_mayores/rutas";
import { rutasHistorialMedico } from "./modulos/historial_medico/rutas";
import { rutasSft } from "./modulos/sft/rutas";
import { rutasPlanes } from "./modulos/planes/rutas";
import { rutasSeguimiento } from "./modulos/seguimiento/rutas";
import { rutasNotificaciones } from "./modulos/notificaciones/rutas";
import { rutasReportes } from "./modulos/reportes/rutas";
import { rutasAuditoria } from "./modulos/auditoria/rutas";
import { rutasSincronizacion } from "./modulos/sincronizacion/rutas";
import { rutasConsentimientos } from "./modulos/consentimientos/rutas";
import { rutasIa } from "./modulos/ia/rutas";

export const app = new Hono<{ Variables: VariablesContexto }>().basePath("/api");

app.use("*", manejarErrores);
app.use("*", agregarContexto);
app.use(
  "*",
  cors({
    origin: configuracion.CORS_ORIGEN.split(",").map((origen) => origen.trim()),
    allowHeaders: ["Content-Type", "Authorization", "x-cron-secret"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  })
);

app.route("/salud", rutasSalud);
app.route("/auth", rutasAutenticacion);
app.route("/usuarios", rutasUsuarios);
app.route("/profesionales", rutasProfesionales);
app.route("/cuidadores", rutasCuidadores);
app.route("/adultos-mayores", rutasAdultosMayores);
app.route("/historial-medico", rutasHistorialMedico);
app.route("/sft", rutasSft);
app.route("/planes", rutasPlanes);
app.route("/seguimiento", rutasSeguimiento);
app.route("/notificaciones", rutasNotificaciones);
app.route("/reportes", rutasReportes);
app.route("/auditoria", rutasAuditoria);
app.route("/sincronizacion", rutasSincronizacion);
app.route("/consentimientos", rutasConsentimientos);
app.route("/ia", rutasIa);

app.notFound((c) => c.json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no encontrada." } }, 404));
