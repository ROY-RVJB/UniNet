#!/bin/bash
#
# UniNet - Script para ver logs por carrera
# Uso: ./view-logs.sh [lines]
#

if [ ! -f /etc/uninet/logs.conf ]; then
    echo "Error: Logs no configurados. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/logs.conf

LINES=${1:-50}

echo "🔍 Mostrando las últimas $LINES líneas de $LOG_FILE (Ctrl+C para salir)..."
echo "------------------------------------------------------------"

tail -n "$LINES" -f "$LOG_FILE"
