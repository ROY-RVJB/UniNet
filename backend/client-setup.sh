#!/bin/bash

# ============================================================
# Script de Configuración Automática - Cliente UniNet
# ============================================================
# Este script configura un cliente Ubuntu para ser monitoreado
# por el servidor UniNet Dashboard.
#
# Ejecutar en cada PC cliente:
# sudo ./client-setup.sh
# ============================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo -e "  ${BLUE}UniNet Cliente - Configuración Automática${NC}"
echo "============================================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

# Obtener información del sistema
CLIENT_HOSTNAME=$(hostname)
CLIENT_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}📋 Información del Cliente:${NC}"
echo "   Hostname: $CLIENT_HOSTNAME"
echo "   IP Local: $CLIENT_IP"
echo ""

# ============================================================
# 1. Actualizar sistema
# ============================================================
echo -e "${BLUE}[1/6]${NC} Actualizando repositorios del sistema..."
apt update -qq

# ============================================================
# 2. Instalar dependencias básicas
# ============================================================
echo -e "${BLUE}[2/6]${NC} Instalando dependencias básicas..."
apt install -y openssh-server curl net-tools iputils-ping > /dev/null 2>&1

# ============================================================
# 3. Configurar SSH
# ============================================================
echo -e "${BLUE}[3/6]${NC} Configurando SSH..."

# Habilitar SSH si no está activo
systemctl enable ssh > /dev/null 2>&1
systemctl start ssh > /dev/null 2>&1

echo -e "   ${GREEN}✓${NC} SSH habilitado y funcionando"

# ============================================================
# 4. Configurar Firewall (UFW) - Permitir SSH
# ============================================================
echo -e "${BLUE}[4/6]${NC} Configurando firewall básico..."

if command -v ufw &> /dev/null; then
    # Permitir SSH
    ufw allow 22/tcp comment "SSH para administración" > /dev/null 2>&1
    
    # Habilitar UFW si no está activo
    ufw --force enable > /dev/null 2>&1
    
    echo -e "   ${GREEN}✓${NC} Firewall configurado (SSH permitido)"
else
    echo -e "   ${YELLOW}⚠${NC} UFW no está instalado"
    read -p "   ¿Desea instalar UFW? (s/n): " install_ufw
    if [ "$install_ufw" = "s" ] || [ "$install_ufw" = "S" ]; then
        apt install -y ufw
        ufw allow 22/tcp
        ufw --force enable
        echo -e "   ${GREEN}✓${NC} UFW instalado y configurado"
    fi
fi

# ============================================================
# 5. Crear archivo de identificación del cliente
# ============================================================
echo -e "${BLUE}[5/6]${NC} Creando archivo de identificación..."

mkdir -p /etc/uninet
cat > /etc/uninet/client.conf << EOF
# UniNet Client Configuration
CLIENT_HOSTNAME=$CLIENT_HOSTNAME
CLIENT_IP=$CLIENT_IP
CONFIGURED_DATE=$(date '+%Y-%m-%d %H:%M:%S')
STATUS=active
EOF

chmod 644 /etc/uninet/client.conf
echo -e "   ${GREEN}✓${NC} Archivo de configuración creado: /etc/uninet/client.conf"

# ============================================================
# 6. Configurar servicio de heartbeat (opcional)
# ============================================================
echo -e "${BLUE}[6/6]${NC} Configurando servicio de heartbeat..."

cat > /usr/local/bin/uninet-heartbeat.sh << 'EOF'
#!/bin/bash
# Script simple que mantiene el cliente "visible" para el servidor
# El servidor hace ping, este script solo asegura que responda

# Verificar conectividad básica
ping -c 1 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "$(date): Cliente activo" >> /var/log/uninet-heartbeat.log
fi
EOF

chmod +x /usr/local/bin/uninet-heartbeat.sh

# Crear servicio systemd para el heartbeat
cat > /etc/systemd/system/uninet-heartbeat.service << EOF
[Unit]
Description=UniNet Client Heartbeat
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/uninet-heartbeat.sh
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable uninet-heartbeat.service > /dev/null 2>&1
systemctl start uninet-heartbeat.service

echo -e "   ${GREEN}✓${NC} Servicio de heartbeat configurado"

# ============================================================
# Resumen final
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN}✅ ¡Configuración completada exitosamente!${NC}"
echo "============================================================"
echo ""
echo -e "${BLUE}📊 Información del Cliente Configurado:${NC}"
echo "   Hostname:      $CLIENT_HOSTNAME"
echo "   IP:            $CLIENT_IP"
echo "   SSH:           ✓ Activo (puerto 22)"
echo "   Firewall:      ✓ Configurado"
echo "   Heartbeat:     ✓ Activo"
echo ""
echo "============================================================"
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "============================================================"
echo ""
echo "1. Verifica que este cliente esté en la red ZeroTier:"
echo "   ${BLUE}sudo zerotier-cli info${NC}"
echo ""
echo "2. El servidor debe poder hacer ping a esta IP:"
echo "   ${BLUE}ping $CLIENT_IP${NC}"
echo ""
echo "3. El dashboard debería detectar este cliente automáticamente"
echo "   en http://172.29.137.160:4000/status"
echo ""
echo "============================================================"
echo -e "${GREEN}🎉 Cliente listo para ser monitoreado${NC}"
echo "============================================================"
echo ""
