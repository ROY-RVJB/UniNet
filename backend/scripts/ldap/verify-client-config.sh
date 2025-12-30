#!/bin/bash
#
# UniNet - Verificar configuración LDAP para clientes
# Muestra qué configuración recibirán los clientes al instalarse
#

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================"
echo "  UniNet - Verificación de Config LDAP"
echo "============================================"
echo ""

# Obtener IP del servidor (Tailscale o local)
SERVER_IP=$(tailscale ip -4 2>/dev/null)
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
fi

echo -e "${BLUE}🔍 Servidor detectado: $SERVER_IP${NC}"
echo ""

# Verificar archivos de configuración local
echo -e "${BLUE}📋 Verificando archivos de configuración locales:${NC}"
echo ""

if [ -f "/etc/uninet/ldap.conf" ]; then
    echo -e "${GREEN}✅ /etc/uninet/ldap.conf existe${NC}"
    cat /etc/uninet/ldap.conf | grep -v "^#" | grep "="
else
    echo -e "${RED}❌ /etc/uninet/ldap.conf NO existe${NC}"
    echo -e "${YELLOW}   Ejecuta: cd backend/scripts/ldap && sudo bash setup.sh${NC}"
fi

echo ""

if [ -f "/etc/uninet/ldap_admin_pass" ]; then
    echo -e "${GREEN}✅ /etc/uninet/ldap_admin_pass existe${NC}"
    echo -e "${YELLOW}   (contraseña oculta por seguridad)${NC}"
else
    echo -e "${RED}❌ /etc/uninet/ldap_admin_pass NO existe${NC}"
    echo -e "${YELLOW}   Ejecuta: cd backend/scripts/ldap && sudo bash check-admin-pass.sh${NC}"
fi

echo ""
echo "============================================"
echo ""

# Probar endpoint del servidor
echo -e "${BLUE}🌐 Probando endpoint /ldap-config:${NC}"
echo ""

RESPONSE=$(curl -s "http://${SERVER_IP}:4000/ldap-config")

if echo "$RESPONSE" | grep -q "ldap_base"; then
    echo -e "${GREEN}✅ Endpoint funcionando correctamente${NC}"
    echo ""
    echo -e "${BLUE}📦 Configuración que recibirán los clientes:${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}❌ Error al obtener configuración${NC}"
    echo "$RESPONSE"
fi

echo ""
echo "============================================"
echo ""
echo -e "${BLUE}💡 Comando de instalación para clientes:${NC}"
echo -e "${GREEN}curl -sSL http://${SERVER_IP}:4000/install | sudo bash${NC}"
echo ""
