#!/bin/bash

# UniNet Client Installer - Auto-configurable
# Script de instalación automática del agente de monitoreo
# Detecta automáticamente la IP del servidor y configura el agente
# Uso: curl -sSL http://SERVIDOR:4000/install | sudo bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "==================================="
echo "🌐 UniNet - Instalador de Cliente"
echo "==================================="
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Error: Este script debe ejecutarse como root (sudo)${NC}"
    exit 1
fi

# Detectar la IP del servidor desde donde se descargó este script
# Placeholder que será reemplazado por el servidor al servir el script
SERVER_IP="{{SERVER_IP}}"

# Si el placeholder no fue reemplazado, intentar detectar
# Usamos pattern matching para evitar que esta línea también se reemplace
if [[ "$SERVER_IP" == "{{"*"}}" ]]; then
    echo -e "${YELLOW}⚠️  Auto-detección de servidor falló${NC}"
    echo ""
    echo "Por favor ingresa la IP de Tailscale del servidor UniNet:"
    echo -e "${BLUE}   Ejemplo: 100.112.81.15${NC}"
    echo ""
    echo -e "${BLUE}💡 Tip: En tu servidor Ubuntu, ejecuta:${NC} ${GREEN}tailscale ip -4${NC}"
    echo ""
    read -p "IP de Tailscale del servidor: " SERVER_IP
    if [ -z "$SERVER_IP" ]; then
        echo -e "${RED}❌ Error: Se requiere la IP del servidor${NC}"
        exit 1
    fi
fi

SERVER_PORT="4000"
SERVER_URL="http://${SERVER_IP}:${SERVER_PORT}/api/monitoring/heartbeat"

echo -e "${BLUE}🎯 Servidor detectado: $SERVER_IP${NC}"
echo ""

# ==========================================
# SELECCIÓN DE LABORATORIO/CARRERA
# ==========================================

# Verificar si se pasó la carrera como variable de entorno
if [ -n "$CARRERA" ]; then
    CARRERA_CODE="$CARRERA"
    echo -e "${GREEN}✅ Carrera preconfigurada: $CARRERA_CODE${NC}"
else
    # Detectar si estamos en modo interactivo (terminal TTY)
    if [ -t 0 ]; then
        # Modo interactivo: preguntar
        echo -e "${BLUE}🏫 Selecciona el laboratorio al que pertenece esta PC:${NC}"
        echo ""
        echo "  1) Administración y Negocios Internacionales"
        echo "  2) Contabilidad y Finanzas"
        echo "  3) Derecho y Ciencias Políticas"
        echo "  4) Ecoturismo"
        echo "  5) Educación Inicial y Especial"
        echo "  6) Educación Matemáticas y Computación"
        echo "  7) Educación Primaria e Informática"
        echo "  8) Enfermería"
        echo "  9) Ingeniería Agroindustrial"
        echo " 10) Ingeniería de Sistemas e Informática"
        echo " 11) Ingeniería Forestal y Medio Ambiente"
        echo " 12) Medicina Veterinaria y Zootecnia"
        echo ""

        CARRERA_CODE=""
        while [ -z "$CARRERA_CODE" ]; do
            read -p "Selecciona (1-12): " CARRERA_OPTION
            case $CARRERA_OPTION in
                1) CARRERA_CODE="5001" ;;
                2) CARRERA_CODE="5002" ;;
                3) CARRERA_CODE="5003" ;;
                4) CARRERA_CODE="5004" ;;
                5) CARRERA_CODE="5005" ;;
                6) CARRERA_CODE="5006" ;;
                7) CARRERA_CODE="5007" ;;
                8) CARRERA_CODE="5008" ;;
                9) CARRERA_CODE="5009" ;;
                10) CARRERA_CODE="5010" ;;
                11) CARRERA_CODE="5011" ;;
                12) CARRERA_CODE="5012" ;;
                *) echo -e "${RED}❌ Opción inválida. Intenta de nuevo.${NC}" ;;
            esac
        done
        echo -e "${GREEN}✅ Laboratorio seleccionado: código $CARRERA_CODE${NC}"
    else
        # Modo no-interactivo (pipe desde curl): usar valor por defecto
        CARRERA_CODE="5010"  # Default: Sistemas
        echo -e "${YELLOW}⚠️  Modo no-interactivo detectado${NC}"
        echo -e "${YELLOW}⚠️  Usando carrera por defecto: Sistemas (5010)${NC}"
        echo ""
        echo -e "${BLUE}💡 Para especificar otra carrera, usa:${NC}"
        echo -e "   ${GREEN}CARRERA=5002 curl -sSL http://$SERVER_IP:4000/install | sudo -E bash${NC}"
        echo ""
    fi
