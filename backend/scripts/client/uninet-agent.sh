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

# ==========================================
# RECOLECTAR MÉTRICAS DEL SISTEMA
# ==========================================
get_system_metrics() {
    # Usar script Python standalone (más confiable que heredoc inline)
    if [ -x /usr/local/bin/uninet-metrics.py ]; then
        /usr/local/bin/uninet-metrics.py 2>/dev/null || echo "{}"
    else
        echo "{}"
    fi
}

# Obtener métricas del sistema
METRICS=$(get_system_metrics)

# Construir JSON con métricas si están disponibles
if [ "$METRICS" != "{}" ] && [ -n "$METRICS" ]; then
    JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":\"$USER_FIELD\",\"carrera\":\"$CARRERA\",\"metrics\":$METRICS}"
else
    # Fallback sin métricas
    JSON_DATA="{\"hostname\":\"$HOSTNAME\",\"ip\":\"$IP\",\"user\":\"$USER_FIELD\",\"carrera\":\"$CARRERA\"}"
fi

# ==========================================
# LEER Y ENVIAR ALERTAS DE SURICATA IDS
# ==========================================
# Archivos de control para alertas
SURICATA_LOG="/var/log/suricata/eve.json"
LAST_ALERT_FILE="/var/run/uninet-last-alert"
ALERT_CACHE_DIR="/var/run/uninet-alert-cache"
ALERT_DEDUP_SECONDS=300  # 5 minutos - no enviar alertas duplicadas del mismo signature_id en este periodo

# Crear directorio de caché de alertas
mkdir -p "$ALERT_CACHE_DIR"

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
            
            # Valores por defecto para campos opcionales
            [ -z "$SRC_PORT" ] && SRC_PORT="0"
            [ -z "$DEST_PORT" ] && DEST_PORT="0"
            [ -z "$CATEGORY" ] && CATEGORY="Unknown"
            [ -z "$SEVERITY" ] && SEVERITY="3"
            [ -z "$SIGNATURE_ID" ] && SIGNATURE_ID="0"
            [ -z "$SIGNATURE" ] && SIGNATURE="Unknown"
            
            # ===== FILTRAR TODO EL TRÁFICO NORMAL =====
            # IMPORTANTE: Permitir TODAS las alertas custom (SID 9000000-9999999)
            if [[ "$SIGNATURE_ID" =~ ^9[0-9]{6}$ ]]; then
                # Es una alerta custom - NO filtrar
                :  # No hacer nada, permitir que pase
            else
                # Lista de signature_ids de tráfico legítimo
                case "$SIGNATURE_ID" in
                    2016149|2016150|2024897|2060251|2027397|2039784|2019102|2019103|2063117|2013504)
                        # Tráfico normal/legítimo - IGNORAR
                        continue
                        ;;
                esac
            fi
            
            # Filtro adicional: Ignorar categorías específicas
            case "$CATEGORY" in
                "Not Suspicious Traffic"|"Unknown Traffic"|"Misc activity")
                    continue
                    ;;
            esac
            
            # Asegurar que los valores numéricos sean válidos (regex: solo dígitos)
            [[ ! "$SRC_PORT" =~ ^[0-9]+$ ]] && SRC_PORT="0"
            [[ ! "$DEST_PORT" =~ ^[0-9]+$ ]] && DEST_PORT="0"
            [[ ! "$SEVERITY" =~ ^[1-3]$ ]] && SEVERITY="3"
            [[ ! "$SIGNATURE_ID" =~ ^[0-9]+$ ]] && SIGNATURE_ID="0"
            
            # ===== DEDUPLICACIÓN =====
            # No enviar la misma alerta (mismo signature_id) más de una vez cada 5 minutos
            ALERT_CACHE_FILE="$ALERT_CACHE_DIR/sig_${SIGNATURE_ID}"
            CURRENT_TIME=$(date +%s)
            SHOULD_SEND=true
            
            if [ -f "$ALERT_CACHE_FILE" ]; then
                LAST_SENT=$(cat "$ALERT_CACHE_FILE")
                TIME_DIFF=$((CURRENT_TIME - LAST_SENT))
                
                if [ $TIME_DIFF -lt $ALERT_DEDUP_SECONDS ]; then
                    # Alerta muy reciente, no enviar
                    SHOULD_SEND=false
                fi
            fi
            
            # Solo enviar si no es duplicada reciente
            if [ "$SHOULD_SEND" = true ]; then
                # Construir payload usando jq para escapar correctamente
                ALERT_PAYLOAD=$(jq -n \
                    --arg hostname "$HOSTNAME" \
                    --arg ip "$IP" \
                    --arg user "$USER_FIELD" \
                    --arg carrera "$CARRERA" \
                    --arg timestamp "$TIMESTAMP" \
                    --arg signature "$SIGNATURE" \
                    --argjson severity "$SEVERITY" \
                    --arg category "$CATEGORY" \
                    --arg src_ip "$SRC_IP" \
                    --arg dest_ip "$DEST_IP" \
                    --arg protocol "$PROTO" \
                    --argjson src_port "$SRC_PORT" \
                    --argjson dest_port "$DEST_PORT" \
                    --argjson signature_id "$SIGNATURE_ID" \
                    '{hostname: $hostname, ip: $ip, user: $user, carrera: $carrera, timestamp: $timestamp, signature: $signature, severity: $severity, category: $category, src_ip: $src_ip, dest_ip: $dest_ip, protocol: $protocol, src_port: $src_port, dest_port: $dest_port, signature_id: $signature_id}')
                
                # Enviar alerta al backend (sin bloquear el heartbeat)
                curl -X POST "$ALERT_URL" \
                    -H "Content-Type: application/json" \
                    -d "$ALERT_PAYLOAD" \
                    --max-time 2 \
                    --silent > /dev/null 2>&1 &
                
                # Guardar timestamp de envío para deduplicación
                echo "$CURRENT_TIME" > "$ALERT_CACHE_FILE"
            fi
            
            # Guardar timestamp de la última alerta procesada
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
    # Detectar todas las interfaces de red excepto loopback y bloquear salida
    interfaces=$(ip -o link show | awk -F': ' '{print $2}' | grep -v '^lo$')
    for iface in $interfaces; do
        echo "[INFO] Bloqueando salida en interfaz: $iface"
        sudo ufw deny out on "$iface" 2>/dev/null
    done
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