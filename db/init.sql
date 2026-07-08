-- =====================================================================
-- Script inicial de la base de datos SFFE (Sistema de Flujo Fronterizo
-- Eficiente). Prototipo académico DuocUC — No es un sistema oficial del
-- Estado de Chile.
--
-- Se ejecuta automáticamente la primera vez que arranca el contenedor MySQL.
-- En desarrollo el esquema también lo mantiene Hibernate (ddl-auto: update),
-- pero estas sentencias replican fielmente las entidades JPA para que la BD
-- exista y quede documentada con los MISMOS nombres de tabla y columnas.
-- Por eso se usa CREATE TABLE IF NOT EXISTS: si Hibernate ya creó las tablas
-- no hay conflicto, y si MySQL arranca primero quedan listas.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sffe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sffe;

-- ---------------------------------------------------------------------
-- usuarios  (entidad Usuario) — RF01
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  identificador  VARCHAR(30) NOT NULL,               -- RUT, pasaporte, cédula extranjera o código TEMP-...
  tipo_documento ENUM('RUT','PASAPORTE','CEDULA_EXTRANJERA','SIN_DOCUMENTO') NOT NULL DEFAULT 'RUT',
  correo      VARCHAR(100) NOT NULL,
  contrasena  VARCHAR(255) NOT NULL,                 -- BCrypt, nunca texto plano
  nacionalidad VARCHAR(50) NOT NULL,
  telefono    VARCHAR(20) NOT NULL,
  rol         ENUM('PASAJERO','FUNCIONARIO_ADUANA','FUNCIONARIO_PDI','FUNCIONARIO_SAG','ADMIN') NOT NULL,
  fecha_nacimiento DATE,                        -- RF01: obligatoria solo para pasajeros autoregistrados
  carnet_identidad_path VARCHAR(255),           -- RF01: obligatorio salvo SIN_DOCUMENTO
  papeles_antecedentes_path VARCHAR(255),       -- RF01: obligatorio salvo SIN_DOCUMENTO
  correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  token_verificacion_correo VARCHAR(64),
  token_verificacion_expira DATETIME,
  token_reset_password VARCHAR(64),
  token_reset_expira DATETIME,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_identificador UNIQUE (identificador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- viajes  (entidad Viaje) — RF02, RF04
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viajes (
  id_viaje      INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT NOT NULL,
  fecha_ingreso DATE NOT NULL,
  destino       VARCHAR(100) NOT NULL,
  pais_origen      VARCHAR(100),
  paso_fronterizo  VARCHAR(100),
  motivo_viaje  VARCHAR(200),
  estado        ENUM('PENDIENTE','APROBADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  motivo_rechazo TEXT,                                  -- RF05: detalle de Aduana, visible en el ticket del pasajero
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_viajes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- menores  (entidad Menor) — RF02
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menores (
  id_menor              INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje              INT NOT NULL,
  nombre                VARCHAR(100) NOT NULL,
  rut                   VARCHAR(12)  NOT NULL,
  fecha_nacimiento      DATE NOT NULL,
  requiere_autorizacion BOOLEAN NOT NULL DEFAULT FALSE,
  carnet_identidad_path VARCHAR(255) NOT NULL,
  papeles_antecedentes_path VARCHAR(255) NOT NULL,
  permiso_notarial_path VARCHAR(255),           -- obligatorio solo si requiere_autorizacion = TRUE
  CONSTRAINT fk_menores_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- mascotas  (entidad Mascota) — RF02   (relación 1:N con viaje)
-- Visible para toda fiscalización (Aduana, PDI, SAG).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mascotas (
  id_mascota                INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje                  INT NOT NULL,
  tipo_animal               VARCHAR(50) NOT NULL,
  numero_chip               VARCHAR(50) NOT NULL,
  certificado_chip_path     VARCHAR(255) NOT NULL,
  carnet_vacunacion_path    VARCHAR(255) NOT NULL,
  CONSTRAINT fk_mascotas_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- vehiculos  (entidad Vehiculo) — RF03   (relación 1:N con viaje:
-- hasta un vehículo principal y un carro de arrastre/remolque)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo          INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje             INT NOT NULL,
  patente              VARCHAR(10) NOT NULL,
  marca                VARCHAR(50),                        -- opcional para el remolque
  modelo               VARCHAR(50),                        -- opcional para el remolque
  anio                 INT,
  es_remolque          BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE si es carro de arrastre/remolque
  vehiculo_principal_id INT,                               -- vehículo principal al que se vincula el remolque (nullable)
  permiso_circulacion_path VARCHAR(255) NOT NULL,          -- RF03: obligatorio, visible para Aduana y PDI
  CONSTRAINT fk_vehiculos_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje),
  CONSTRAINT fk_vehiculos_principal FOREIGN KEY (vehiculo_principal_id) REFERENCES vehiculos (id_vehiculo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- declaraciones_sag  (entidad DeclaracionSag) — RF02   (relación 1:1 con viaje)
-- Reúne la declaración SAG (productos regulados) y la de Aduanas
-- (divisas y mercancías que exceden la franquicia del viajero).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS declaraciones_sag (
  id_declaracion     INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje           INT NOT NULL,
  declara_productos  BOOLEAN NOT NULL DEFAULT FALSE,
  productos          TEXT,                                 -- listado SAG serializado como JSON
  declara_divisas    BOOLEAN NOT NULL DEFAULT FALSE,       -- Aduanas: efectivo/equivalentes > USD 10.000
  monto_divisas      DECIMAL(12,2),                        -- monto declarado (nullable)
  moneda_divisas     VARCHAR(10),                          -- USD, EUR, etc. (nullable)
  declara_mercancias BOOLEAN NOT NULL DEFAULT FALSE,       -- Aduanas: mercancías que exceden la franquicia
  detalle_mercancias TEXT,                                 -- descripción (nullable)
  estado             ENUM('PENDIENTE','VALIDADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  firma_digital      VARCHAR(255),
  fecha              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_declaraciones_sag_viaje UNIQUE (id_viaje),
  CONSTRAINT fk_declaraciones_sag_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- codigos_qr  (entidad CodigoQr) — RF04, RF05   (relación 1:1 con viaje)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_qr (
  id_qr            INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje         INT NOT NULL,
  codigo           VARCHAR(255) NOT NULL,
  fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado           ENUM('ACTIVO','USADO','EXPIRADO') NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT uq_codigos_qr_viaje  UNIQUE (id_viaje),
  CONSTRAINT uq_codigos_qr_codigo UNIQUE (codigo),
  CONSTRAINT fk_codigos_qr_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- auditoria_logs  (entidad AuditoriaLog) — RF09 (básico en el MVP)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id_log     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,                                    -- nullable: acciones sin sesión
  ip         VARCHAR(45),
  accion     VARCHAR(100) NOT NULL,
  modulo     VARCHAR(50)  NOT NULL,
  codigo_qr  VARCHAR(255),                             -- RF05: QR fiscalizado (nullable)
  identificador_enmascarado VARCHAR(30),               -- RF05/RNF10: pasajero enmascarado (nullable)
  observaciones TEXT,                                  -- RF05: motivo (obligatorio en RECHAZADO/SOSPECHA)
  fecha      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_logs_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Datos semilla
-- ---------------------------------------------------------------------
-- Usuario administrador inicial para poder ingresar al sistema.
-- Contraseña en texto plano: admin123  (hash BCrypt, coste 10).
-- INSERT IGNORE evita duplicar si el script se vuelve a ejecutar.
-- nacionalidad/telefono se incluyen explícitamente: son NOT NULL sin
-- default, y omitirlos rompe la carga inicial en MySQL con sql_mode
-- estricto (el comportamiento por defecto de la imagen mysql:8).
-- fecha_nacimiento/carnet_identidad_path/papeles_antecedentes_path quedan
-- NULL: estas cuentas semilla no pasan por el formulario público de
-- registro de pasajero (RF01) que exige esos campos.
-- =====================================================================
INSERT IGNORE INTO usuarios (nombre, identificador, tipo_documento, correo, contrasena, nacionalidad, telefono, rol) VALUES
  ('Administrador SFFE', '11111111-1', 'RUT', 'admin@sffe.cl',
   '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'Chilena', '+56900000000', 'ADMIN'),

  ('Usuario de Prueba', '12345678-5', 'RUT', 'user@prueba.cl',
   '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'Chilena', '+56900000001', 'PASAJERO'),

  ('Juan Pérez', '21013281-3', 'RUT', 'juan.perez@prueba.cl',
   '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'Chilena', '+56900000002', 'FUNCIONARIO_ADUANA'),

  ('María González', '13705281-4', 'RUT', 'maria.gonzalez@prueba.cl',
    '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'Chilena', '+56900000003', 'FUNCIONARIO_PDI'),

  ('Carlos Muñoz', '10112374-K', 'RUT', 'carlos.munoz@prueba.cl',
    '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'Chilena', '+56900000004', 'FUNCIONARIO_SAG');