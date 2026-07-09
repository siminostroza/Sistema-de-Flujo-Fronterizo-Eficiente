#!/usr/bin/env bash
# SFFE - Paquete STANDALONE (Linux) - NO requiere el código fuente del
# proyecto: las imágenes de backend y frontend ya vienen precompiladas en
# images/sffe-images.tar. Solo hace falta Docker instalado. Nombre e
# impresión en pantalla distintos a iniciar-sffe-linux.sh a propósito, para
# no confundir este paquete (autocontenido) con el del código fuente
# (que sí compila al iniciar).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo " SFFE - PAQUETE STANDALONE (Linux)"
echo " Prototipo académico DuocUC - No es un sistema oficial"
echo " (imágenes precompiladas — no necesita el código fuente)"
echo "============================================================"
echo

if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] No se encontró Docker en este equipo."
    echo "Instala Docker Engine: https://docs.docker.com/engine/install/"
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] El demonio de Docker no está corriendo o tu usuario no tiene permisos."
    echo "Prueba: sudo systemctl start docker"
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "[ERROR] No se encontró el plugin 'docker compose'."
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

if ! docker image inspect sffe-backend:standalone >/dev/null 2>&1 \
    || ! docker image inspect sffe-frontend:standalone >/dev/null 2>&1; then
    echo "Cargando imágenes precompiladas (solo la primera vez)..."
    if [ ! -f "images/sffe-images.tar" ]; then
        echo "[ERROR] No se encontró images/sffe-images.tar. ¿Está completa la carpeta?"
        read -rp "Presiona Enter para cerrar..." _
        exit 1
    fi
    docker load -i images/sffe-images.tar
else
    echo "Imágenes ya cargadas, se omite docker load."
fi

echo
echo "Levantando los servicios (sin compilar: las imágenes ya están listas)..."
if ! docker compose up -d; then
    echo
    echo "[ERROR] docker compose no pudo levantar los servicios. Revisa el"
    echo "mensaje de error de arriba."
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

echo
echo "Esperando a que el backend termine de iniciar..."
backend_listo=0
for i in $(seq 1 60); do
    if curl -fsS http://localhost:8080/actuator/health >/dev/null 2>&1; then
        backend_listo=1
        break
    fi
    sleep 2
done

if [ "$backend_listo" -eq 1 ]; then
    echo "Backend listo."
else
    echo
    echo "[AVISO] El backend está tardando más de lo normal en iniciar."
    echo "Revisa los logs con: docker compose logs -f backend"
    echo "Se abrirá el navegador de todas formas."
fi

echo
echo "Abriendo el navegador..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost >/dev/null 2>&1 &
else
    echo "No se encontró xdg-open. Abre manualmente: http://localhost"
fi

cat <<'EOF'

============================================================
 Cuentas de prueba (contraseña para todas: admin123)
============================================================
 Rol                     RUT             Correo
 ------------------------------------------------------------
 ADMIN                    11111111-1      admin@sffe.cl
 PASAJERO                 12345678-5      user@prueba.cl
 FUNCIONARIO_ADUANA       21013281-3      juan.perez@prueba.cl
 FUNCIONARIO_PDI          13705281-4      maria.gonzalez@prueba.cl
 FUNCIONARIO_SAG          10112374-K      carlos.munoz@prueba.cl
 ------------------------------------------------------------
 Pasajero: inicia sesión en http://localhost con el RUT y la
 contraseña de arriba.
 Funcionario: entra en http://localhost/funcionario/login, elige
 la institución (Aduana / PDI / SAG / Admin) e inicia sesión con
 el mismo RUT.
============================================================

 Correos de prueba (verificación / recuperación de clave):
 http://localhost:8025

 Para DETENER el sistema, ejecuta ./sffe-standalone-detener-linux.sh
EOF
echo
read -rp "Presiona Enter para cerrar esta ventana..." _
