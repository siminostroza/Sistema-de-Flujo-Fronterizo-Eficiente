@echo off
setlocal EnableDelayedExpansion
title SFFE - Sistema de Flujo Fronterizo Eficiente
cd /d "%~dp0"

echo ============================================================
echo  SFFE - Sistema de Flujo Fronterizo Eficiente
echo  Prototipo academico DuocUC - No es un sistema oficial
echo ============================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro Docker en este equipo.
    echo Instala Docker Desktop desde https://www.docker.com/products/docker-desktop/
    echo y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker Desktop no esta corriendo.
    echo Abre Docker Desktop, espera a que inicie por completo y vuelve a
    echo ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo Levantando los servicios (mysql, backend, frontend, mailpit)...
echo Esto puede tardar varios minutos la primera vez (descarga y build).
echo.
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo [ERROR] docker compose no pudo levantar los servicios. Revisa el
    echo mensaje de error de arriba.
    echo.
    pause
    exit /b 1
)

echo.
echo Esperando a que el backend termine de iniciar...
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 90;$i++){try{$r=Invoke-WebRequest -Uri http://localhost:8080/actuator/health -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break}}catch{}; Start-Sleep -Seconds 2}; if(-not $ok){exit 1}"

if errorlevel 1 (
    echo.
    echo [AVISO] El backend esta tardando mas de lo normal en iniciar.
    echo Revisa los logs con: docker compose logs -f backend
    echo Se abrira el navegador de todas formas.
) else (
    echo Backend listo.
)

echo.
echo Abriendo el navegador...
start "" http://localhost

echo.
echo ============================================================
echo  Cuentas de prueba (contrasena para todas: admin123)
echo ============================================================
echo  Rol                     RUT             Correo
echo  ------------------------------------------------------------
echo  ADMIN                    11111111-1      admin@sffe.cl
echo  PASAJERO                 12345678-5      user@prueba.cl
echo  FUNCIONARIO_ADUANA       21013281-3      juan.perez@prueba.cl
echo  FUNCIONARIO_PDI          13705281-4      maria.gonzalez@prueba.cl
echo  FUNCIONARIO_SAG          10112374-K      carlos.munoz@prueba.cl
echo ------------------------------------------------------------
echo  Pasajero: inicia sesion en http://localhost con el RUT y la
echo  contrasena de arriba.
echo  Funcionario: entra en http://localhost/funcionario/login, elige
echo  la institucion (Aduana / PDI / SAG / Admin) e inicia sesion con
echo  el mismo RUT.
echo ============================================================
echo.
echo  Correos de prueba (verificacion / recuperacion de clave):
echo  http://localhost:8025
echo.
echo  Para DETENER el sistema, ejecuta detener-sffe.bat
echo.
pause
