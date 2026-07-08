@echo off
title SFFE - Detener servicios
cd /d "%~dp0"

echo Deteniendo los servicios de SFFE...
docker compose down

echo.
echo Listo. Los datos de la base de datos se conservan (volumen persistente).
echo Para borrar tambien los datos y empezar de cero, ejecuta:
echo   docker compose down -v
echo.
pause
