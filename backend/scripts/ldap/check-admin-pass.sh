#!/bin/bash
#
# UniNet - Verificar/Crear archivo de contraseña admin LDAP
# Este script ayuda a configurar el archivo de contraseña si no existe
#

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASS_FILE="/etc/uninet/ldap_admin_pass"

# Verificar si existe
if [ -f "$PASS_FILE" ]; then
    echo -e "${GREEN}✅ Archivo de contraseña existe: $PASS_FILE${NC}"
    exit 0
fi

# No existe - ayudar a crearlo
echo -e "${YELLOW}⚠️  Archivo de contraseña no encontrado${NC}"
echo ""
echo "Este archivo es necesario para que la API pueda crear/modificar/eliminar usuarios."
echo ""
read -sp "Ingresa la contraseña del admin LDAP (cn=admin): " ADMIN_PASS
echo ""

if [ -z "$ADMIN_PASS" ]; then
    echo -e "${RED}❌ Error: No se ingresó contraseña${NC}"
    exit 1
fi

# Crear directorio si no existe
mkdir -p /etc/uninet

# Guardar contraseña
echo "$ADMIN_PASS" > "$PASS_FILE"
chmod 600 "$PASS_FILE"
chown root:root "$PASS_FILE"

echo -e "${GREEN}✅ Archivo de contraseña creado exitosamente${NC}"
echo "   Ubicación: $PASS_FILE"
echo "   Permisos: 600 (solo root puede leer)"
