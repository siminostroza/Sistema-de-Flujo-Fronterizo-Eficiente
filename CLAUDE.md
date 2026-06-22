Eres el asistente de desarrollo del proyecto SFFE (Sistema de Flujo 
Fronterizo Eficiente), un prototipo académico desarrollado por 
estudiantes de Ingeniería en Informática de DuocUC - Escuela de 
Informática y Telecomunicaciones, en el contexto de la asignatura 
RQY1102 (Ingeniería de Software).

ADVERTENCIA IMPORTANTE: Este es un prototipo estudiantil con fines 
académicos. En TODA la aplicación debe aparecer de forma visible el 
aviso: "Prototipo desarrollado por estudiantes de DuocUC — No es un 
sistema oficial del Estado de Chile".

---

## DESCRIPCIÓN DEL SISTEMA

El SFFE busca resolver la ineficiencia operativa en pasos fronterizos 
terrestres de Chile (principalmente Los Libertadores), caracterizada 
por tiempos de espera de 8 a 20 horas, colapso de infraestructura con 
aumentos de flujo de hasta 180%, procesos manuales y sistemas 
desintegrados entre Aduanas, PDI y SAG.

El sistema digitaliza y automatiza el registro de trámites fronterizos 
para que los pasajeros lleguen al paso con todo pre-validado y los 
funcionarios solo escaneen un código QR para autorizar el ingreso.

---

## STACK TECNOLÓGICO

- Backend: Spring Boot (monolito modular, Java 21)
- Frontend: React 18 + Vite + Tailwind CSS v3
- Base de datos: MySQL 8 (nombre de BD: sffe)
- Orquestación: docker-compose (tres servicios: frontend, backend, db)
- Comunicación: REST API con JSON, CORS configurado
- Autenticación: JWT (Spring Security)
- Build del frontend: Vite
- Librería QR: zxing (backend) / react-qr-code (frontend)
- Documentación API: Swagger / OpenAPI (springdoc-openapi)
- Paquete base Java: cl.duoc.sffe

---

## IDENTIDAD VISUAL OBLIGATORIA

### Paleta oficial del Gobierno de Chile
Fuente: framework.digital.gob.cl/colors.html

--gov-primary:       #006FB3  → botones principales, íconos, links activos
--gov-primary-dark:  #004A80  → hover de botones primarios
--gov-primary-light: #E6F3FB  → fondos de cards informativas y alertas
--gov-secondary:     #FE6565  → acciones secundarias, badges de alerta
--gov-tertiary:      #0A132D  → header principal, banda GOB.CL, títulos
--gov-accent:        #A8B7C7  → bordes, separadores, texto baja jerarquía
--gov-neutral:       #EEEEEE  → fondos de inputs, líneas divisoras
--gov-gray-a:        #4A4A4A  → texto párrafos y labels de formulario
--gov-gray-b:        #8A8A8A  → texto secundario y subtítulos
--gov-black:         #111111  → títulos principales y valores de datos
--gov-green:         #2D717C  → botón "Autorizar Ingreso", estados aprobados

Estados semánticos:
- PENDIENTE  → fondo #FFF8E1, texto #795500
- APROBADO   → fondo #E8F5E9, texto #1B5E20
- RECHAZADO  → fondo #FFEBEE, texto #B71C1C

Tipografía: Inter (Google Fonts), fallback sans-serif

### Estructura obligatoria del header (toda página)
1. Banda superior con "GOB.CL" sobre fondo #0A132D
2. Logo/nombre SFFE
3. Indicador "Servicio Nacional de Aduanas · Gobierno de Chile"
4. Banner visible: "⚠️ Prototipo académico DuocUC — No es un sistema oficial"

---

## USUARIOS DEL SISTEMA Y ROLES

1. PASAJERO
   - Experiencia técnica baja/media, usa el sistema desde móvil
   - Acciones: registrarse, crear expediente de viaje, declarar 
     productos SAG, registrar vehículo, consultar estado, obtener QR

2. FUNCIONARIO_ADUANA
   - Fiscalización completa: escanear QR, autorizar/denegar ingreso,
     ver expediente consolidado, historial del turno, monitoreo 
     (lectura), reportes básicos

3. FUNCIONARIO_PDI
   - Fiscalización acotada: escanear QR, validar identidad del 
     pasajero, historial del turno

4. FUNCIONARIO_SAG
   - Fiscalización acotada: escanear QR, validar declaración SAG,
     historial del turno

5. ADMIN
   - Gestión del sistema: historial completo, monitoreo con control,
     reportes PDF/Excel (RF06), gestión de usuarios y roles,
     logs de auditoría (RF09)

---

## SEPARACIÓN DE VISTAS — CRÍTICO

El frontend tiene DOS interfaces completamente separadas.
NUNCA mezclar en el mismo layout ni en el mismo router.

App.tsx decide qué renderizar según el rol del JWT:
- rol PASAJERO         → <AppPasajero />
- roles FUNCIONARIO_*  → <AppFuncionario />
- rol ADMIN            → <AppFuncionario /> con módulos extra visibles

### Vista Pasajero (mobile-first)
- Diseño: una columna, max-width 520px centrado
- Navegación: bottom navigation bar (4 pestañas)
- Pantallas disponibles:
    Login → Dashboard → RegistroViaje → RegistroVehiculo →
    DeclaracionSag → EstadoTramite (QR) → Perfil
- El pasajero NUNCA ve ni puede acceder a rutas de fiscalización

### Vista Funcionario (desktop-first)
- Diseño: grid sidebar 220px fijo + contenido principal
- Navegación: sidebar izquierdo con secciones por rol
- Login: ruta /funcionario/login, incluye selector de institución
  (Aduana / PDI / SAG / Admin) visible antes del formulario
- Pantallas disponibles según rol:
    Fiscalizacion (todos) → Historial (todos) →
    Monitoreo (Aduana + Admin) → Admin (solo ADMIN)

