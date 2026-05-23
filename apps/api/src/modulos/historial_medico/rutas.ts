import { Hono } from "hono";
import { z } from "zod";
import { consultar, ejecutar } from "../../base_datos/conexion";
import { requiereAutenticacion, requierePermiso } from "../../middlewares/autenticacion";
import type { VariablesContexto } from "../../tipos/contexto";
import { ErrorAplicacion, exigir } from "../../utilidades/errores";
import { registrarCambio } from "../auditoria/servicio";
import { usuarioPuedeAccederAdulto } from "../adultos_mayores/alcance";

export const rutasHistorialMedico = new Hono<{ Variables: VariablesContexto }>();
rutasHistorialMedico.use("*", requiereAutenticacion);

const schema = z.object({
  id_adulto_mayor: z.number().int().positive(),
  tipo: z.enum(["patologia", "medicamento", "nota"]),
  datos: z.record(z.unknown())
});

rutasHistorialMedico.get("/:id_adulto_mayor", requierePermiso("historial_medico:ver_asignados", "historial_medico:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const id = Number(c.req.param("id_adulto_mayor"));
  if (!(await usuarioPuedeAccederAdulto(usuario, id))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes consultar este historial.", 403);
  const datos = {
    patologias: await consultar("SELECT * FROM patologia_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    medicamentos: await consultar("SELECT * FROM medicamento_adulto_mayor WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id]),
    notas: await consultar("SELECT * FROM nota_historial_medico WHERE id_adulto_mayor = ? ORDER BY creado_en DESC", [id])
  };
  return c.json({ datos });
});

rutasHistorialMedico.post("/", requierePermiso("historial_medico:gestionar"), async (c) => {
  const usuario = c.get("usuario");
  exigir(usuario, "NO_AUTENTICADO", "Debes iniciar sesion.", 401);
  const cuerpo = schema.parse(await c.req.json());
  if (!(await usuarioPuedeAccederAdulto(usuario, cuerpo.id_adulto_mayor))) throw new ErrorAplicacion("FUERA_DE_ALCANCE", "No puedes modificar este historial.", 403);
  let id = 0;
  if (cuerpo.tipo === "patologia") {
    const r = await ejecutar(
      "INSERT INTO patologia_adulto_mayor (id_adulto_mayor, nombre, descripcion, estado, registrado_por) VALUES (?, ?, ?, ?, ?)",
      [cuerpo.id_adulto_mayor, cuerpo.datos.nombre, cuerpo.datos.descripcion ?? null, cuerpo.datos.estado ?? "activa", usuario.id_usuario]
    );
    id = Number(r.insertId);
  } else if (cuerpo.tipo === "medicamento") {
    const r = await ejecutar(
      "INSERT INTO medicamento_adulto_mayor (id_adulto_mayor, nombre, dosis, frecuencia, estado, observaciones, registrado_por) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [cuerpo.id_adulto_mayor, cuerpo.datos.nombre, cuerpo.datos.dosis ?? null, cuerpo.datos.frecuencia ?? null, cuerpo.datos.estado ?? "activo", cuerpo.datos.observaciones ?? null, usuario.id_usuario]
    );
    id = Number(r.insertId);
  } else {
    const r = await ejecutar(
      "INSERT INTO nota_historial_medico (id_adulto_mayor, tipo_nota, contenido, registrado_por) VALUES (?, ?, ?, ?)",
      [cuerpo.id_adulto_mayor, cuerpo.datos.tipo_nota ?? "observacion", cuerpo.datos.contenido, usuario.id_usuario]
    );
    id = Number(r.insertId);
  }
  await registrarCambio({ tabla: cuerpo.tipo, id, accion: "crear", usuario: usuario.id_usuario, nuevos: cuerpo.datos });
  return c.json({ datos: { id } }, 201);
});
