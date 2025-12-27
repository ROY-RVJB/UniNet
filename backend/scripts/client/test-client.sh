#!/bin/bash

# Script de prueba para simular un cliente enviando heartbeats
# Uso: bash test-client.sh [hostname] [user]

SERVER_URL="http://172.29.137.160:4000/api/monitoring/heartbeat"

# Parámetros opcionales
HOSTNAME=${1:-"PC-TEST-01"}
USER=${2:-""}

# Obtener IP real
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1)

# Si no se proporciona usuario, enviar null
if [ -z "$USER" ]; then
    USER_FIELD='null'
else
    USER_FIELD="\"$USER\""
fi

echo "======================================"
echo "Simulando Cliente de Monitoreo"
echo "======================================"
echo "Hostname: $HOSTNAME"
echo "IP: $IP"
echo "Usuario: ${USER:-"(ninguno)"}"
echo "Servidor: $SERVER_URL"
echo "======================================"
echo ""

# Función para enviar heartbeat
send_heartbeat() {
    JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":$USER_FIELD}"
    
    RESPONSE=$(curl -X POST "$SERVER_URL" \
        -H "Content-Type: application/json" \
        -d "$JSON_DATA" \
        --max-time 5 \
        --silent \
        --write-out "\nHTTP_CODE:%{http_code}" \
        2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Heartbeat enviado exitosamente ($(date +'%H:%M:%S'))"
        return 0
    else
        echo "❌ Error al enviar heartbeat (HTTP $HTTP_CODE)"
        return 1
    fi
}

# Enviar heartbeat cada 5 segundos (modo prueba, más rápido que los 30s reales)
echo "Enviando heartbeats cada 5 segundos (Ctrl+C para detener)..."
echo ""

while true; do
    send_heartbeat
    sleep 5
done
