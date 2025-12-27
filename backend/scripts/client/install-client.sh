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
    echo "Por favor ingresa la IP o hostname del servidor UniNet:"
    read -p "Servidor: " SERVER_IP
    if [ -z "$SERVER_IP" ]; then
        echo -e "${RED}❌ Error: Se requiere la IP del servidor${NC}"
        exit 1
    fi
fi

SERVER_PORT="4000"
SERVER_URL="http://${SERVER_IP}:${SERVER_PORT}/api/heartbeat"

echo -e "${BLUE}🎯 Servidor detectado: $SERVER_IP${NC}"
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

# Configurar cron para ejecutar cada 30 segundos
echo -e "${BLUE}⏱️  Configurando monitoreo automático...${NC}"

# Crear script wrapper para ejecutar dos veces por minuto
CRON_WRAPPER="/usr/local/bin/uninet-agent-runner"
cat > "$CRON_WRAPPER" << 'EOF'
#!/bin/bash
# Ejecutar el agente dos veces por minuto (cada 30 segundos)
/usr/local/bin/uninet-agent
sleep 30
/usr/local/bin/uninet-agent
EOF

chmod +x "$CRON_WRAPPER"

# Agregar tarea a cron (se ejecuta cada minuto, pero el wrapper lo hace cada 30s)
CRON_JOB="* * * * * $CRON_WRAPPER >/dev/null 2>&1"

# Configurar crontab para root (ya que el script se ejecuta con sudo)
# Verificar si ya existe la entrada
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")
if ! echo "$CURRENT_CRONTAB" | grep -q "uninet-agent-runner"; then
    # Agregar la tarea al crontab
    (echo "$CURRENT_CRONTAB"; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Monitoreo automático configurado (heartbeat cada 30 segundos)${NC}"
    
    # Verificar que se agregó correctamente
    if crontab -l 2>/dev/null | grep -q "uninet-agent-runner"; then
        echo -e "${GREEN}   ✓ Crontab verificado correctamente${NC}"
    else
        echo -e "${RED}   ✗ Advertencia: No se pudo verificar el crontab${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Monitoreo automático ya estaba configurado${NC}"
fi

# Verificar que el servicio cron esté activo
if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
    echo -e "${GREEN}✅ Servicio cron activo${NC}"
else
    echo -e "${BLUE}🔄 Iniciando servicio cron...${NC}"
    systemctl start cron 2>/dev/null || systemctl start crond 2>/dev/null || true
    systemctl enable cron 2>/dev/null || systemctl enable crond 2>/dev/null || true
fi

# Ejecutar el agente inmediatamente para verificar y registrar la PC
echo ""
echo -e "${BLUE}🔍 Registrando este equipo en el servidor...${NC}"
$AGENT_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Equipo registrado exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: Primer heartbeat falló, pero el agente seguirá intentando${NC}"
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
echo "🎯 Este equipo ahora envía su estado cada 30 segundos"
echo "   Verifica el dashboard en: http://$SERVER_IP:5173"
echo ""
echo "Para verificar el estado del agente:"
echo "   sudo /usr/local/bin/uninet-agent"
echo ""
echo "Para ver los logs de cron:"
echo "   grep uninet /var/log/syslog"
echo ""
echo ""
echo "El sistema reportará automáticamente:"
echo "  • Estado de la máquina (encendida/apagada)"
echo "  • Usuario activo (si alguien inició sesión)"
echo "  • IP y hostname"
echo ""
echo "No es necesario hacer nada más."
echo "El monitoreo se realiza automáticamente cada 30 segundos."
echo ""
