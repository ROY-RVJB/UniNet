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

# Verificar si ya existe la entrada
if ! crontab -l 2>/dev/null | grep -q "uninet-agent-runner"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Monitoreo automático configurado (heartbeat cada 30 segundos)${NC}"
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

# ==========================================
# CONFIGURACIÓN DE AUTENTICACIÓN LDAP
# ==========================================
echo ""
echo -e "${BLUE}🔐 Configurando autenticación LDAP...${NC}"

# Configuración LDAP
LDAP_SERVER="ldap://${SERVER_IP}"
LDAP_BASE_DN="dc=uninet,dc=com"
LDAP_BIND_DN="cn=admin,dc=uninet,dc=com"
LDAP_BIND_PW="admin123"

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
echo "🔐 Autenticación LDAP configurada:"
echo "   • Servidor LDAP: $LDAP_SERVER"
echo "   • Usuarios pueden iniciar sesión con sus credenciales LDAP"
echo "   • Los directorios home se crean automáticamente"
echo ""
echo "📝 Comandos útiles:"
echo "   • Verificar agente: sudo /usr/local/bin/uninet-agent"
echo "   • Ver logs: grep uninet /var/log/syslog"
echo "   • Listar usuarios LDAP: getent passwd | grep '/home'"
echo "   • Probar usuario LDAP: id <nombre_usuario>"
echo ""
echo "💡 Funcionamiento automático:"
echo "   • Estado de la máquina se reporta cada 30 segundos"
echo "   • Usuario activo se muestra en el dashboard"
echo "   • Los usuarios LDAP pueden hacer login gráfico"
echo ""
