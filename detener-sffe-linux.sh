#!/usr/bin/env bash
# SFFE - Sistema de Flujo Fronterizo Eficiente (Linux) - Detener servicios

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Deteniendo los servicios de SFFE..."
docker compose down

echo
echo "Listo. Los datos de la base de datos se conservan (volumen persistente)."
echo "Para borrar también los datos y empezar de cero, ejecuta:"
echo "  docker compose down -v"
echo
read -rp "Presiona Enter para cerrar esta ventana..." _
