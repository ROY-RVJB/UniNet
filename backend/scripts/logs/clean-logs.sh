#!/bin/bash
#
# UniNet - Script para limpiar logs antiguos
# Elimina logs rotados o antiguos para liberar espacio
#

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f /etc/uninet/logs.conf ]; then
    echo "Error: Logs no configurados. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/logs.conf

echo "🧹 Iniciando limpieza de logs en $LOG_DIR..."
echo "   Retención configurada: $RETENTION_DAYS días"

COUNT=$(find "$LOG_DIR" -name "*.log*" -type f -mtime +$RETENTION_DAYS | wc -l)

if [ "$COUNT" -gt 0 ]; then
    find "$LOG_DIR" -name "*.log*" -type f -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✅ Se eliminaron $COUNT archivos antiguos${NC}"
else
    echo -e "${YELLOW}ℹ️  No hay logs antiguos para eliminar${NC}"
fi

exit 0