### Permisos por rol dentro del panel funcionario
| Módulo                        | ADUANA | PDI | SAG | ADMIN |
|-------------------------------|--------|-----|-----|-------|
| Escanear QR y ver expediente  |   ✅   | ✅  | ✅  |  ✅   |
| Autorizar / Denegar ingreso   |   ✅   | ❌  | ❌  |  ❌   |
| Validar identidad (PDI)       |   ❌   | ✅  | ❌  |  ❌   |
| Validar declaración SAG       |   ❌   | ❌  | ✅  |  ❌   |
| Marcar sospecha               |   ✅   | ✅  | ✅  |  ❌   |
| Historial del turno           |   ✅   | ✅  | ✅  |  ✅   |
| Monitoreo del paso (RF10)     | Lectura| ❌  | ❌  | Control|
| Reportes PDF/Excel (RF06)     |   ✅   | ❌  | ❌  |  ✅   |
| Gestión de usuarios           |   ❌   | ❌  | ❌  |  ✅   |
| Logs de auditoría (RF09)      |   ❌   | ❌  | ❌  |  ✅   |

---

## ENMASCARAMIENTO DE RUT (RNF10)

En TODA vista de funcionario, el RUT del pasajero se muestra como:
*****-X  (nunca el RUT completo)
El pasajero solo ve su propio RUT en su portal personal.

---

## MODELO DE DATOS

Paquete base: cl.duoc.sffe
BD: sffe (no sffe_db)

Entidades JPA implementadas en model/:

usuarios
  - id_usuario (PK, Integer, auto_increment)
  - nombre (varchar 100)
  - identificador (varchar 30, unique) — RUT, pasaporte, cédula extranjera
    o código temporal TEMP-xxxxxxxxxxxxx-XXXX (ver "DECISIONES DE SESIÓN 4.2")
  - tipo_documento (enum: RUT, PASAPORTE, CEDULA_EXTRANJERA, SIN_DOCUMENTO,
    default RUT)
  - correo (varchar 100)
  - contrasena (varchar 255, bcrypt)
  - nacionalidad (varchar 50, nullable)
  - telefono (varchar 20, nullable)
  - rol (enum: PASAJERO, FUNCIONARIO_ADUANA, FUNCIONARIO_PDI,
         FUNCIONARIO_SAG, ADMIN)
  - created_at (timestamp, @CreationTimestamp)
  Nota: no existe entidad Pasajero separada. Los campos 
  nacionalidad y telefono viven directamente en usuarios.

viajes
  - id_viaje (PK, Integer, auto_increment)
  - id_usuario (FK → usuarios, @ManyToOne)
  - fecha_ingreso (date)
  - destino (varchar 100)
  - pais_origen (varchar 100, nullable) — país de origen real del pasajero
  - paso_fronterizo (varchar 100, nullable) — paso fronterizo elegido
    (Los Libertadores, Chungará, Pino Hachado, Pehuenche)
  - motivo_viaje (varchar 200)
  - estado (enum: PENDIENTE, APROBADO, RECHAZADO, default PENDIENTE)
  - created_at (timestamp, @CreationTimestamp)

menores
  - id_menor (PK, Integer)
  - id_viaje (FK → viajes, @ManyToOne)
  - nombre (varchar 100)
  - rut (varchar 12)
  - fecha_nacimiento (date)
  - requiere_autorizacion (boolean)

vehiculos
  - id_vehiculo (PK, Integer)
  - id_viaje (FK → viajes, @OneToOne, unique)
  - patente (varchar 10)
  - marca (varchar 50)
  - modelo (varchar 50)
  - anio (int)

declaraciones_sag
  - id_declaracion (PK, Integer)
  - id_viaje (FK → viajes, @OneToOne, unique)
  - declara_productos (boolean)
  - productos (text, JSON)
  - estado (enum: PENDIENTE, VALIDADO, RECHAZADO, default PENDIENTE)
  - firma_digital (varchar 255)
  - fecha (timestamp, @CreationTimestamp)

codigos_qr
  - id_qr (PK, Integer)
  - id_viaje (FK → viajes, @OneToOne, unique)
  - codigo (varchar 255, unique)
  - fecha_generacion (timestamp, @CreationTimestamp)
  - estado (enum: ACTIVO, USADO, EXPIRADO, default ACTIVO)

auditoria_logs
  - id_log (PK, Integer)
  - id_usuario (FK → usuarios, nullable)
  - ip (varchar 45)
  - accion (varchar 100)
  - modulo (varchar 50)
  - fecha (timestamp, @CreationTimestamp)

Enums separados: Rol, TipoDocumento, EstadoViaje, EstadoDeclaracion, EstadoQr
Todos persistidos con @Enumerated(EnumType.STRING)
Lombok: @Getter/@Setter (no @Data para evitar problemas con lazy loading)

---

## ESTRUCTURA DE CARPETAS DEL PROYECTO

