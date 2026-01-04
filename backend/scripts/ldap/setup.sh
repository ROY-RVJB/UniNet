#!/bin/bash
#
# UniNet - Script de instalación de OpenLDAP
# Configura un servidor LDAP para autenticación centralizada
#

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================================"
echo "  OpenLDAP Setup - UniNet Dashboard"
echo "============================================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ejecutando como root${NC}"
echo ""

# Pedir configuración al usuario
read -p "Dominio base (ej: uninet.com): " DOMAIN
read -p "Organización (ej: UniNet Lab): " ORGANIZATION
read -sp "Contraseña del administrador LDAP: " ADMIN_PASS
echo ""
read -p "Usuario que ejecutará el backend (default: servidor): " BACKEND_USER
BACKEND_USER=${BACKEND_USER:-servidor}

# Convertir dominio a formato LDAP (ej: uninet.com -> dc=uninet,dc=com)
LDAP_BASE=$(echo "$DOMAIN" | sed 's/\./,dc=/g' | sed 's/^/dc=/')

echo ""
echo "📋 Configuración:"
echo "   Dominio: $DOMAIN"
echo "   Base DN: $LDAP_BASE"
echo "   Organización: $ORGANIZATION"
echo ""

# Instalar paquetes
echo "📦 Instalando OpenLDAP..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    slapd ldap-utils libnss-ldap libpam-ldap ldap-auth-config

# Reconfigurar slapd
echo ""
echo "⚙️  Configurando OpenLDAP..."
debconf-set-selections <<EOF
slapd slapd/internal/generated_adminpw password $ADMIN_PASS
slapd slapd/password1 password $ADMIN_PASS
slapd slapd/password2 password $ADMIN_PASS
slapd slapd/domain string $DOMAIN
slapd shared/organization string $ORGANIZATION
slapd slapd/backend select MDB
slapd slapd/purge_database boolean true
slapd slapd/move_old_database boolean true
slapd slapd/no_configuration boolean false
EOF

dpkg-reconfigure -f noninteractive slapd

# Crear unidad organizacional para usuarios
echo ""
echo "📁 Creando estructura LDAP..."
cat > /tmp/base.ldif << EOF
dn: ou=users,$LDAP_BASE
objectClass: organizationalUnit
ou: users

dn: ou=groups,$LDAP_BASE
objectClass: organizationalUnit
ou: groups
EOF

ldapadd -x -D "cn=admin,$LDAP_BASE" -w "$ADMIN_PASS" -f /tmp/base.ldif
rm /tmp/base.ldif

# Guardar configuración
mkdir -p /etc/uninet

# Detectar IP de Tailscale automáticamente
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -z "$TAILSCALE_IP" ]; then
    echo -e "${YELLOW}⚠️  Tailscale no detectado, usando localhost${NC}"
    LDAP_URI="ldap://localhost:389"
else
    echo -e "${GREEN}✅ Tailscale detectado: $TAILSCALE_IP${NC}"
    LDAP_URI="ldap://$TAILSCALE_IP:389"
fi

cat > /etc/uninet/ldap.conf << EOF
LDAP_URI=$LDAP_URI
LDAP_BASE=$LDAP_BASE
LDAP_ADMIN=cn=admin,$LDAP_BASE
LDAP_DOMAIN=$DOMAIN
LDAP_GROUPS_BASE=ou=groups,$LDAP_BASE
EOF

# Guardar contraseña de admin de forma segura (para uso automático de scripts)
echo "$ADMIN_PASS" > /etc/uninet/ldap_admin_pass
chmod 640 /etc/uninet/ldap_admin_pass
chown root:$BACKEND_USER /etc/uninet/ldap_admin_pass

echo ""
echo "============================================================"
echo -e "  ${GREEN}✅ OpenLDAP instalado correctamente${NC}"
echo "============================================================"
echo ""
echo "📝 Información de conexión:"
echo "   Base DN: $LDAP_BASE"
echo "   Admin DN: cn=admin,$LDAP_BASE"
echo "   URI: $LDAP_URI"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Crear usuarios con: ./create-user.sh"
echo "   2. Listar usuarios con: ./list-users.sh"
echo ""
