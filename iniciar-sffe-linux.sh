#!/usr/bin/env bash
# SFFE - Sistema de Flujo Fronterizo Eficiente (Linux)
# Prototipo académico DuocUC - No es un sistema oficial del Estado de Chile

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo " SFFE - Sistema de Flujo Fronterizo Eficiente (Linux)"
echo " Prototipo académico DuocUC - No es un sistema oficial"
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
    echo "o agrega tu usuario al grupo docker: sudo usermod -aG docker \$USER"
    echo "(cierra sesión y vuelve a entrar para que el cambio de grupo tome efecto)."
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "[ERROR] No se encontró el plugin 'docker compose'."
    echo "Instala Docker Compose v2: https://docs.docker.com/compose/install/"
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

echo "Levantando los servicios (mysql, backend, frontend, mailpit)..."
echo "Esto puede tardar varios minutos la primera vez (descarga y build)."
echo
if ! docker compose up -d --build; then
    echo
    echo "[ERROR] docker compose no pudo levantar los servicios. Revisa el"
    echo "mensaje de error de arriba."
    read -rp "Presiona Enter para cerrar..." _
    exit 1
fi

echo
echo "Esperando a que el backend termine de iniciar..."
backend_listo=0
for i in $(seq 1 90); do
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

 Para DETENER el sistema, ejecuta ./detener-sffe-linux.sh
EOF
echo
read -rp "Presiona Enter para cerrar esta ventana..." _
