#!/bin/bash

# UniNet Agent - Cliente de monitoreo de estado de PCs
# Este script se ejecuta periódicamente para reportar el estado de la máquina cliente

# Configuración del servidor
SERVER_URL="http://172.29.137.160:4000/api/monitoring/heartbeat"

# Obtener hostname
HOSTNAME=$(hostname)

# Obtener IP (primera interfaz no-loopback activa)
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1)

# Detectar usuario activo (quien está logueado en la sesión gráfica)
# Busca usuarios con sesión activa, excluyendo root
ACTIVE_USER=$(who | grep -v "^root " | awk '{print $1}' | head -n1)

# Si no hay usuario, dejar vacío
if [ -z "$ACTIVE_USER" ]; then
    USER_FIELD='null'
else
    USER_FIELD="\"$ACTIVE_USER\""
fi

# Construir JSON
JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":$USER_FIELD}"

# Enviar heartbeat al servidor
curl -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    --max-time 5 \
    --silent \
    --output /dev/null

exit 0