fi

echo ""

# Verificar que curl está instalado
if ! command -v curl &> /dev/null; then
    echo -e "${BLUE}📦 Instalando curl...${NC}"
    apt-get update -qq
    apt-get install -y curl
fi

# Verificar conectividad con el servidor
echo -e "${BLUE}🔍 Verificando conectividad con el servidor...${NC}"
if ! curl -s --max-time 5 "http://${SERVER_IP}:${SERVER_PORT}/health" > /dev/null; then
    echo -e "${RED}❌ Error: No se puede conectar al servidor en $SERVER_IP:$SERVER_PORT${NC}"
    echo "Verifica que:"
    echo "  1. El servidor backend esté ejecutándose"
    echo "  2. La IP/hostname sea correcta"
    echo "  3. El puerto 4000 esté accesible"
    exit 1
fi
echo -e "${GREEN}✅ Servidor accesible${NC}"
echo ""

# Crear directorio de configuración
CONFIG_DIR="/etc/uninet"
mkdir -p "$CONFIG_DIR"

# Crear archivo de configuración
echo -e "${BLUE}⚙️  Creando configuración...${NC}"
cat > "$CONFIG_DIR/config" << EOF
# UniNet Agent Configuration
# Generado automáticamente el $(date)
SERVER_URL="$SERVER_URL"
SERVER_IP="$SERVER_IP"
SERVER_PORT="$SERVER_PORT"
CARRERA="$CARRERA_CODE"
EOF

echo -e "${GREEN}✅ Configuración guardada en: $CONFIG_DIR/config${NC}"

# Descargar el agente desde el servidor
INSTALL_DIR="/usr/local/bin"
AGENT_FILE="$INSTALL_DIR/uninet-agent"

echo -e "${BLUE}📥 Descargando agente de monitoreo desde el servidor...${NC}"

if curl -s --max-time 10 "http://${SERVER_IP}:${SERVER_PORT}/agent" -o "$AGENT_FILE"; then
    chmod +x "$AGENT_FILE"
    echo -e "${GREEN}✅ Agente instalado en: $AGENT_FILE${NC}"
else
    echo -e "${RED}❌ Error: No se pudo descargar el agente desde el servidor${NC}"
    exit 1
fi

# Descargar script de métricas del sistema
METRICS_FILE="$INSTALL_DIR/uninet-metrics.py"
echo -e "${BLUE}📥 Descargando script de métricas del sistema...${NC}"

if curl -s --max-time 10 "http://${SERVER_IP}:${SERVER_PORT}/metrics-script" -o "$METRICS_FILE"; then
    chmod +x "$METRICS_FILE"
    echo -e "${GREEN}✅ Script de métricas instalado en: $METRICS_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: No se pudo descargar el script de métricas${NC}"
    echo -e "${YELLOW}   Las métricas del sistema no estarán disponibles${NC}"
fi

# Configurar monitoreo automático (heartbeat cada 5 segundos)
echo -e "${BLUE}⏱️  Configurando monitoreo automático...${NC}"

# Detectar si es actualización
IS_UPDATE=false
if crontab -l 2>/dev/null | grep -q "uninet-agent-runner"; then
    IS_UPDATE=true
    echo -e "${YELLOW}📦 Instalación existente detectada - Actualizando configuración...${NC}"
    # Limpiar cron anterior
    crontab -l 2>/dev/null | grep -v "uninet-agent-runner" | crontab - 2>/dev/null
fi

# Crear script wrapper para ejecutar cada 5 segundos (12 veces por minuto)
CRON_WRAPPER="/usr/local/bin/uninet-agent-runner"
cat > "$CRON_WRAPPER" << 'EOF'
#!/bin/bash
# Ejecutar el agente 12 veces por minuto (cada 5 segundos)
for i in {1..12}; do
    /usr/local/bin/uninet-agent &
    sleep 5
done
EOF

chmod +x "$CRON_WRAPPER"

