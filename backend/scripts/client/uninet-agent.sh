#!/bin/bash

# UniNet Agent - Cliente de monitoreo de estado de PCs (con bloqueo de internet usando UFW)
# Este script se ejecuta periódicamente para reportar el estado de la máquina cliente y aplicar reglas de firewall según la orden del backend

CONFIG_FILE="/etc/uninet/config"

# Cargar configuración
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "Error: Archivo de configuración no encontrado en $CONFIG_FILE"
    exit 1
fi

if [ -z "$SERVER_URL" ]; then
    echo "Error: SERVER_URL no está configurado"
    exit 1
fi


HOSTNAME=$(hostname)
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1)
# Detectar usuario activo real (no root, no vacío)
ACTIVE_USER=$(who | awk '$1!="root" {print $1}' | head -n1)
if [ -z "$ACTIVE_USER" ]; then
    USER_FIELD=""
else
    USER_FIELD="$ACTIVE_USER"
fi
CARRERA=${CARRERA:-"5010"}

# Siempre enviar user como string (o vacío)
JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":\"$USER_FIELD\",\"carrera\":\"$CARRERA\"}"

# ==========================================
# LEER Y ENVIAR ALERTAS DE SURICATA IDS
# ==========================================
SURICATA_LOG="/var/log/suricata/eve.json"
LAST_ALERT_FILE="/var/run/uninet-last-alert"

# Verificar si Suricata está activo y hay alertas nuevas
if [ -f "$SURICATA_LOG" ] && [ -r "$SURICATA_LOG" ]; then
    # Obtener timestamp de la última alerta procesada
    if [ -f "$LAST_ALERT_FILE" ]; then
        LAST_TIMESTAMP=$(cat "$LAST_ALERT_FILE")
    else
        LAST_TIMESTAMP="1970-01-01T00:00:00"
    fi
    
    # Buscar alertas nuevas desde el último timestamp
    NEW_ALERTS=$(sudo grep '"event_type":"alert"' "$SURICATA_LOG" 2>/dev/null | tail -n 50)
    
    if [ -n "$NEW_ALERTS" ]; then
        # Enviar alertas al backend
        ALERT_URL="${SERVER_URL%/heartbeat}/security/alerts"
        
        echo "$NEW_ALERTS" | while read -r alert_line; do
            # Extraer campos del JSON
            TIMESTAMP=$(echo "$alert_line" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
            SIGNATURE=$(echo "$alert_line" | grep -o '"signature":"[^"]*"' | cut -d'"' -f4)
            SEVERITY=$(echo "$alert_line" | grep -o '"severity":[0-9]*' | cut -d':' -f2)
            SRC_IP=$(echo "$alert_line" | grep -o '"src_ip":"[^"]*"' | cut -d'"' -f4)
            DEST_IP=$(echo "$alert_line" | grep -o '"dest_ip":"[^"]*"' | cut -d'"' -f4)
            PROTO=$(echo "$alert_line" | grep -o '"proto":"[^"]*"' | cut -d'"' -f4)
            SRC_PORT=$(echo "$alert_line" | grep -o '"src_port":[0-9]*' | cut -d':' -f2)
            DEST_PORT=$(echo "$alert_line" | grep -o '"dest_port":[0-9]*' | cut -d':' -f2)
            SIGNATURE_ID=$(echo "$alert_line" | grep -o '"signature_id":[0-9]*' | cut -d':' -f2)
            CATEGORY=$(echo "$alert_line" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)
            
            # Construir payload para el backend
            ALERT_PAYLOAD="{
                \"hostname\":\"$HOSTNAME\",
                \"ip\":\"$IP\",
                \"user\":\"$USER_FIELD\",
                \"carrera\":\"$CARRERA\",
                \"timestamp\":\"$TIMESTAMP\",
                \"signature\":\"$SIGNATURE\",
                \"severity\":$SEVERITY,
                \"category\":\"$CATEGORY\",
                \"src_ip\":\"$SRC_IP\",
                \"dest_ip\":\"$DEST_IP\",
                \"protocol\":\"$PROTO\",
                \"src_port\":$SRC_PORT,
                \"dest_port\":$DEST_PORT,
                \"signature_id\":$SIGNATURE_ID
            }"
            
            # Enviar alerta al backend (sin bloquear el heartbeat)
            curl -X POST "$ALERT_URL" \
                -H "Content-Type: application/json" \
                -d "$ALERT_PAYLOAD" \
                --max-time 2 \
                --silent > /dev/null 2>&1 &
            
            # Guardar timestamp de la última alerta enviada
            echo "$TIMESTAMP" > "$LAST_ALERT_FILE"
        done
    fi
fi



# Enviar heartbeat y guardar respuesta
RESPONSE=$(curl -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    --max-time 5 \
    --silent)

# DEBUG: Imprimir la respuesta del backend
echo "Respuesta del backend: $RESPONSE"

# === Registro de acceso a internet (solo ejemplo: ping a 8.8.8.8) ===
LOG_FILE="/var/log/uninet/carreras.log"
if [ "$CARRERA" = "sistemas" ] && [ -n "$USER_FIELD" ]; then
    # Probar si hay acceso a internet (ICMP a 8.8.8.8)
    if ping -c 1 -W 1 8.8.8.8 >/dev/null 2>&1; then
        TS=$(date +"%H:%M:%S")
        LOG_MSG="{\"timestamp\":\"$TS\",\"level\":\"info\",\"carrera\":\"$CARRERA\",\"uid\":\"$USER_FIELD\",\"message\":\"Acceso a internet detectado\"}"
        echo "$LOG_MSG" | sudo tee -a "$LOG_FILE" >/dev/null
    fi
fi


# Analizar si el backend pide bloquear internet

# Si el backend pide bloquear internet, BLOQUEAR TODO el tráfico saliente (ni siquiera DNS)

# Si el backend pide bloquear internet, BLOQUEAR TODO el tráfico saliente (ni siquiera DNS ni ICMP)


if echo "$RESPONSE" | grep -q '"block_internet":true'; then
    # Limpiar archivos de backup de UFW para evitar errores
    for i in $(ls /etc/ufw/user.rules.* /etc/ufw/before.rules.* 2>/dev/null); do sudo rm -f "$i"; done
    sudo ufw --force reset
    sudo ufw default deny outgoing
    sudo ufw default deny incoming
    sudo ufw --force enable
    # Bloquear ICMP (ping) usando iptables directamente
    sudo iptables -A OUTPUT -p icmp --icmp-type echo-request -j DROP
    sudo iptables -A INPUT -p icmp --icmp-type echo-reply -j DROP
else
    # Restaurar política por defecto a permitir todo y limpiar reglas
    for i in $(ls /etc/ufw/user.rules.* /etc/ufw/before.rules.* 2>/dev/null); do sudo rm -f "$i"; done
    sudo ufw --force reset
    sudo ufw default allow outgoing
    sudo ufw default allow incoming
    sudo ufw --force enable
    # Limpiar reglas ICMP de iptables
    sudo iptables -D OUTPUT -p icmp --icmp-type echo-request -j DROP 2>/dev/null
    sudo iptables -D INPUT -p icmp --icmp-type echo-reply -j DROP 2>/dev/null
fi

exit 0