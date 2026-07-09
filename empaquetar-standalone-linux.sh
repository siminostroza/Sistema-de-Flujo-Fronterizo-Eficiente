#!/usr/bin/env bash
# SFFE - Genera el paquete standalone (Linux/macOS).
#
# Este script SÍ necesita el código fuente completo y Docker funcionando:
# construye las imágenes de backend y frontend, las guarda en un único
# archivo .tar con `docker save`, y arma una carpeta de salida
# (sffe-standalone/) con todo lo necesario para correr el sistema en OTRO
# equipo que solo tenga Docker — sin el código fuente ni recompilar nada.
#
# Uso:
#   ./empaquetar-standalone-linux.sh
#   (comprime la carpeta sffe-standalone/ resultante y entrégala)

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

OUT="$SCRIPT_DIR/sffe-standalone"

echo "============================================================"
echo " SFFE - Empaquetando versión standalone"
echo "============================================================"
echo

if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] No se encontró Docker. Instálalo para poder empaquetar."
    exit 1
fi
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker no está corriendo."
    exit 1
fi

echo "Construyendo imagen del backend (puede tardar varios minutos)..."
docker build -t sffe-backend:standalone ./backend

echo "Construyendo imagen del frontend..."
docker build -t sffe-frontend:standalone ./frontend

echo
echo "Preparando carpeta de salida: $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/db" "$OUT/images"

echo "Guardando las imágenes en un solo archivo (esto pesa varios cientos de MB)..."
docker save sffe-backend:standalone sffe-frontend:standalone -o "$OUT/images/sffe-images.tar"

cp docker-compose.standalone.yml "$OUT/docker-compose.yml"
cp db/init.sql "$OUT/db/init.sql"
cp sffe-standalone-linux.sh "$OUT/"
cp sffe-standalone-windows.bat "$OUT/"
cp sffe-standalone-detener-linux.sh "$OUT/"
cp sffe-standalone-detener-windows.bat "$OUT/"
chmod +x "$OUT/sffe-standalone-linux.sh" "$OUT/sffe-standalone-detener-linux.sh"

echo
echo "============================================================"
echo " Listo: $OUT"
echo "============================================================"
echo " Comprime esa carpeta (zip) y entrégala. Quien la reciba solo"
echo " necesita Docker instalado — no el código fuente ni compilar"
echo " nada. Debe usar sffe-standalone-windows.bat o"
echo " sffe-standalone-linux.sh según su sistema operativo."
echo
du -sh "$OUT" 2>/dev/null || true