sffe/
├── docker-compose.yml
├── .env.example
├── README.md
├── docs/
│   └── referencia/
│       ├── SFFE_Vista_Pasajero.html     ← referencia visual portal pasajero
│       └── SFFE_Vista_Funcionario.html  ← referencia visual panel funcionario
│
├── backend/                        ← Spring Boot monolito
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/cl/duoc/sffe/
│       ├── SffeApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   ├── CorsConfig.java
│       │   └── JwtConfig.java
│       ├── model/                  ← Entidades JPA
│       │   ├── Usuario.java
│       │   ├── TipoDocumento.java  ← enum RUT/PASAPORTE/CEDULA_EXTRANJERA/SIN_DOCUMENTO
│       │   ├── Viaje.java
│       │   ├── Menor.java
│       │   ├── Vehiculo.java
│       │   ├── DeclaracionSag.java
│       │   ├── CodigoQr.java
│       │   └── AuditoriaLog.java
│       ├── repository/             ← Interfaces JPA Repository
│       ├── service/                ← Lógica de negocio
│       ├── controller/             ← REST endpoints
│       │   ├── AuthController.java
│       │   ├── ViajeController.java
│       │   ├── QrController.java
│       │   └── FiscalizacionController.java
│       ├── dto/                    ← Request/Response objects
│       ├── security/               ← JWT filters y utils
│       ├── util/                   ← DocumentoValidator.java, MaskUtil.java
│       └── exception/              ← Manejo de excepciones
│
├── frontend/                       ← React 18 + Vite + Tailwind
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tailwind.config.js          ← Colores gov-* (theme.extend.colors)
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 ← Router principal, separa vistas por rol
│       ├── index.css               ← Directivas @tailwind + fuente Inter
│       ├── components/
│       │   ├── layout/
│       │   │   ├── TopBar.tsx      ← Banda GOB.CL
│       │   │   ├── Banner.tsx      ← Banner prototipo DuocUC
│       │   │   └── Footer.tsx
│       │   └── ui/                 ← Componentes reutilizables
│       │       └── DocumentoFields.tsx ← Selector tipo doc + input identificador
│       ├── pages/
│       │   ├── Login.tsx           ← Login + registro pasajero (toggle)
│       │   ├── LoginFuncionario.tsx← Login funcionario con selector de rol
│       │   ├── Dashboard.tsx       ← Dashboard pasajero
│       │   ├── RegistroViaje.tsx
│       │   ├── RegistroVehiculo.tsx
│       │   ├── DeclaracionSag.tsx
│       │   ├── Perfil.tsx          ← Datos de cuenta (tipo doc + identificador)
│       │   ├── EstadoTramite.tsx   ← Vista QR del pasajero
│       │   ├── FiscalizacionQr.tsx ← Panel principal del funcionario
│       │   ├── Historial.tsx       ← Historial del turno
│       │   ├── Monitoreo.tsx       ← Monitoreo del paso (RF10)
│       │   └── Admin.tsx           ← Solo rol ADMIN
│       ├── services/
│       │   ├── api.ts              ← Instancia axios + interceptor JWT
│       │   ├── authService.ts
│       │   ├── viajeService.ts
│       │   ├── qrService.ts
│       │   └── fiscalizacionService.ts
│       ├── utils/
│       │   ├── rut.ts              ← Validación RUT chileno (módulo 11)
│       │   └── documento.ts        ← Tipos/validación/etiquetas por tipo de documento
│       └── context/
│           └── AuthContext.tsx     ← Estado global de sesión, rol e identificador
│
└── db/
    └── init.sql                    ← Script MySQL con tablas y usuario admin

---

## ENDPOINTS REST A IMPLEMENTAR (MVP)

POST   /api/auth/login              ← Login, devuelve JWT
POST   /api/auth/register           ← Registro de pasajero

POST   /api/viajes                  ← Crear expediente de viaje
GET    /api/viajes/{id}             ← Consultar estado
GET    /api/viajes/mis-viajes       ← Viajes del usuario autenticado
PUT    /api/viajes/{id}             ← Actualizar viaje

POST   /api/viajes/{id}/menores     ← Agregar menor al viaje
POST   /api/viajes/{id}/vehiculo    ← Registrar vehículo
POST   /api/viajes/{id}/sag         ← Guardar declaración SAG

GET    /api/qr/{id_viaje}           ← Obtener/generar QR del viaje
GET    /api/qr/validar/{codigo}     ← Validar QR (para funcionario)

GET    /api/fiscalizacion/{codigo}  ← Info consolidada del viajero
PUT    /api/fiscalizacion/{codigo}/autorizar

GET    /api/admin/reportes          ← Solo rol ADMIN

---

## REQUISITOS FUNCIONALES DEL MVP

RF01 — Gestión de Acceso y Perfil: registro con validación de RUT,
       autenticación JWT, mensajes de error específicos.
RF02 — Gestión de Trámites de Viaje: expediente con itinerario,
       Declaración Jurada SAG y documentación de menores.
RF03 — Registro y Documentación de Vehículo: validar patente y modelo,
       generar documento de entrada/salida automáticamente.
RF04 — Seguimiento y Consulta de Estado: panel con estado del trámite
       (PENDIENTE / APROBADO / RECHAZADO) y acceso al código QR.
RF05 — Interfaz de Control Fronterizo: funcionario escanea QR y ve
       información consolidada del viajero y su grupo.

FUERA DEL MVP (postergar): RF07 integración PDI/SAG/Argentina real,
RF08 cobros, RF09 logs completos, RF10 alertas.

---

## REQUISITOS NO FUNCIONALES APLICABLES AL MVP

RNF03: toda comunicación usa HTTPS (HTTP en local es aceptable).
RNF08: funcional en Chrome, Firefox y Edge actuales.
RNF09: usuario nuevo completa el trámite en menos de 5 minutos.
RNF10: enmascarar identificador en vistas de funcionario
       (*****-X para RUT; ver "DECISIONES DE SESIÓN 4.2" para
       pasaporte/cédula extranjera/sin documento).

---

## FLUJO PRINCIPAL DEL SISTEMA

1.  Pasajero se registra con tipo de documento + identificador
    (RUT, pasaporte, cédula extranjera o sin documento) + correo + contraseña
2.  Inicia sesión → recibe JWT con rol PASAJERO
3.  Crea expediente de viaje (fecha, destino, motivo)
4.  Opcionalmente registra vehículo y/o menores
5.  Completa Declaración Jurada SAG
6.  Sistema genera Código QR único vinculado al expediente
7.  En la frontera: funcionario inicia sesión → recibe JWT con su rol
8.  Funcionario escanea el QR del pasajero
9.  Sistema muestra expediente consolidado con datos enmascarados
10. Funcionario autoriza o rechaza según su rol
11. Estado del trámite se actualiza en tiempo real

---

## DOCKER-COMPOSE

