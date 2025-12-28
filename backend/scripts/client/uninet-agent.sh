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