# Agregar tarea a cron (se ejecuta cada minuto, pero el wrapper lo hace cada 5s)
CRON_JOB="* * * * * $CRON_WRAPPER >/dev/null 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verificar que el cron se configuró
echo -e "${BLUE}🔍 Verificando cron...${NC}"
if crontab -l 2>/dev/null | grep -q "uninet-agent-runner"; then
    echo -e "${GREEN}   ✓ Cron configurado correctamente${NC}"
else
    echo -e "${YELLOW}   ⚠ Cron NO se configuró - requerirá configuración manual${NC}"
fi

if [ "$IS_UPDATE" = true ]; then
    echo -e "${GREEN}✅ Monitoreo actualizado exitosamente (heartbeat cada 5 segundos - Detección RÁPIDA)${NC}"
else
    echo -e "${GREEN}✅ Monitoreo automático configurado (heartbeat cada 5 segundos - Detección RÁPIDA)${NC}"
fi

# Verificar que el servicio cron esté activo
if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
    echo -e "${GREEN}✅ Servicio cron activo${NC}"
else
    echo -e "${BLUE}🔄 Iniciando servicio cron...${NC}"
    systemctl start cron 2>/dev/null || systemctl start crond 2>/dev/null || true
    systemctl enable cron 2>/dev/null || systemctl enable crond 2>/dev/null || true
fi

# ==========================================
# CONFIGURACIÓN DE AUTENTICACIÓN LDAP
# ==========================================
echo ""
echo -e "${BLUE}🔐 Configurando autenticación LDAP...${NC}"

# Descargar configuración LDAP del servidor automáticamente
echo -e "${BLUE}📥 Obteniendo configuración LDAP del servidor...${NC}"
LDAP_CONFIG_JSON=$(curl -s --max-time 5 "http://${SERVER_IP}:${SERVER_PORT}/ldap-config")

