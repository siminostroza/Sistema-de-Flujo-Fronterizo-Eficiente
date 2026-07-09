@echo off
setlocal EnableDelayedExpansion
title SFFE - Empaquetando version standalone
cd /d "%~dp0"

set OUT=%~dp0sffe-standalone

echo ============================================================
echo  SFFE - Empaquetando version standalone
echo ============================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro Docker. Instalalo para poder empaquetar.
    pause
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker Desktop no esta corriendo.
    pause
    exit /b 1
)

echo Construyendo imagen del backend (puede tardar varios minutos)...
docker build -t sffe-backend:standalone .\backend
if errorlevel 1 (
    echo [ERROR] Fallo el build del backend.
    pause
    exit /b 1
)

echo Construyendo imagen del frontend...
docker build -t sffe-frontend:standalone .\frontend
if errorlevel 1 (
    echo [ERROR] Fallo el build del frontend.
    pause
    exit /b 1
)

echo.
echo Preparando carpeta de salida: %OUT%
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%\db"
mkdir "%OUT%\images"

echo Guardando las imagenes en un solo archivo (esto pesa varios cientos de MB)...
docker save sffe-backend:standalone sffe-frontend:standalone -o "%OUT%\images\sffe-images.tar"

copy /y docker-compose.standalone.yml "%OUT%\docker-compose.yml" >nul
copy /y db\init.sql "%OUT%\db\init.sql" >nul
copy /y sffe-standalone-linux.sh "%OUT%\" >nul
copy /y sffe-standalone-windows.bat "%OUT%\" >nul
copy /y sffe-standalone-detener-linux.sh "%OUT%\" >nul
copy /y sffe-standalone-detener-windows.bat "%OUT%\" >nul

echo.
echo ============================================================
echo  Listo: %OUT%
echo ============================================================
echo  Comprime esa carpeta (zip) y entregala. Quien la reciba solo
echo  necesita Docker instalado -- no el codigo fuente ni compilar
echo  nada. Debe usar sffe-standalone-windows.bat o
echo  sffe-standalone-linux.sh segun su sistema operativo.
echo.
pause
