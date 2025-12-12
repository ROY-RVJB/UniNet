#!/bin/bash
#
# UniNet - Script para ver logs del sistema
# Uso: ./view-logs.sh [lines]
#

# Cargar configuración
if [ ! -f /etc/uninet/logs.conf ]; then
    echo "Error: Logs no configurados. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/logs.conf

LINES=${1:-50} # Por defecto muestra las últimas 50 líneas

echo "🔍 Mostrando las últimas $LINES líneas de $LOG_FILE (Ctrl+C para salir)..."
echo "------------------------------------------------------------"

# Usamos tail -f para ver en tiempo real
tail -n "$LINES" -f "$LOG_FILE"