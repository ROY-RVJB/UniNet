#!/bin/bash

# UniNet Agent - Cliente de monitoreo de estado de PCs
# Este script se ejecuta periódicamente para reportar el estado de la máquina cliente

# Configuración del servidor (se establece durante la instalación)
CONFIG_FILE="/etc/uninet/config"

# Cargar configuración
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "Error: Archivo de configuración no encontrado en $CONFIG_FILE"
    exit 1
fi

# Validar que SERVER_URL esté configurado
if [ -z "$SERVER_URL" ]; then
    echo "Error: SERVER_URL no está configurado"
    exit 1
fi

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

# Obtener carrera del config (laboratorio al que pertenece esta PC)
CARRERA=${CARRERA:-"5010"}  # Default: Sistemas si no está configurado

# Construir JSON
JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":$USER_FIELD,\"carrera\":\"$CARRERA\"}"

# Enviar heartbeat al servidor
curl -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    --max-time 5 \
    --silent \
    --output /dev/null

exit 0