Tres servicios:
- db: MySQL 8, puerto 3306, volumen persistente, init.sql al arrancar
- backend: Spring Boot, puerto 8080, depende de db con healthcheck
- frontend: Nginx (producción) o Vite dev server, puerto 3000,
  proxy /api → backend

Variables de entorno en .env:
  MYSQL_ROOT_PASSWORD, MYSQL_DATABASE=sffe,
  MYSQL_USER, MYSQL_PASSWORD,
  JWT_SECRET, JWT_EXPIRATION=86400000

---

## ORDEN DE CONSTRUCCIÓN (sesión por sesión)

✅ Sesión 1: Scaffolding completo
✅ Sesión 2: Entidades JPA + enums + repositorios + init.sql
✅ Sesión 3 (Opus): Autenticación JWT — SecurityConfig, JwtUtil,
   JwtAuthenticationFilter, CorsConfig, AuthController, AuthService,
   DTOs, AuthContext, Login.tsx pasajero y LoginFuncionario.tsx.
   Tailwind v3 instalado y configurado con colores gov-* centralizados.
✅ Sesión 4 (Sonnet): Módulo de viaje — ViajeController, ViajeService,
   RegistroViaje.tsx con flujo: viaje → menores → vehículo → SAG.
   Ver "DECISIONES DE SESIÓN 4" para detalles a reutilizar en sesiones
   posteriores (QR, fiscalización).
✅ Sesión 4.2 (Sonnet): Soporte multi-documento — TipoDocumento,
   identificador (RUT/pasaporte/cédula extranjera/sin documento),
   DocumentoValidator, MaskUtil, Login.tsx con toggle login/registro,
   Perfil.tsx. Ver "DECISIONES DE SESIÓN 4.2" para el modelo de
   identificación que usará el QR (Sesión 5) y la fiscalización
   (Sesión 6).
✅ Sesión 5 (Sonnet): Generación de QR — QrService con ZXing,
   QrController, EstadoTramite.tsx con visualización del QR,
   BottomNav.tsx. Ver "DECISIONES DE SESIÓN 5" para detalles a
   reutilizar en la Sesión 6 (fiscalización).
✅ Sesión 6 (Opus): Vista del funcionario — FiscalizacionService,
   FiscalizacionController, FiscalizacionQr.tsx con panel consolidado
   separado por rol, FuncionarioLayout con sidebar por rol, Historial,
   Monitoreo y Admin. Ver "DECISIONES DE SESIÓN 6".
✅ Sesión 6.1 (Opus): Refactorización de negocio — wizard lineal de 5
   pasos (RegistroViaje.tsx + WizardStepper.tsx), modelo 1:N de vehículos
   con carro de arrastre/remolque, declaración de Aduanas (divisas y
   mercancías) junto a la SAG, Dashboard convertido en Historial de
   viajes. Ver "DECISIONES DE SESIÓN 6.1".
✅ Sesión 6.2 (Sonnet): Fiscalización multi-rol sobre un mismo QR —
   validarQR() visible sin importar EstadoQr, resolver() exige ACTIVO
   solo para APROBADO/RECHAZADO, banner "ya autorizado por Aduana" en
   FiscalizacionQr.tsx. Ver "DECISIONES DE SESIÓN 6.2".
⏳ Sesión 7 (Haiku): Polish — identidad visual gobierno Chile,
   banner DuocUC, responsive, pruebas extremo a extremo

---

## DECISIONES DE SESIÓN 4 (Módulo de viaje)

- El selector "Paso Fronterizo" de RegistroViaje.tsx (Los Libertadores,
  Chungará, Pino Hachado, Pehuenche) se guarda en la columna
  `paso_fronterizo` (varchar 100, nullable). DTO: `ViajeRequest.pasoFronterizo`
  (obligatorio). La columna `pais_origen` queda separada y reservada para
  el país de origen real del pasajero (Chile, Argentina, etc.); por ahora
  es opcional (`@Size` sin `@NotBlank`) porque ninguna pantalla la captura
  todavía.
- Flujo multi-paso (RegistroViaje → RegistroVehiculo → DeclaracionSag)
  comparte el expediente activo vía `localStorage['sffe_id_viaje_activo']`
  (helpers `getIdViajeActivo`/`setIdViajeActivo` en viajeService.ts).
  Dashboard también lo usa para elegir qué viaje mostrar.
- Declaración SAG: las 3 preguntas booleanas (vegetal/animal/alimentos)
  más el campo `detalle` se serializan como JSON dentro de la columna
  `productos` (TEXT). `declara_productos = vegetal || animal || alimentos`.
- `POST /api/viajes/{id}/vehiculo` y `/sag` son upsert sobre relaciones
  1:1 (buscan por `id_viaje`, crean si no existen, actualizan si existen).
- Toda operación sobre un viaje valida que `id_usuario` del expediente
  coincida con el usuario del JWT (`Authentication.getName()` = RUT);
  si no existe el viaje → 404, si no es del usuario → 403
  (`ViajeException` + `GlobalExceptionHandler`).
- Módulo "Mi Código QR" del Dashboard queda deshabilitado
  ("próximamente") hasta la Sesión 5. No se creó BottomNav ni
  Perfil/EstadoTramite todavía — quedan pendientes para sesiones
  posteriores cuando esas rutas existan.

---

## DECISIONES DE SESIÓN 4.2 (Soporte multi-documento)

- `usuarios.rut` se renombró a `usuarios.identificador` (varchar 30,
  UNIQUE) + nueva columna `tipo_documento`
  (enum RUT/PASAPORTE/CEDULA_EXTRANJERA/SIN_DOCUMENTO, default RUT).
  Una sola restricción UNIQUE cubre los 4 tipos: para RUT/PASAPORTE/
  CEDULA_EXTRANJERA la unicidad la garantiza la columna; para
  SIN_DOCUMENTO el código `TEMP-{timestamp}-{4 alfanum}` es único por
  construcción (timestamp en milisegundos + sufijo aleatorio).
