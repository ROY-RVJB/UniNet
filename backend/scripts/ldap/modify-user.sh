#!/bin/bash
#
# UniNet - Script para modificar usuario LDAP
# Uso: ./modify-user.sh <username> <attribute> <new_value>
# Ejemplo: ./modify-user.sh alumno01 mail nuevoemail@uninet.com
#

# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/ldap.conf

# Validar argumentos
if [ $# -lt 3 ]; then
    echo "Uso: $0 <username> <attribute> <new_value>" >&2
    echo "Atributos válidos: cn (nombre), mail (email), loginShell, userPassword" >&2
    exit 1
fi

USERNAME=$1
ATTRIBUTE=$2
NEW_VALUE=$3
USER_DN="uid=$USERNAME,ou=users,$LDAP_BASE"

# Verificar que el usuario existe
if ! ldapsearch -x -b "$USER_DN" "(objectClass=*)" dn 2>/dev/null | grep -q "^dn: "; then
    echo "❌ Error: Usuario $USERNAME no encontrado" >&2
    exit 1
fi

# Pedir contraseña de admin LDAP
read -sp "Contraseña de admin LDAP: " ADMIN_PASS
echo ""

# Si es contraseña, encriptarla
if [ "$ATTRIBUTE" == "userPassword" ]; then
    NEW_VALUE=$(slappasswd -s "$NEW_VALUE")
fi

# Crear archivo LDIF de modificación
TEMP_LDIF=$(mktemp)
cat > "$TEMP_LDIF" << EOF
dn: $USER_DN
changetype: modify
replace: $ATTRIBUTE
$ATTRIBUTE: $NEW_VALUE
EOF

# Aplicar modificación
if ldapmodify -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -f "$TEMP_LDIF" 2>/dev/null; then
    rm "$TEMP_LDIF"
    echo "✅ Usuario $USERNAME modificado exitosamente"
    echo "   $ATTRIBUTE: $NEW_VALUE"
    exit 0
else
    rm "$TEMP_LDIF"
    echo "❌ Error al modificar usuario $USERNAME" >&2
    exit 1
fi
