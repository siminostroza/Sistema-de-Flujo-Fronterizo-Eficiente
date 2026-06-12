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
  - rut (varchar 12, unique)
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

Enums separados: Rol, EstadoViaje, EstadoDeclaracion, EstadoQr
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
│       ├── pages/
│       │   ├── Login.tsx           ← Login pasajero
│       │   ├── LoginFuncionario.tsx← Login funcionario con selector de rol
│       │   ├── Dashboard.tsx       ← Dashboard pasajero
│       │   ├── RegistroViaje.tsx
│       │   ├── RegistroVehiculo.tsx
│       │   ├── DeclaracionSag.tsx
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
│       │   └── rut.ts              ← Validación RUT chileno (módulo 11)
│       └── context/
│           └── AuthContext.tsx     ← Estado global de sesión y rol
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
RNF10: enmascarar RUT en vistas de funcionario (*****-X).

---

## FLUJO PRINCIPAL DEL SISTEMA

1.  Pasajero se registra con RUT + correo + contraseña
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
⏳ Sesión 5 (Sonnet): Generación de QR — QrService con ZXing,
   QrController, EstadoTramite.tsx con visualización del QR
⏳ Sesión 6 (Opus): Vista del funcionario — FiscalizacionController,
   FiscalizacionQr.tsx con panel consolidado separado por rol
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