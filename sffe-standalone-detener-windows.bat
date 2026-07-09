@echo off
title SFFE - Detener paquete standalone
cd /d "%~dp0"

echo Deteniendo los servicios de SFFE...
docker compose down

echo.
echo Listo. Los datos de la base de datos se conservan (volumen persistente).
echo Para borrar tambien los datos, ejecuta: docker compose down -v
echo.
pause