- Normalización única: `DocumentoValidator.normalizar()` (backend) y
  `normalizarIdentificador()` (frontend, en `utils/documento.ts`)
  aplican el mismo criterio — trim, quitar puntos/espacios, mayúsculas —
  para RUT/PASAPORTE/CEDULA_EXTRANJERA, tanto en registro como en login.
  SIN_DOCUMENTO no se normaliza (ya se genera en formato final). Esto
  significa que el RUT siempre se guarda y compara con dígito
  verificador en MAYÚSCULA ('K', no 'k'); el seed de Carlos Muñoz en
  init.sql se actualizó de `10112374-k` a `10112374-K` para mantener
  consistencia.
- Validaciones por tipo (`DocumentoValidator` backend /
  `validarIdentificador` frontend): RUT usa el algoritmo módulo 11
  existente (`utils/rut.ts`); PASAPORTE y CEDULA_EXTRANJERA aceptan
  alfanumérico de 6-20 y 5-15 caracteres respectivamente; SIN_DOCUMENTO
  no requiere input del usuario (se autogenera en el backend).
- `AuthService.register()` valida formato según `tipoDocumento`, genera
  el identificador temporal para SIN_DOCUMENTO, y verifica unicidad con
  `existsByIdentificador` (409 "Ya existe una cuenta registrada con este
  documento" si ya existe). `login()` normaliza el identificador
  ingresado y busca con `findByIdentificador`
  (error genérico "Identificador o contraseña incorrectos").
- `RegisterResponse` ahora incluye `identificador` (no estaba en el
  alcance original, pero es imprescindible para SIN_DOCUMENTO: es el
  único momento en que el usuario ve su código TEMP-xxxx generado).
  Login.tsx muestra ese código en el mensaje de éxito tras el registro.
- El JWT no cambió de estructura — solo se renombró semánticamente:
  el "subject" sigue siendo el valor único de login, ahora llamado
  "identificador" (`JwtUtil.extraerIdentificador`,
  `generarToken(identificador, rol)`). `ViajeService`/`ViajeController`
  renombraron sus parámetros `rut`→`identificador` por consistencia,
  sin cambios de comportamiento.
- `AuthContext.Sesion` ahora incluye `identificador` y `tipoDocumento`.
  `LoginResponse` del backend trae `tipoDocumento` pero NO
  `identificador` (por diseño, ver RUT enmascarado); el frontend
  construye `identificador` a partir del valor que el usuario tipeó en
  el formulario, pasado por `normalizarIdentificador()`.
- Nuevo patrón de UI: `Login.tsx` ahora tiene un toggle "Iniciar
  sesión" / "Crear cuenta" (antes solo tenía login; el registro estaba
  pendiente desde la Sesión 4). El selector de tipo de documento +
  input de identificador se extrajo a un componente reutilizable
  `components/ui/DocumentoFields.tsx` (props `modo: 'login'|'registro'`),
  usado en Login.tsx y LoginFuncionario.tsx. En modo registro +
  SIN_DOCUMENTO, el input se oculta y se muestra el mensaje "Se
  generará un código temporal. Presenta tu identidad al funcionario en
  la caseta."
- Nueva página `Perfil.tsx` + ruta `/perfil` (rol PASAJERO), enlazada
  desde el Dashboard ("Mi perfil"). Muestra nombre, tipo de documento e
  identificador SIN enmascarar — el pasajero ve sus propios datos
  completos; RNF10 (enmascarado) aplica solo en vistas de funcionario.
  Esto resuelve el pendiente de Sesión 4 ("no se creó Perfil todavía").
- `util/MaskUtil.java` (paquete `cl.duoc.sffe.util`, junto a
  `DocumentoValidator`) implementa `maskIdentificador(identificador, tipo)`:
  RUT → `*****-X`; PASAPORTE/CEDULA_EXTRANJERA → primeros 2 caracteres +
  `******` + último carácter; SIN_DOCUMENTO → `TEMP-****`. Su primer
  caller es `ExpedienteResponse.from()` (Sesión 5); la Sesión 6
  (FiscalizacionController) reutilizará el mismo `ExpedienteResponse`
  para las vistas de funcionario, ya enmascarado.

---

## DECISIONES DE SESIÓN 5 (Generación de QR)

