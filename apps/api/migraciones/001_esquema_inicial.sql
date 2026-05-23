CREATE TABLE IF NOT EXISTS migracion (
  id_migracion BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(180) NOT NULL,
  aplicada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_migracion),
  UNIQUE KEY uk_migracion_nombre (nombre)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario BIGINT NOT NULL AUTO_INCREMENT,
  correo VARCHAR(255) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador','profesional','cuidador') NOT NULL,
  estado ENUM('pendiente','activo','bloqueado','inactivo') NOT NULL DEFAULT 'pendiente',
  correo_verificado TINYINT(1) NOT NULL DEFAULT 0,
  ultimo_acceso_en DATETIME(3) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uk_usuario_correo (correo),
  KEY idx_usuario_rol_estado (rol, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfil_usuario (
  id_perfil_usuario BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NOT NULL,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  tipo_documento VARCHAR(30) NULL,
  numero_documento VARCHAR(60) NULL,
  telefono VARCHAR(40) NULL,
  fecha_nacimiento DATE NULL,
  genero ENUM('femenino','masculino','otro','no_informa') NULL,
  direccion VARCHAR(255) NULL,
  ciudad VARCHAR(120) NULL,
  foto_binaria MEDIUMBLOB NULL,
  foto_tipo_mime VARCHAR(40) NULL,
  foto_tamano_bytes INT UNSIGNED NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_perfil_usuario),
  UNIQUE KEY uk_perfil_usuario_id_usuario (id_usuario),
  UNIQUE KEY uk_perfil_usuario_documento (tipo_documento, numero_documento),
  CONSTRAINT fk_perfil_usuario_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesion_usuario (
  id_sesion_usuario BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NOT NULL,
  token_refresco_hash CHAR(64) NOT NULL,
  dispositivo VARCHAR(120) NULL,
  direccion_ip VARCHAR(45) NULL,
  agente_usuario VARCHAR(255) NULL,
  recordar_sesion TINYINT(1) NOT NULL DEFAULT 0,
  expira_en DATETIME(3) NOT NULL,
  revocada_en DATETIME(3) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_sesion_usuario),
  UNIQUE KEY uk_sesion_usuario_token (token_refresco_hash),
  KEY idx_sesion_usuario_usuario (id_usuario, expira_en),
  CONSTRAINT fk_sesion_usuario_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permiso (
  id_permiso BIGINT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(120) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  modulo VARCHAR(80) NOT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_permiso),
  UNIQUE KEY uk_permiso_codigo (codigo),
  KEY idx_permiso_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permiso_rol (
  id_permiso_rol BIGINT NOT NULL AUTO_INCREMENT,
  rol ENUM('administrador','profesional','cuidador') NOT NULL,
  id_permiso BIGINT NOT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_permiso_rol),
  UNIQUE KEY uk_permiso_rol (rol, id_permiso),
  CONSTRAINT fk_permiso_rol_permiso FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profesional_cuidador (
  id_profesional_cuidador BIGINT NOT NULL AUTO_INCREMENT,
  id_profesional BIGINT NOT NULL,
  id_cuidador BIGINT NOT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_profesional_cuidador),
  UNIQUE KEY uk_profesional_cuidador (id_profesional, id_cuidador),
  KEY idx_profesional_cuidador_cuidador (id_cuidador, estado),
  CONSTRAINT fk_profesional_cuidador_profesional FOREIGN KEY (id_profesional) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_profesional_cuidador_cuidador FOREIGN KEY (id_cuidador) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_profesional_cuidador_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adulto_mayor (
  id_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_local VARCHAR(120) NULL,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero ENUM('femenino','masculino','otro','no_informa') NOT NULL DEFAULT 'no_informa',
  tipo_documento VARCHAR(30) NULL,
  numero_documento VARCHAR(60) NULL,
  telefono VARCHAR(40) NULL,
  correo_contacto VARCHAR(255) NULL,
  direccion VARCHAR(255) NULL,
  ciudad VARCHAR(120) NULL,
  nombre_contacto_emergencia VARCHAR(160) NULL,
  telefono_contacto_emergencia VARCHAR(40) NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  motivo_inactivacion VARCHAR(255) NULL,
  inactivado_en DATETIME(3) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_por BIGINT NULL,
  actualizado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_adulto_mayor),
  UNIQUE KEY uk_adulto_mayor_id_local (id_local),
  UNIQUE KEY uk_adulto_mayor_documento (tipo_documento, numero_documento),
  KEY idx_adulto_mayor_estado_nombre (estado, apellidos, nombres),
  CONSTRAINT fk_adulto_mayor_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_adulto_mayor_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS foto_perfil_adulto_mayor (
  id_adulto_mayor BIGINT NOT NULL,
  foto_binaria MEDIUMBLOB NOT NULL,
  tipo_mime VARCHAR(40) NOT NULL,
  tamano_bytes INT UNSIGNED NOT NULL,
  ancho_pixeles SMALLINT UNSIGNED NULL,
  alto_pixeles SMALLINT UNSIGNED NULL,
  huella_sha256 CHAR(64) NOT NULL,
  creada_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_adulto_mayor),
  CONSTRAINT fk_foto_perfil_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_foto_perfil_creada_por FOREIGN KEY (creada_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacto_adulto_mayor (
  id_contacto_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_local VARCHAR(120) NULL,
  nombre VARCHAR(160) NOT NULL,
  parentesco VARCHAR(80) NULL,
  telefono VARCHAR(40) NULL,
  correo VARCHAR(255) NULL,
  es_emergencia TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_contacto_adulto_mayor),
  UNIQUE KEY uk_contacto_id_local (id_local),
  CONSTRAINT fk_contacto_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patologia_adulto_mayor (
  id_patologia_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_local VARCHAR(120) NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  fecha_diagnostico DATE NULL,
  estado ENUM('activa','resuelta','cronica','desconocida') NOT NULL DEFAULT 'activa',
  registrado_por BIGINT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_patologia_adulto_mayor),
  UNIQUE KEY uk_patologia_id_local (id_local),
  CONSTRAINT fk_patologia_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_patologia_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medicamento_adulto_mayor (
  id_medicamento_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_local VARCHAR(120) NULL,
  nombre VARCHAR(160) NOT NULL,
  dosis VARCHAR(120) NULL,
  frecuencia VARCHAR(120) NULL,
  via_administracion VARCHAR(80) NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  estado ENUM('activo','suspendido','finalizado','desconocido') NOT NULL DEFAULT 'activo',
  observaciones TEXT NULL,
  registrado_por BIGINT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_medicamento_adulto_mayor),
  UNIQUE KEY uk_medicamento_id_local (id_local),
  CONSTRAINT fk_medicamento_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_medicamento_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nota_historial_medico (
  id_nota_historial_medico BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  tipo_nota ENUM('antecedente','alergia','limitacion','observacion','otro') NOT NULL DEFAULT 'observacion',
  contenido TEXT NOT NULL,
  registrado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_nota_historial_medico),
  CONSTRAINT fk_nota_historial_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_nota_historial_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asignacion_cuidador_adulto_mayor (
  id_asignacion_cuidador_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_cuidador BIGINT NOT NULL,
  asignado_por BIGINT NULL,
  estado ENUM('activa','finalizada') NOT NULL DEFAULT 'activa',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  motivo_finalizacion VARCHAR(255) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_asignacion_cuidador_adulto_mayor),
  KEY idx_asignacion_adulto_estado (id_adulto_mayor, estado),
  KEY idx_asignacion_cuidador_estado (id_cuidador, estado),
  CONSTRAINT fk_asignacion_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_asignacion_cuidador FOREIGN KEY (id_cuidador) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asignacion_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bateria_sft (
  id_bateria_sft BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  version VARCHAR(40) NOT NULL DEFAULT '1.0',
  estado ENUM('borrador','activa','inactiva') NOT NULL DEFAULT 'activa',
  creada_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_bateria_sft),
  UNIQUE KEY uk_bateria_sft_nombre_version (nombre, version),
  CONSTRAINT fk_bateria_sft_creada_por FOREIGN KEY (creada_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prueba_sft (
  id_prueba_sft BIGINT NOT NULL AUTO_INCREMENT,
  id_bateria_sft BIGINT NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  unidad_resultado VARCHAR(40) NULL,
  orden SMALLINT UNSIGNED NOT NULL,
  puntaje_minimo DECIMAL(10,2) NULL,
  puntaje_maximo DECIMAL(10,2) NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_prueba_sft),
  UNIQUE KEY uk_prueba_sft_orden (id_bateria_sft, orden),
  CONSTRAINT fk_prueba_sft_bateria FOREIGN KEY (id_bateria_sft) REFERENCES bateria_sft(id_bateria_sft)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aplicacion_sft (
  id_aplicacion_sft BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_bateria_sft BIGINT NOT NULL,
  responsable BIGINT NULL,
  fecha_aplicacion DATETIME(3) NOT NULL,
  estado ENUM('en_proceso','finalizada','anulada') NOT NULL DEFAULT 'finalizada',
  observaciones TEXT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_aplicacion_sft),
  CONSTRAINT fk_aplicacion_sft_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_aplicacion_sft_bateria FOREIGN KEY (id_bateria_sft) REFERENCES bateria_sft(id_bateria_sft)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_aplicacion_sft_responsable FOREIGN KEY (responsable) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resultado_sft (
  id_resultado_sft BIGINT NOT NULL AUTO_INCREMENT,
  id_aplicacion_sft BIGINT NOT NULL,
  id_prueba_sft BIGINT NOT NULL,
  valor_numerico DECIMAL(12,3) NULL,
  valor_texto VARCHAR(255) NULL,
  clasificacion VARCHAR(80) NULL,
  observaciones TEXT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_resultado_sft),
  UNIQUE KEY uk_resultado_sft_aplicacion_prueba (id_aplicacion_sft, id_prueba_sft),
  CONSTRAINT fk_resultado_sft_aplicacion FOREIGN KEY (id_aplicacion_sft) REFERENCES aplicacion_sft(id_aplicacion_sft)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_resultado_sft_prueba FOREIGN KEY (id_prueba_sft) REFERENCES prueba_sft(id_prueba_sft)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ejercicio (
  id_ejercicio BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NULL,
  categoria VARCHAR(100) NULL,
  instrucciones TEXT NULL,
  contraindicaciones TEXT NULL,
  nivel_base ENUM('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_ejercicio),
  CONSTRAINT fk_ejercicio_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plan_ejercicio (
  id_plan_ejercicio BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  objetivo TEXT NULL,
  origen ENUM('manual','ia','mixto') NOT NULL DEFAULT 'manual',
  estado ENUM('borrador','generado','revisado','asignado','activo','pausado','finalizado','cancelado') NOT NULL DEFAULT 'borrador',
  nivel_dificultad ENUM('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  creado_por BIGINT NULL,
  revisado_por BIGINT NULL,
  asignado_por BIGINT NULL,
  revisado_en DATETIME(3) NULL,
  asignado_en DATETIME(3) NULL,
  datos_personalizacion JSON NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_plan_ejercicio),
  KEY idx_plan_adulto_estado (id_adulto_mayor, estado),
  CONSTRAINT fk_plan_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_plan_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_plan_revisado_por FOREIGN KEY (revisado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_plan_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generacion_ia_plan (
  id_generacion_ia_plan BIGINT NOT NULL AUTO_INCREMENT,
  id_plan_ejercicio BIGINT NOT NULL,
  proveedor VARCHAR(80) NOT NULL DEFAULT 'gemini',
  modelo VARCHAR(120) NULL,
  solicitud JSON NULL,
  respuesta JSON NULL,
  estado ENUM('exitosa','fallida','parcial') NOT NULL DEFAULT 'exitosa',
  mensaje_error TEXT NULL,
  creado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_generacion_ia_plan),
  CONSTRAINT fk_generacion_ia_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_generacion_ia_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ejercicio_plan (
  id_ejercicio_plan BIGINT NOT NULL AUTO_INCREMENT,
  id_plan_ejercicio BIGINT NOT NULL,
  id_ejercicio BIGINT NULL,
  nombre_personalizado VARCHAR(160) NULL,
  descripcion_personalizada TEXT NULL,
  dia_semana ENUM('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  series SMALLINT UNSIGNED NULL,
  repeticiones SMALLINT UNSIGNED NULL,
  duracion_segundos INT UNSIGNED NULL,
  descanso_segundos INT UNSIGNED NULL,
  dificultad ENUM('bajo','medio','alto') NOT NULL DEFAULT 'bajo',
  instrucciones TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_ejercicio_plan),
  UNIQUE KEY uk_ejercicio_plan_dia_orden (id_plan_ejercicio, dia_semana, orden),
  CONSTRAINT fk_ejercicio_plan_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ejercicio_plan_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES ejercicio(id_ejercicio)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cambio_estado_plan (
  id_cambio_estado_plan BIGINT NOT NULL AUTO_INCREMENT,
  id_plan_ejercicio BIGINT NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  motivo VARCHAR(255) NULL,
  cambiado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_cambio_estado_plan),
  CONSTRAINT fk_cambio_estado_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cambio_estado_cambiado_por FOREIGN KEY (cambiado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registro_actividad_diaria (
  id_registro_actividad_diaria BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_plan_ejercicio BIGINT NULL,
  id_local VARCHAR(120) NULL,
  fecha_actividad DATE NOT NULL,
  resumen TEXT NULL,
  nivel_energia ENUM('bajo','medio','alto','no_registrado') NOT NULL DEFAULT 'no_registrado',
  observaciones TEXT NULL,
  registrado_por BIGINT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_registro_actividad_diaria),
  UNIQUE KEY uk_actividad_id_local (id_local),
  UNIQUE KEY uk_actividad_adulto_fecha_plan (id_adulto_mayor, fecha_actividad, id_plan_ejercicio),
  CONSTRAINT fk_actividad_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_actividad_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_actividad_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registro_ejercicio_plan (
  id_registro_ejercicio_plan BIGINT NOT NULL AUTO_INCREMENT,
  id_ejercicio_plan BIGINT NOT NULL,
  id_adulto_mayor BIGINT NOT NULL,
  id_registro_actividad_diaria BIGINT NULL,
  id_local VARCHAR(120) NULL,
  fecha_programada DATE NOT NULL,
  fecha_realizacion DATETIME(3) NULL,
  estado ENUM('pendiente','completado','omitido','parcial') NOT NULL DEFAULT 'pendiente',
  duracion_real_segundos INT UNSIGNED NULL,
  repeticiones_realizadas SMALLINT UNSIGNED NULL,
  esfuerzo_percibido TINYINT UNSIGNED NULL,
  dolor_reportado TINYINT UNSIGNED NULL,
  comentario TEXT NULL,
  registrado_por BIGINT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_registro_ejercicio_plan),
  UNIQUE KEY uk_registro_ejercicio_id_local (id_local),
  UNIQUE KEY uk_registro_ejercicio_fecha (id_ejercicio_plan, fecha_programada),
  CONSTRAINT fk_registro_ejercicio_plan FOREIGN KEY (id_ejercicio_plan) REFERENCES ejercicio_plan(id_ejercicio_plan)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_registro_ejercicio_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_registro_ejercicio_actividad FOREIGN KEY (id_registro_actividad_diaria) REFERENCES registro_actividad_diaria(id_registro_actividad_diaria)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_registro_ejercicio_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS estadistica_progreso (
  id_estadistica_progreso BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  id_plan_ejercicio BIGINT NULL,
  tipo_periodo ENUM('dia','semana','mes') NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  ejercicios_programados INT UNSIGNED NOT NULL DEFAULT 0,
  ejercicios_completados INT UNSIGNED NOT NULL DEFAULT 0,
  ejercicios_omitidos INT UNSIGNED NOT NULL DEFAULT 0,
  porcentaje_cumplimiento DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  datos_metricas JSON NULL,
  calculado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_estadistica_progreso),
  UNIQUE KEY uk_estadistica_periodo (id_adulto_mayor, id_plan_ejercicio, tipo_periodo, fecha_inicio, fecha_fin),
  CONSTRAINT fk_estadistica_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_estadistica_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerta_programada (
  id_alerta_programada BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NULL,
  id_plan_ejercicio BIGINT NULL,
  id_usuario_destinatario BIGINT NULL,
  tipo_alerta ENUM('recordatorio_ejercicio','cumplimiento','progreso','sistema','otro') NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  canal ENUM('app','correo','sms','push') NOT NULL DEFAULT 'app',
  fecha_programada DATETIME(3) NULL,
  regla_programacion JSON NULL,
  condicion_disparo JSON NULL,
  estado ENUM('activa','pausada','finalizada','cancelada') NOT NULL DEFAULT 'activa',
  creada_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_alerta_programada),
  CONSTRAINT fk_alerta_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_alerta_plan FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_alerta_destinatario FOREIGN KEY (id_usuario_destinatario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_alerta_creada_por FOREIGN KEY (creada_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion BIGINT NOT NULL AUTO_INCREMENT,
  id_alerta_programada BIGINT NULL,
  id_usuario_destinatario BIGINT NOT NULL,
  id_adulto_mayor BIGINT NULL,
  tipo_notificacion ENUM('recordatorio_ejercicio','cumplimiento','progreso','sistema','otro') NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  canal ENUM('app','correo','sms','push') NOT NULL DEFAULT 'app',
  estado ENUM('pendiente','enviada','recibida','leida','fallida') NOT NULL DEFAULT 'pendiente',
  enviada_en DATETIME(3) NULL,
  recibida_en DATETIME(3) NULL,
  leida_en DATETIME(3) NULL,
  error_envio TEXT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_notificacion),
  CONSTRAINT fk_notificacion_alerta FOREIGN KEY (id_alerta_programada) REFERENCES alerta_programada(id_alerta_programada)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_notificacion_destinatario FOREIGN KEY (id_usuario_destinatario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notificacion_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispositivo_push_usuario (
  id_dispositivo_push_usuario BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NOT NULL,
  expo_push_token VARCHAR(255) NOT NULL,
  plataforma ENUM('android','web','ios','desconocida') NOT NULL DEFAULT 'desconocida',
  dispositivo VARCHAR(160) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_dispositivo_push_usuario),
  UNIQUE KEY uk_dispositivo_push_token (expo_push_token),
  CONSTRAINT fk_dispositivo_push_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reporte_generado (
  id_reporte_generado BIGINT NOT NULL AUTO_INCREMENT,
  tipo_reporte ENUM('progreso','actividad','sft','cumplimiento','administrativo','otro') NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  filtros JSON NULL,
  resumen JSON NULL,
  formato ENUM('json','csv') NOT NULL DEFAULT 'json',
  generado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_reporte_generado),
  CONSTRAINT fk_reporte_generado_por FOREIGN KEY (generado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS archivo_exportado (
  id_archivo_exportado BIGINT NOT NULL AUTO_INCREMENT,
  id_reporte_generado BIGINT NOT NULL,
  nombre_archivo VARCHAR(180) NOT NULL,
  tipo_mime VARCHAR(80) NOT NULL,
  contenido_binario MEDIUMBLOB NULL,
  contenido_texto MEDIUMTEXT NULL,
  tamano_bytes INT UNSIGNED NULL,
  huella_sha256 CHAR(64) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_archivo_exportado),
  CONSTRAINT fk_archivo_reporte FOREIGN KEY (id_reporte_generado) REFERENCES reporte_generado(id_reporte_generado)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consentimiento_adulto_mayor (
  id_consentimiento_adulto_mayor BIGINT NOT NULL AUTO_INCREMENT,
  id_adulto_mayor BIGINT NOT NULL,
  tipo_consentimiento ENUM('tratamiento_datos','evaluacion_funcional','plan_ejercicio','investigacion','otro') NOT NULL,
  estado ENUM('vigente','revocado','vencido','pendiente') NOT NULL DEFAULT 'pendiente',
  otorgado_por_nombre VARCHAR(160) NULL,
  otorgado_por_documento VARCHAR(60) NULL,
  fecha_otorgamiento DATE NULL,
  fecha_vencimiento DATE NULL,
  observaciones TEXT NULL,
  registrado_por BIGINT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_consentimiento_adulto_mayor),
  CONSTRAINT fk_consentimiento_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_consentimiento_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria_cambio (
  id_auditoria_cambio BIGINT NOT NULL AUTO_INCREMENT,
  tabla_afectada VARCHAR(120) NOT NULL,
  id_registro_afectado BIGINT NOT NULL,
  accion ENUM('crear','actualizar','inactivar','reactivar','eliminar') NOT NULL,
  valores_anteriores JSON NULL,
  valores_nuevos JSON NULL,
  realizado_por BIGINT NULL,
  direccion_ip VARCHAR(45) NULL,
  agente_usuario VARCHAR(255) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_auditoria_cambio),
  KEY idx_auditoria_tabla_registro (tabla_afectada, id_registro_afectado, creado_en),
  CONSTRAINT fk_auditoria_cambio_usuario FOREIGN KEY (realizado_por) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria_acceso_dato (
  id_auditoria_acceso_dato BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NULL,
  id_adulto_mayor BIGINT NULL,
  tipo_dato ENUM('personal','clinico','sft','plan','reporte','otro') NOT NULL,
  accion ENUM('consultar','exportar','descargar','compartir') NOT NULL,
  resultado ENUM('permitido','denegado') NOT NULL,
  motivo VARCHAR(255) NULL,
  direccion_ip VARCHAR(45) NULL,
  agente_usuario VARCHAR(255) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_auditoria_acceso_dato),
  CONSTRAINT fk_auditoria_acceso_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_auditoria_acceso_adulto_mayor FOREIGN KEY (id_adulto_mayor) REFERENCES adulto_mayor(id_adulto_mayor)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria_autenticacion (
  id_auditoria_autenticacion BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NULL,
  correo VARCHAR(255) NOT NULL,
  accion ENUM('login_exitoso','login_fallido','refresh','logout') NOT NULL,
  resultado ENUM('exitoso','fallido') NOT NULL,
  motivo VARCHAR(255) NULL,
  direccion_ip VARCHAR(45) NULL,
  agente_usuario VARCHAR(255) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_auditoria_autenticacion),
  CONSTRAINT fk_auditoria_autenticacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
