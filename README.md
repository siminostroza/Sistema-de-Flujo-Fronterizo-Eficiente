# SFFE — Sistema de Flujo Fronterizo Eficiente

Sistema web para digitalizar los trámites de cruce fronterizo terrestre en Chile
(Aduanas, SAG, PDI). Proyecto semestral — DUOC UC.

## Requisitos

- Docker Desktop (recomendado), o bien:
- Java 21 + Maven, Node.js 22+, MySQL 8

## Inicio con un clic

Cada sistema operativo tiene su propio lanzador (nombre distinto a propósito,
para no confundirlos):

- **Windows**: con Docker Desktop instalado y abierto, doble clic en
  **`iniciar-sffe-windows.bat`**. Para detener: **`detener-sffe-windows.bat`**.
- **Linux**: con Docker instalado, ejecuta **`./iniciar-sffe-linux.sh`**
  (o dale doble clic si tu gestor de archivos permite ejecutar scripts).
  Para detener: **`./detener-sffe-linux.sh`**.

Ambos lanzadores levantan los servicios, esperan a que el backend esté listo,
abren el navegador en `http://localhost` y muestran las cuentas de prueba en
pantalla.

## Inicio rápido con Docker

```bash
docker compose up --build
```

| Servicio  | URL                                  |
|-----------|--------------------------------------|
| Frontend  | http://localhost                     |
| API       | http://localhost:8080/api            |
| Swagger   | http://localhost:8080/swagger-ui.html |
| MySQL     | localhost:3306 (BD `sffe`, usuario `sffe`) |
| Correos de prueba (Mailpit) | http://localhost:8025 |

### Cuentas de prueba

Contraseña para todas: `admin123`

| Rol                 | RUT           | Correo                     |
|---------------------|---------------|-----------------------------|
| ADMIN                | 11111111-1    | admin@sffe.cl               |
| PASAJERO             | 12345678-5    | user@prueba.cl              |
| FUNCIONARIO_ADUANA   | 21013281-3    | juan.perez@prueba.cl        |
| FUNCIONARIO_PDI      | 13705281-4    | maria.gonzalez@prueba.cl    |
| FUNCIONARIO_SAG      | 10112374-K    | carlos.munoz@prueba.cl      |

El pasajero inicia sesión en `http://localhost` con el RUT y la contraseña.
Los funcionarios inician sesión en `http://localhost/funcionario/login`,
eligiendo primero la institución (Aduana / PDI / SAG / Admin).

## Desarrollo local sin Docker

Levantar solo MySQL en contenedor:

```bash
docker compose up mysql -d
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend (con proxy automático de `/api` hacia el backend):

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend
mvn test
```

## Estructura

Ver [CLAUDE.md](CLAUDE.md) para la estructura de carpetas, módulos funcionales y convenciones del proyecto.
