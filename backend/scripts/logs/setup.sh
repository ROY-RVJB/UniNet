#!/bin/bash
#
# UniNet - Script de configuración de Logs
# Crea directorios y permisos necesarios para los logs del backend
#

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================================"
echo "  Logs Setup - UniNet Dashboard"
echo "============================================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

LOG_DIR="/var/log/uninet"
LOG_FILE="$LOG_DIR/api.log"
CONFIG_FILE="/etc/uninet/logs.conf"

echo "📁 Creando directorio de logs en $LOG_DIR..."
mkdir -p "$LOG_DIR"

# Crear archivo de log vacío si no existe
if [ ! -f "$LOG_FILE" ]; then
    touch "$LOG_FILE"
    echo "📄 Archivo de log creado: $LOG_FILE"
fi

# Ajustar permisos (importante para que FastAPI pueda escribir)
# Asumimos permisos amplios (666) o dueño root:root si ejecutas como root
chmod 777 "$LOG_DIR"
chmod 666 "$LOG_FILE"
echo -e "${GREEN}✓ Permisos configurados${NC}"

# Crear archivo de configuración para los otros scripts
echo ""
echo "⚙️  Guardando configuración en $CONFIG_FILE..."
mkdir -p /etc/uninet
cat > "$CONFIG_FILE" << EOF
LOG_DIR=$LOG_DIR
LOG_FILE=$LOG_FILE
RETENTION_DAYS=7
EOF

echo ""
echo "============================================================"
echo -e "  ${GREEN}✅ Configuración de logs completada${NC}"
echo "============================================================"
echo "  Directorio: $LOG_DIR"
echo "  Archivo: $LOG_FILE"
exit 0