# SFFE — Sistema de Flujo Fronterizo Eficiente

Sistema web para digitalizar los trámites de cruce fronterizo terrestre en Chile
(Aduanas, SAG, PDI). Proyecto semestral — DUOC UC.

## Requisitos

- Docker Desktop (recomendado), o bien:
- Java 21 + Maven, Node.js 22+, MySQL 8

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
