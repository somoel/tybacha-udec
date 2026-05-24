import { ejecutar, consultarUno, obtenerPool, transaccion } from "../src/base_datos/conexion";
import { hashContrasena } from "../src/utilidades/seguridad";
import { permisosPorRol, type Rol } from "../src/compartido";

async function idUsuarioPorCorreo(correo: string) {
  const fila = await consultarUno<{ id_usuario: number }>("SELECT id_usuario FROM usuario WHERE correo = ?", [correo]);
  return fila?.id_usuario;
}

async function crearUsuario(parametros: {
  correo: string;
  contrasena: string;
  rol: Rol;
  nombres: string;
  apellidos: string;
  telefono: string;
}) {
  const existente = await idUsuarioPorCorreo(parametros.correo);
  if (existente) return existente;
  const hash = await hashContrasena(parametros.contrasena);
  return transaccion(async (conexion) => {
    const [resultadoUsuario] = await conexion.execute(
      "INSERT INTO usuario (correo, contrasena_hash, rol, estado, correo_verificado) VALUES (?, ?, ?, 'activo', 1)",
      [parametros.correo, hash, parametros.rol]
    );
    const id = Number((resultadoUsuario as { insertId: number }).insertId);
    await conexion.execute(
      "INSERT INTO perfil_usuario (id_usuario, nombres, apellidos, telefono, genero, ciudad) VALUES (?, ?, ?, ?, 'no_informa', 'Bogota')",
      [id, parametros.nombres, parametros.apellidos, parametros.telefono]
    );
    return id;
  });
}

async function sembrarPermisos() {
  const todos = new Map<string, string>();
  for (const permisos of Object.values(permisosPorRol)) {
    for (const permiso of permisos) todos.set(permiso, permiso.split(":")[0] ?? "general");
  }
  for (const [codigo, modulo] of todos) {
    await ejecutar(
      "INSERT IGNORE INTO permiso (codigo, descripcion, modulo) VALUES (?, ?, ?)",
      [codigo, `Permiso ${codigo}`, modulo]
    );
  }
  for (const [rol, permisos] of Object.entries(permisosPorRol) as [Rol, string[]][]) {
    for (const codigo of permisos) {
      await ejecutar(
        `INSERT IGNORE INTO permiso_rol (rol, id_permiso)
         SELECT ?, id_permiso FROM permiso WHERE codigo = ?`,
        [rol, codigo]
      );
    }
  }
}

async function main() {
  await sembrarPermisos();
  const admin = await crearUsuario({
    correo: "admin@tybacha.local",
    contrasena: "TybachaAdmin123!",
    rol: "administrador",
    nombres: "Valeria",
    apellidos: "Rios",
    telefono: "+57 300 100 2020"
  });
  const profesional = await crearUsuario({
    correo: "profesional@tybacha.local",
    contrasena: "TybachaProfesional123!",
    rol: "profesional",
    nombres: "Mateo",
    apellidos: "Salazar",
    telefono: "+57 301 222 1144"
  });
  const cuidador = await crearUsuario({
    correo: "cuidador@tybacha.local",
    contrasena: "TybachaCuidador123!",
    rol: "cuidador",
    nombres: "Claudia",
    apellidos: "Mendez",
    telefono: "+57 302 555 7788"
  });

  await ejecutar(
    "INSERT IGNORE INTO profesional_cuidador (id_profesional, id_cuidador, creado_por) VALUES (?, ?, ?)",
    [profesional, cuidador, admin]
  );

  const adulto = await consultarUno<{ id_adulto_mayor: number }>(
    "SELECT id_adulto_mayor FROM adulto_mayor WHERE tipo_documento = 'CC' AND numero_documento = '900001'"
  );
  let idAdulto = adulto?.id_adulto_mayor;
  if (!idAdulto) {
    const resultado = await ejecutar(
      `INSERT INTO adulto_mayor
        (nombres, apellidos, fecha_nacimiento, genero, tipo_documento, numero_documento, telefono, direccion, ciudad,
         nombre_contacto_emergencia, telefono_contacto_emergencia, creado_por, actualizado_por)
       VALUES ('Elena', 'Torres', '1949-03-17', 'femenino', 'CC', '900001', '+57 304 600 1020',
        'Calle 42 #15-30', 'Bogota', 'Laura Torres', '+57 310 888 1299', ?, ?)`,
      [cuidador, cuidador]
    );
    idAdulto = Number(resultado.insertId);
    await ejecutar(
      `INSERT INTO asignacion_cuidador_adulto_mayor
       (id_adulto_mayor, id_cuidador, asignado_por, fecha_inicio)
       VALUES (?, ?, ?, CURRENT_DATE())`,
      [idAdulto, cuidador, cuidador]
    );
  }

  await ejecutar(
    "INSERT IGNORE INTO bateria_sft (nombre, descripcion, version, estado, creada_por) VALUES ('Senior Fitness Test base', 'Bateria funcional base para adultos mayores.', '1.0', 'activa', ?)",
    [profesional]
  );
  const bateria = await consultarUno<{ id_bateria_sft: number }>(
    "SELECT id_bateria_sft FROM bateria_sft WHERE nombre = 'Senior Fitness Test base' AND version = '1.0'"
  );
  if (bateria) {
    const pruebas = [
      ["Sentarse y levantarse", "repeticiones", 1],
      ["Flexion de brazo", "repeticiones", 2],
      ["Dos minutos marcha", "pasos", 3],
      ["Sentado y alcanzar", "cm", 4],
      ["Rascar espalda", "cm", 5],
      ["Levantarse caminar y sentarse", "segundos", 6]
    ];
    for (const [nombre, unidad, orden] of pruebas) {
      await ejecutar(
        "INSERT IGNORE INTO prueba_sft (id_bateria_sft, nombre, unidad_resultado, orden, activa) VALUES (?, ?, ?, ?, 1)",
        [bateria.id_bateria_sft, nombre, unidad, orden]
      );
    }
  }

  for (const ejercicio of [
    ["Sentarse y levantarse asistido", "fuerza", "Realizar desde silla estable con apoyo cercano."],
    ["Caminata controlada", "resistencia", "Caminar en superficie plana con pausas."],
    ["Movilidad de hombros con banda", "movilidad", "Movimientos lentos sin dolor."],
    ["Equilibrio junto a pared", "equilibrio", "Mantener apoyo disponible."],
    ["Marcha estatica progresiva", "resistencia", "Elevar rodillas de forma alternada."]
  ]) {
    await ejecutar(
      "INSERT IGNORE INTO ejercicio (nombre, categoria, instrucciones, nivel_base, creado_por) VALUES (?, ?, ?, 'bajo', ?)",
      [...ejercicio, profesional]
    );
  }

  await ejecutar(
    `INSERT IGNORE INTO consentimiento_adulto_mayor
      (id_adulto_mayor, tipo_consentimiento, estado, otorgado_por_nombre, fecha_otorgamiento, fecha_vencimiento, registrado_por)
     VALUES (?, 'tratamiento_datos', 'vigente', 'Elena Torres', CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 1 YEAR), ?)`,
    [idAdulto, profesional]
  );

  console.log("Seeds aplicados. Credenciales documentadas en README.md");
  await obtenerPool().end();
}

main().catch(async (error) => {
  console.error(error);
  await obtenerPool().end();
  process.exit(1);
});