# Verificar si se obtuvo configuración válida
if echo "$LDAP_CONFIG_JSON" | grep -q "ldap_base"; then
    # Parsear JSON con jq (o manualmente si no está disponible)
    if command -v jq &> /dev/null; then
        LDAP_SERVER=$(echo "$LDAP_CONFIG_JSON" | jq -r '.ldap_uri')
        LDAP_BASE_DN=$(echo "$LDAP_CONFIG_JSON" | jq -r '.ldap_base')
        LDAP_BIND_DN=$(echo "$LDAP_CONFIG_JSON" | jq -r '.ldap_admin')
        LDAP_BIND_PW=$(echo "$LDAP_CONFIG_JSON" | jq -r '.ldap_admin_pass')
    else
        # Parsear manualmente sin jq
        LDAP_SERVER=$(echo "$LDAP_CONFIG_JSON" | grep -o '"ldap_uri":"[^"]*"' | cut -d'"' -f4)
        LDAP_BASE_DN=$(echo "$LDAP_CONFIG_JSON" | grep -o '"ldap_base":"[^"]*"' | cut -d'"' -f4)
        LDAP_BIND_DN=$(echo "$LDAP_CONFIG_JSON" | grep -o '"ldap_admin":"[^"]*"' | cut -d'"' -f4)
        LDAP_BIND_PW=$(echo "$LDAP_CONFIG_JSON" | grep -o '"ldap_admin_pass":"[^"]*"' | cut -d'"' -f4)
    fi
    
    # Si LDAP_SERVER no tiene protocolo, agregarlo
    if [[ ! "$LDAP_SERVER" =~ ^ldap:// ]]; then
        LDAP_SERVER="ldap://${SERVER_IP}"
    fi
    
    echo -e "${GREEN}✅ Configuración LDAP obtenida del servidor${NC}"
    echo -e "${GREEN}   Base DN: $LDAP_BASE_DN${NC}"
else
    # Fallback: Configuración por defecto (solo si el servidor no está configurado)
    echo -e "${YELLOW}⚠️  No se pudo obtener configuración LDAP del servidor${NC}"
    echo -e "${YELLOW}⚠️  Usando configuración por defecto${NC}"
    echo ""
    echo -e "${BLUE}💡 Para configurar LDAP en el servidor, ejecuta:${NC}"
    echo -e "${GREEN}   cd backend/scripts/ldap && sudo bash setup.sh${NC}"
    echo ""
    
    LDAP_SERVER="ldap://${SERVER_IP}"
    LDAP_BASE_DN="dc=uninet,dc=com"
    LDAP_BIND_DN="cn=admin,dc=uninet,dc=com"
    LDAP_BIND_PW="admin123"
fi

# Instalar paquetes necesarios para LDAP
echo -e "${BLUE}📦 Instalando paquetes LDAP...${NC}"
DEBIAN_FRONTEND=noninteractive apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    ldap-utils \
    libnss-ldapd \
    libpam-ldapd \
    nslcd \
    nscd \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Paquetes LDAP instalados${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: Error al instalar paquetes LDAP${NC}"
fi

# Configurar nslcd (reemplazo moderno de libnss-ldap)
echo -e "${BLUE}⚙️  Configurando NSLCD...${NC}"
cat > /etc/nslcd.conf << EOF
# UniNet LDAP Configuration via NSLCD
uid nslcd
gid nslcd

uri $LDAP_SERVER
base $LDAP_BASE_DN

binddn $LDAP_BIND_DN
bindpw $LDAP_BIND_PW

# SSL/TLS settings
ssl off
tls_cacertfile /etc/ssl/certs/ca-certificates.crt

# Search filters
scope sub
referrals no

# Reconnect settings
reconnect_sleeptime 1
reconnect_retrytime 10

# PAM authorization
pam_authz_search (&(objectClass=posixAccount)(uid=\$username))
EOF

# Asegurar permisos correctos
chmod 640 /etc/nslcd.conf
chown root:nslcd /etc/nslcd.conf

# Configurar NSS (Name Service Switch)
echo -e "${BLUE}⚙️  Configurando NSS...${NC}"
cp /etc/nsswitch.conf /etc/nsswitch.conf.backup
sed -i 's/^passwd:.*/passwd:         files ldap/' /etc/nsswitch.conf
sed -i 's/^group:.*/group:          files ldap/' /etc/nsswitch.conf
sed -i 's/^shadow:.*/shadow:         files ldap/' /etc/nsswitch.conf

# Crear grupos LDAP locales si no existen
echo -e "${BLUE}⚙️  Creando grupos LDAP...${NC}"
if ! getent group 5000 > /dev/null 2>&1; then
    groupadd -g 5000 alumnos
    echo -e "${GREEN}✅ Grupo 'alumnos' (GID 5000) creado${NC}"
fi

if ! getent group 6000 > /dev/null 2>&1; then
    groupadd -g 6000 docentes
    echo -e "${GREEN}✅ Grupo 'docentes' (GID 6000) creado${NC}"
fi

# Configurar PAM para autenticación LDAP
echo -e "${BLUE}⚙️  Configurando PAM...${NC}"

# Configurar common-auth
cp /etc/pam.d/common-auth /etc/pam.d/common-auth.backup 2>/dev/null || true
cat > /etc/pam.d/common-auth << 'EOF'
# UniNet PAM Authentication Configuration
auth    [success=2 default=ignore]      pam_unix.so nullok
auth    [success=1 default=ignore]      pam_ldap.so use_first_pass
auth    requisite                       pam_deny.so
auth    required                        pam_permit.so
auth    optional                        pam_cap.so
EOF

# Configurar common-account
cp /etc/pam.d/common-account /etc/pam.d/common-account.backup 2>/dev/null || true
cat > /etc/pam.d/common-account << 'EOF'
# UniNet PAM Account Configuration
account [success=2 new_authtok_reqd=done default=ignore]        pam_unix.so
account [success=1 default=ignore]      pam_ldap.so
account requisite                       pam_deny.so
account required                        pam_permit.so
EOF

# Configurar common-password
cp /etc/pam.d/common-password /etc/pam.d/common-password.backup 2>/dev/null || true
cat > /etc/pam.d/common-password << 'EOF'
# UniNet PAM Password Configuration
password        [success=2 default=ignore]      pam_unix.so obscure sha512
password        [success=1 user_unknown=ignore default=die]     pam_ldap.so use_authtok try_first_pass
password        requisite                       pam_deny.so
password        required                        pam_permit.so
EOF

# Configurar common-session
cp /etc/pam.d/common-session /etc/pam.d/common-session.backup 2>/dev/null || true
cat > /etc/pam.d/common-session << 'EOF'
# UniNet PAM Session Configuration
session [default=1]                     pam_permit.so
session requisite                       pam_deny.so
session required                        pam_permit.so
session optional                        pam_umask.so
session required        pam_unix.so
session optional        pam_ldap.so
session optional                        pam_systemd.so
session optional        pam_mkhomedir.so skel=/etc/skel umask=077
EOF

# Reiniciar servicios
echo -e "${BLUE}🔄 Reiniciando servicios LDAP...${NC}"
systemctl restart nslcd 2>/dev/null || true
systemctl enable nslcd 2>/dev/null || true
systemctl restart nscd 2>/dev/null || true

# Esperar a que nslcd inicie
sleep 2

# Probar conexión LDAP
echo -e "${BLUE}🔍 Probando conexión LDAP...${NC}"
if ldapsearch -x -H "$LDAP_SERVER" -b "$LDAP_BASE_DN" -D "$LDAP_BIND_DN" -w "$LDAP_BIND_PW" "(uid=*)" uid > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión LDAP exitosa${NC}"
    
    # Listar algunos usuarios disponibles
    LDAP_USERS=$(ldapsearch -x -H "$LDAP_SERVER" -b "$LDAP_BASE_DN" -D "$LDAP_BIND_DN" -w "$LDAP_BIND_PW" "(uid=*)" uid 2>/dev/null | grep "^uid:" | awk '{print $2}' | head -n 5 | tr '\n' ', ' | sed 's/,$//')
    if [ -n "$LDAP_USERS" ]; then
        echo -e "${GREEN}   Usuarios LDAP disponibles: $LDAP_USERS...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Advertencia: No se pudo conectar a LDAP${NC}"
    echo -e "${YELLOW}   Los usuarios locales seguirán funcionando${NC}"
fi

echo -e "${GREEN}✅ Configuración LDAP completada${NC}"
echo ""

# ==========================================
# REGISTRO INICIAL EN EL SERVIDOR
# ==========================================
# Ejecutar el agente ANTES de Suricata para que la PC aparezca inmediatamente
echo ""
echo -e "${BLUE}🔍 Registrando este equipo en el servidor...${NC}"
$AGENT_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Equipo registrado exitosamente${NC}"
    echo -e "${GREEN}   La PC ya está visible en el dashboard${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: Primer heartbeat falló, pero el agente seguirá intentando${NC}"
fi

echo ""

# ==========================================
# INSTALACIÓN Y CONFIGURACIÓN DE SURICATA IDS
# ==========================================
echo ""
echo -e "${BLUE}🛡️  Instalando Suricata IDS para monitoreo de seguridad...${NC}"

# Instalar Suricata, jq y python3-psutil (necesarios para el agente)
# Usar apt en lugar de pip para evitar problemas con Ubuntu 24.04 externally-managed
echo -e "${BLUE}📦 Instalando dependencias (Suricata, jq, psutil)...${NC}"
apt-get install -y suricata jq python3-psutil > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  No se pudo instalar algunas dependencias, continuando...${NC}"
}

# Verificar si Suricata se instaló correctamente
if command -v suricata &> /dev/null; then
    echo -e "${GREEN}✅ Suricata instalado correctamente${NC}"
    
    # Actualizar reglas de Suricata primero
    echo -e "${BLUE}📥 Actualizando reglas de detección de Suricata...${NC}"
    suricata-update > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  No se pudieron actualizar las reglas${NC}"
    
    # Detectar interfaz de red principal
    NETWORK_INTERFACE=$(ip -o link show | grep -v "lo\|docker\|veth\|virbr" | awk -F': ' '{print $2}' | head -n1)
    echo -e "${BLUE}📡 Interfaz de red detectada: $NETWORK_INTERFACE${NC}"
    
    # Configurar interfaz usando Python (método seguro que no rompe YAML)
    python3 <<EOF
import re
config_file = "/etc/suricata/suricata.yaml"
try:
    with open(config_file, 'r') as f:
        content = f.read()
    pattern = r'(af-packet:\s*-\s*interface:\s*)\S+'
    new_content = re.sub(pattern, f'\\\\1${NETWORK_INTERFACE}', content, count=1)
    if new_content != content:
        with open(config_file, 'w') as f:
            f.write(new_content)
        print("✅ Interfaz configurada correctamente")
    else:
        print("⚠️  Configuración de interfaz no modificada")
except Exception as e:
    print(f"⚠️  Error configurando interfaz: {e}")
EOF
    
    # Crear directorio de logs si no existe
    mkdir -p /var/log/suricata
    chmod 755 /var/log/suricata
    
    # Deshabilitar alertas de tráfico normal (STUN/P2P, ZeroTier, Spotify, etc.)
    echo -e "${BLUE}🔇 Deshabilitando alertas de tráfico legítimo en Suricata...${NC}"
    
    # Usar suricata-update para deshabilitar permanentemente
    if command -v suricata-update &> /dev/null; then
        # Deshabilitar cada SID individualmente
        suricata-update disable-sid 2016149 2>/dev/null  # STUN/P2P 1
        suricata-update disable-sid 2016150 2>/dev/null  # STUN/P2P 2
        suricata-update disable-sid 2024897 2>/dev/null  # Go HTTP Client
        suricata-update disable-sid 2060251 2>/dev/null  # Go HTTP 2
        suricata-update disable-sid 2027397 2>/dev/null  # ZeroTier
        suricata-update disable-sid 2039784 2>/dev/null  # Spotify P2P
        
        # CRÍTICO: Aplicar los cambios actualizando las reglas
        echo -e "${BLUE}   📥 Aplicando cambios a las reglas de Suricata...${NC}"
        suricata-update > /dev/null 2>&1
        
        echo -e "${GREEN}   ✅ Reglas actualizadas - Suricata solo generará alertas reales${NC}"
    else
        echo -e "${YELLOW}   ⚠️  suricata-update no disponible${NC}"
    fi
    
    # Reiniciar Suricata con la nueva configuración
    systemctl restart suricata 2>/dev/null || service suricata restart 2>/dev/null || true
    systemctl enable suricata 2>/dev/null || true
    
    # Verificar que Suricata esté corriendo
    sleep 2
    if systemctl is-active --quiet suricata 2>/dev/null || service suricata status 2>/dev/null | grep -q "running"; then
        echo -e "${GREEN}✅ Suricata IDS activo y monitoreando tráfico de red en: $NETWORK_INTERFACE${NC}"
        echo -e "${GREEN}   📊 Las alertas se guardarán en: /var/log/suricata/eve.json${NC}"
    else
        echo -e "${YELLOW}⚠️  Suricata instalado pero no pudo iniciarse${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Suricata no disponible, continuando sin IDS${NC}"
fi

# Información del sistema
HOSTNAME=$(hostname)
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1)

echo ""
echo "==================================="
echo -e "${GREEN}✅ Instalación completada${NC}"
echo "==================================="
echo ""
echo "📋 Información del equipo:"
echo "   • Hostname: $HOSTNAME"
echo "   • IP: $IP"
echo "   • Servidor: $SERVER_IP:$SERVER_PORT"
echo ""
echo "🎯 Este equipo ahora envía su estado cada 5 segundos (⚡ Detección RÁPIDA)"
echo "   Verifica el dashboard en: http://$SERVER_IP:5173"
echo ""
echo "🔐 Autenticación LDAP configurada:"
echo "   • Servidor LDAP: $LDAP_SERVER"
echo "   • Usuarios pueden iniciar sesión con sus credenciales LDAP"
echo "   • Los directorios home se crean automáticamente"
echo ""
echo "�️  Suricata IDS configurado:"
echo "   • Monitoreo de seguridad activo en interfaz: $NETWORK_INTERFACE"
echo "   • Alertas se guardan en: /var/log/suricata/eve.json"
echo "   • Las amenazas detectadas aparecen en el dashboard"
echo ""
echo "�📝 Comandos útiles:"
echo "   • Verificar agente: sudo /usr/local/bin/uninet-agent"
echo "   • Ver logs: grep uninet /var/log/syslog"echo "   • Ver alertas IDS: sudo tail -f /var/log/suricata/eve.json"
echo "   • Estado Suricata: sudo systemctl status suricata"echo "   • Listar usuarios LDAP: getent passwd | grep '/home'"
echo "   • Probar usuario LDAP: id <nombre_usuario>"
echo ""
echo "💡 Funcionamiento automático:"
echo "   • Estado de la máquina se reporta cada 5 segundos (⚡ Cambios visibles en 3-5s)"
echo "   • Usuario activo se muestra en el dashboard"
echo "   • Los usuarios LDAP pueden hacer login gráfico"
echo ""
