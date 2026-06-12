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
  rut         VARCHAR(12)  NOT NULL,
  correo      VARCHAR(100) NOT NULL,
  contrasena  VARCHAR(255) NOT NULL,                 -- BCrypt, nunca texto plano
  nacionalidad VARCHAR(50) NOT NULL,
  telefono    VARCHAR(20) NOT NULL,
  rol         ENUM('PASAJERO','FUNCIONARIO_ADUANA','FUNCIONARIO_PDI','FUNCIONARIO_SAG','ADMIN') NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_rut UNIQUE (rut)
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
  CONSTRAINT fk_menores_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- vehiculos  (entidad Vehiculo) — RF03   (relación 1:1 con viaje)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje    INT NOT NULL,
  patente     VARCHAR(10) NOT NULL,
  marca       VARCHAR(50) NOT NULL,
  modelo      VARCHAR(50) NOT NULL,
  anio        INT,
  CONSTRAINT uq_vehiculos_viaje UNIQUE (id_viaje),
  CONSTRAINT fk_vehiculos_viaje FOREIGN KEY (id_viaje) REFERENCES viajes (id_viaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- declaraciones_sag  (entidad DeclaracionSag) — RF02   (relación 1:1 con viaje)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS declaraciones_sag (
  id_declaracion    INT AUTO_INCREMENT PRIMARY KEY,
  id_viaje          INT NOT NULL,
  declara_productos BOOLEAN NOT NULL DEFAULT FALSE,
  productos         TEXT,                                  -- listado serializado como JSON
  estado            ENUM('PENDIENTE','VALIDADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  firma_digital     VARCHAR(255),
  fecha             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  fecha      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_logs_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Datos semilla
-- ---------------------------------------------------------------------
-- Usuario administrador inicial para poder ingresar al sistema.
-- Contraseña en texto plano: admin123  (hash BCrypt, coste 10).
-- INSERT IGNORE evita duplicar si el script se vuelve a ejecutar.
-- =====================================================================
INSERT IGNORE INTO usuarios (nombre, rut, correo, contrasena, rol) VALUES
  ('Administrador SFFE', '11111111-1', 'admin@sffe.cl',
   '$2b$10$55YXlOEFWqAOQcCXNijfvuOgMjcdamaSWXbSvXPT5xbNJ3R0YtW5S', 'ADMIN');