- `QrService.generarQR(idViaje, identificador)` es **idempotente**:
  reutiliza el `CodigoQr` existente del viaje (relación 1:1) si está
  `ACTIVO`; si no existe o está `USADO`/`EXPIRADO`, genera un nuevo
  `codigo` (`UUID.randomUUID().toString()`) y lo deja `ACTIVO`. Exige
  que el viaje tenga `declaracion_sag` guardada (409 "Debes completar
  la Declaración Jurada SAG antes de generar tu código QR" si no).
- La imagen PNG del QR **no se persiste**: la tabla `codigos_qr` (según
  el modelo de datos) solo guarda `codigo`/`estado`/`fecha_generacion`,
  sin columna de imagen. `generarImagenBase64()` la genera on-the-fly
  en cada request con ZXing (`QRCodeWriter` 300x300 →
  `MatrixToImageWriter.writeToStream(..., "PNG", ...)` → Base64) a
  partir del `codigo` guardado, por lo que el QR resultante es siempre
  el mismo mientras el código no cambie.
- `GET /api/qr/{idViaje}` (rol PASAJERO) y
  `GET /api/qr/validar/{codigo}` (roles FUNCIONARIO_* y ADMIN) comparten
  el prefijo `/api/qr/**`; en vez de tocar `SecurityConfig` se usó
  `@PreAuthorize("hasRole(...)")` / `hasAnyRole(...)` por endpoint
  (ya habilitado por `@EnableMethodSecurity` desde la Sesión 3).
- `QrException` (+ handler en `GlobalExceptionHandler`) replica el
  patrón de `ViajeException`: 404 si el viaje/QR no existe, 403 si el
  expediente no es del usuario autenticado, 409 si falta la SAG o si
  el código QR validado no está `ACTIVO`.
- `ExpedienteResponse.from(viaje)` reutiliza los records anidados de
  `ViajeResponse` (`VehiculoInfo`, `SagInfo`, `MenorInfo`) y aplica
  `MaskUtil.maskIdentificador()` sobre `usuario.getIdentificador()` —
  es el primer caller real de `MaskUtil` (ver nota actualizada en
  "DECISIONES DE SESIÓN 4.2"). Queda listo para que
  `FiscalizacionController` (Sesión 6) lo reutilice tal cual.
- `qrService.ts` (frontend) reexporta los tipos `VehiculoInfo`,
  `SagInfo`, `MenorInfo` y `EstadoViaje` de `viajeService.ts` para
  tipar `ExpedienteResponse` sin duplicarlos.
- No se agregó la librería `react-qr-code` mencionada en STACK
  TECNOLÓGICO: el backend ya entrega un PNG en base64 listo para
  mostrar, así que `EstadoTramite.tsx` lo renderiza directamente en un
  `<img src="data:image/png;base64,...">`. Más simple y sin dependencia
  nueva.
- `EstadoTramite.tsx`: al montar, carga el viaje activo
  (`getIdViajeActivo`); si la declaración SAG ya existe, llama
  `obtenerQR()` automáticamente (get-or-create) y muestra el QR; si
  falla o la SAG no está completa, muestra un botón "Generar mi código
  QR" o un mensaje con link a `/declaracion-sag`. El botón "Descargar
  QR" crea un `<a download>` con el `data:` URL del PNG.
- Integración de `BottomNav.tsx` (4 pestañas: Inicio, Viaje, Mi QR,
  Perfil): en vez de crear el wrapper `<AppPasajero />` descrito en la
  arquitectura original (nunca implementado en sesiones previas), se
  renderiza dentro de `RutaProtegida` (App.tsx) cuando
  `sesion.rol === 'PASAJERO'`, después de los `children`. Se agregó
  `pb-16` al `<main>` de Dashboard, RegistroViaje, RegistroVehiculo,
  DeclaracionSag, Perfil y EstadoTramite para que el contenido no quede
  oculto detrás de la barra fija.
- Módulo "Mi Código QR" del Dashboard (marcado "próximamente" desde la
  Sesión 4) ahora es un `<Link to="/estado-tramite">` activo; el ítem
  de progreso "Código QR" del checklist usa `!!viajeActivo?.sag` como
  proxy de disponibilidad (el QR se genera on-demand de forma
  idempotente, no se precalcula).

---

## DECISIONES DE SESIÓN 6 (Vista del funcionario)

- `DecisionFiscalizacion` (enum, model/) tiene 5 valores, no 3: además
  de `APROBADO`/`RECHAZADO`/`SOSPECHA` se agregaron
  `VALIDACION_IDENTIDAD` (PDI) y `VALIDACION_SAG` (SAG). El alcance
  original mencionaba solo 3, pero el panel da a PDI un botón "Validar
  Identidad" y a SAG "Validar Declaración SAG", que son acciones de
  auditoría distintas y no podían mapearse a las otras tres sin perder
  semántica. Las dos nuevas se comportan como `SOSPECHA` (solo registran
  auditoría, no cambian estados).
- Permisos por decisión en `FiscalizacionService.validarPermiso()`
  (RF05, tabla de permisos): `APROBADO`/`RECHAZADO` → solo
  FUNCIONARIO_ADUANA; `SOSPECHA` → ADUANA/PDI/SAG (NO admin);
  `VALIDACION_IDENTIDAD` → solo PDI; `VALIDACION_SAG` → solo SAG. ADMIN
  es de SOLO LECTURA: el endpoint lo acepta (hasAnyRole incluye ADMIN
  para poder ver/historial) pero `validarPermiso` rechaza con 403
  cualquier resolución de ADMIN, y el frontend no le muestra botones.
- Efectos de estado: `APROBADO` → viaje `APROBADO` + QR `USADO`;
  `RECHAZADO` → viaje `RECHAZADO`, QR se mantiene `ACTIVO` (reintentable);
  `SOSPECHA`/`VALIDACION_*` → sin cambios de estado. Toda resolución
  persiste un `AuditoriaLog` con `accion = decision.name()`,
  `modulo = "QR"`.
- Se ampliaron `AuditoriaLog` y la tabla `auditoria_logs` con dos
  columnas nullable: `codigo_qr` (varchar 255) e
  `identificador_enmascarado` (varchar 30). El modelo de datos original
  no las tenía, pero el historial del turno (RF05) necesita mostrar a
  qué QR/pasajero corresponde cada acción. El identificador se guarda YA
  enmascarado con `MaskUtil` (RNF10), de modo que ni siquiera la tabla
  de auditoría almacena el identificador completo del pasajero. Como
  `ddl-auto: update`, Hibernate agrega las columnas automáticamente;
  `init.sql` se actualizó para instalaciones nuevas.
- `obtenerHistorialTurno()` filtra por
  `findByUsuarioIdUsuarioAndFechaAfterOrderByFechaDesc(idFuncionario,
  inicioDelDía)` — "turno actual" = registros del día en curso del
  funcionario autenticado.
- `FiscalizacionController` obtiene el rol desde las authorities del JWT
  (`ROLE_<rol>` → `Rol`), no desde la BD (helper `extraerRol`). El
  identificador sigue viniendo de `authentication.getName()`. Endpoints:
  `PUT /api/fiscalizacion/{codigo}/resolver` y
  `GET /api/fiscalizacion/historial`, ambos `hasAnyRole(FUNCIONARIO_*,
  ADMIN)` por `@PreAuthorize` (mismo patrón que QrController; no se tocó
  SecurityConfig).
- `FiscalizacionException` (+ handler en `GlobalExceptionHandler`)
  replica el patrón de `QrException`/`ViajeException`: 404 QR
  inexistente, 403 rol sin permiso, 409 QR no activo, 400 decisión
  inválida.
- La validación del QR escaneado reutiliza `GET /api/qr/validar/{codigo}`
  de la Sesión 5 (`qrService.validarQR` → `ExpedienteResponse` ya
  enmascarado); no se duplicó esa lógica en fiscalización.
- Layout funcionario: en vez del `<AppFuncionario />` de la arquitectura
  original, se creó `components/layout/FuncionarioLayout.tsx` (sidebar
  220px + cabecera GOB.CL con institución por rol + identificador propio
  enmascarado + banner DuocUC). Se integra igual que `BottomNav`: dentro
  de `RutaProtegida` (App.tsx), envolviendo los `children` cuando el rol
  NO es PASAJERO. El sidebar filtra items por rol (Fiscalización e
  Historial para todos; Monitoreo para ADUANA+ADMIN; Administración solo
  ADMIN). El placeholder `pages/Fiscalizacion.tsx` de la Sesión 3 se
  eliminó y se reemplazó por `pages/FiscalizacionQr.tsx`.
- `utils/documento.ts` ganó `maskIdentificador()` (espejo de
  `MaskUtil.java`) para enmascarar el identificador del PROPIO
  funcionario en la cabecera del panel (RNF10 también aplica a sus
  datos en vistas de funcionario).
- `Monitoreo.tsx` y `Admin.tsx` usan datos/acciones simulados (RF06,
  RF09, RF10 quedan fuera del MVP): ocupación/tiempo de espera mock,
  APIs externas "Operativa (simulada)", botón que activa un banner de
  Protocolo de Contingencia, y botones de reporte/gestión que muestran
  "Funcionalidad en desarrollo" / "Próximamente".

---

## DECISIONES DE SESIÓN 6.1 (Wizard, modelo 1:N, Aduanas, historial)

### CAMBIO 1 — Wizard lineal
- `RegistroViaje.tsx` se reescribió como un wizard de 5 pasos
  (Viaje → Vehículo → Declaración → Código QR → Finalizar) que maneja el
  paso actual con `useState` y embebe TODO el flujo en una sola página.
  Las páginas standalone `RegistroVehiculo.tsx` y `DeclaracionSag.tsx` se
  ELIMINARON (sus rutas `/registro-vehiculo` y `/declaracion-sag` ya no
  existen en `App.tsx`): el wizard las reemplaza. `EstadoTramite.tsx` se
  mantiene como vista de QR independiente accesible desde el historial.
- Nuevo `components/ui/WizardStepper.tsx` (props `steps[]`, `currentStep`,
  `completedSteps[]`): círculo verde gov-green con ✓ para completados,
  azul gov-primary para el actual, gris gov-accent para los bloqueados.
- El avance solo se habilita cuando el paso actual respondió 200/201
  (banderas `principalGuardado`/`sagGuardado`/`qr`, etc.); "Atrás"
  (`irAtras`) está siempre disponible sin perder datos ya guardados.
- BottomNav: la pestaña "Viaje" pasó a etiqueta "Viajes" y apunta a
  `/dashboard` (historial), NO al wizard. La `key` del `.map` cambió de
  `tab.to` a `tab.label` (dos pestañas comparten `/dashboard`).

### CAMBIO 2 — Vehículo opcional + carro de arrastre (1:N)
- `Vehiculo` pasó de `@OneToOne` a `@ManyToOne` con `viaje`; nuevos campos
  `esRemolque` (boolean, default false) y `vehiculoPrincipalId` (Integer,
  nullable, FK a `vehiculos`). `Viaje.vehiculos` es ahora
  `List<Vehiculo>` (`@OneToMany`). `init.sql`: tabla `vehiculos` perdió
  el `UNIQUE(id_viaje)`, ganó `es_remolque` y `vehiculo_principal_id`, y
  `marca`/`modelo` pasaron a NULLABLE (el remolque solo exige patente).
- `ViajeService.registrarVehiculo` es un upsert POR TIPO: busca por
  `findByViajeIdViajeAndEsRemolque(idViaje, esRemolque)`. El remolque
  exige que el principal ya exista (409 si no). Máximo 1 principal + 1
  remolque por viaje. El endpoint `POST /api/viajes/{id}/vehiculo` se
  llama dos veces si hay remolque.
- `ViajeResponse.vehiculos` es `List<VehiculoInfo>` y `VehiculoInfo`
  incluye `esRemolque`. `ExpedienteResponse.vehiculos` también pasó a
  `List<VehiculoInfo>` (antes singular `vehiculo`, que ya no compilaba
  contra el nuevo `Viaje`); `FiscalizacionQr.tsx` lista todos los
  vehículos. Helpers frontend `vehiculoPrincipal()`/`vehiculoRemolque()`
  en `viajeService.ts`.
- Paso 2 del wizard: checkbox "Viajo a pie / en transporte público" que
  omite el paso sin POST; si no, formulario de principal y, tras
  guardarlo, sección opcional de remolque (solo patente obligatoria).

### CAMBIO 3 — Declaración de Aduanas
- Se mantuvo el nombre de tabla/entidad `declaraciones_sag` pero se le
  agregaron 4 columnas Aduanas: `declara_divisas` (boolean),
  `monto_divisas` (DECIMAL 12,2 nullable), `moneda_divisas` (varchar 10
  nullable), `declara_mercancias` (boolean), `detalle_mercancias` (TEXT
  nullable). Reflejadas en `DeclaracionSag.java`, `init.sql`, `SagRequest`
  y `SagInfo` (en `ViajeResponse`, reutilizado por `ExpedienteResponse`).
- Regla "si declara divisas, monto > 0": es condicional entre campos, así
  que NO se valida con anotaciones sino en `ViajeService.guardarSag`
  (400 `ViajeException`). `guardarSag` además limpia (`null`) los detalles
  de divisas/mercancías cuando el respectivo booleano es `false`.
- Paso 3 del wizard (antes `DeclaracionSag.tsx`) tiene dos secciones
  separadas con aviso legal cada una: Sección 1 SAG (vegetal/animal/
  alimentos + detalle) y Sección 2 Aduanas (toggle divisas → monto+moneda,
  toggle mercancías → textarea). El funcionario las ve en `FiscalizacionQr`.

### CAMBIO 4 — Historial de viajes (Dashboard 1:N)
- `ViajeResponse` ganó `QrInfo qr` (codigo, estado, fechaGeneracion);
  `GET /api/viajes/mis-viajes` ya devolvía todos los viajes y ahora trae
  el QR anidado, sin endpoint nuevo.
- `Dashboard.tsx` se reescribió como Historial: lista de cards (más
  reciente primero) con `numeroExpediente`, destino, paso, fecha y badge;
  botón "Ver QR" (`/estado-tramite?id=`) si hay QR, o "Continuar trámite"
  (set activo + wizard) si no; estado vacío con "Crear mi primer viaje";
  botón "Nuevo Viaje" que limpia el activo y entra al wizard.
- `EstadoTramite.tsx` resuelve el id por prioridad: query param `?id=` >
  activo en localStorage > viaje más reciente. Tras generar el QR en el
  paso 5 del wizard, `finalizar()` limpia `sffe_id_viaje_activo` y
  redirige a `/dashboard`, donde el nuevo viaje aparece en la lista.

### CAMBIO 5 — Estado en Viaje, no en Usuario
- Verificado: `viajes.estado` (enum `EstadoViaje`) ya vivía en `Viaje`;
  `Usuario` no tenía ningún campo de estado salvo `rol`. No hubo
  migración.
- El número de expediente es el `id_viaje` (PK existente, sin DTO nuevo):
  se formatea SOLO en frontend con `numeroExpediente(id)` →
  `EXP-${id.padStart(5,'0')}` (ej. `EXP-00042`). El badge de estado en
  historial y `EstadoTramite` usa `estadoBadge(viaje.estado)`.

---

## DECISIONES DE SESIÓN 6.2 (Fiscalización multi-rol sobre un mismo QR)

- `QrService.validarQR(codigo)` ya NO exige `EstadoQr.ACTIVO`: el
  expediente consolidado es visible para cualquier funcionario
  (ADUANA/PDI/SAG/ADMIN) sin importar si el QR está `ACTIVO`, `USADO` o
  `EXPIRADO`. Solo lanza 404 si el código no existe. Razón: en el flujo
  real, Aduana/PDI/SAG fiscalizan el mismo expediente sin un orden
  garantizado por el sistema; si Aduana resolvía primero (QR → `USADO`),
  `validarQR` devolvía 409 y bloqueaba por completo a PDI/SAG, que ni
  siquiera podían VER el expediente para dejar su propio registro.
- `ExpedienteResponse` cambió su factory de `from(Viaje)` a
  `from(CodigoQr)` y ganó el campo `estadoQr` (`EstadoQr`), que el
  frontend usa para mostrar el aviso de QR ya usado.
- `FiscalizacionService.resolver()`: el chequeo de `EstadoQr.ACTIVO`
  ahora es condicional vía el helper privado `requiereQrActivo(decision)`.
  Solo `APROBADO`/`RECHAZADO` (las decisiones que efectivamente resuelven
  el ingreso y, en el caso de `APROBADO`, dejan el QR `USADO`) lo exigen;
  si el QR ya no está `ACTIVO`, ambas siguen devolviendo 409 "El código QR
  no está activo y no puede fiscalizarse".
- `VALIDACION_IDENTIDAD` (PDI), `VALIDACION_SAG` (SAG) y `SOSPECHA`
  (ADUANA/PDI/SAG) quedan exentas de ese chequeo: son registros de
  auditoría (`AuditoriaLog`) que no cambian el estado del viaje ni del QR,
  por lo que PDI/SAG pueden dejarlos aunque Aduana ya haya
  aprobado/rechazado el ingreso con el mismo QR.
- `frontend/src/services/qrService.ts`: `ExpedienteResponse` ganó
  `estadoQr: EstadoQr`.
- `FiscalizacionQr.tsx`: cuando `expediente.estadoQr === 'USADO'`, se
  muestra un banner informativo (`bg-estado-pendiente-bg` /
  `text-estado-pendiente-text`) sobre el panel del expediente: "⚠️ Este
  ingreso ya fue autorizado por Aduana. Puedes registrar tu validación
  igualmente." No bloquea el formulario de resolución de ningún rol.

---

## PROTOTIPOS HTML DE REFERENCIA

En docs/referencia/ hay dos archivos de referencia visual:
- SFFE_Vista_Pasajero.html   → estructura y campos del portal pasajero
- SFFE_Vista_Funcionario.html → estructura y campos del panel funcionario

Usarlos SOLO para: campos de formularios, orden de pantallas, colores CSS.
NO copiar su JavaScript — toda la lógica va en React con API real.

---

## NOTAS FINALES

- Las integraciones con PDI, SAG y Aduana Argentina son SIMULADAS
  en el MVP: responden con datos mock hardcodeados.
- El sistema NO toma decisiones legales autónomas.
- Todo endpoint protegido debe validar JWT y rol del usuario.
- Respetar la estructura de carpetas definida sin excepción.
- Los colores gov-* deben estar centralizados en tailwind.config.js
  bajo theme.extend.colors, NO en archivos theme.ts separados. Usar
  las clases utilitarias (bg-gov-primary, text-gov-tertiary, etc.) en
  los componentes; no usar estilos inline para los colores del gobierno.
- Usuario admin semilla en init.sql: admin@sffe.cl / RUT 11111111-1
  contraseña admin123 (hash BCrypt, coste 10).