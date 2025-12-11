#!/bin/bash
#
# UniNet - Script para crear usuario LDAP
# Uso: ./create-user.sh <username> <full_name> <password> [email]
#

# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/ldap.conf

# Validar argumentos
if [ $# -lt 3 ]; then
    echo "Uso: $0 <username> <full_name> <password> [email]" >&2
    exit 1
fi

USERNAME=$1
FULL_NAME=$2
PASSWORD=$3
EMAIL=${4:-"$USERNAME@$LDAP_DOMAIN"}

# Generar UID numérico único
LAST_UID=$(ldapsearch -x -b "$LDAP_BASE" "(objectClass=posixAccount)" uidNumber 2>/dev/null | grep "uidNumber:" | awk '{print $2}' | sort -n | tail -1)
if [ -z "$LAST_UID" ]; then
    UID_NUMBER=10000
else
    UID_NUMBER=$((LAST_UID + 1))
fi

# Pedir contraseña de admin LDAP
ADMIN_PASS=${LDAP_ADMIN_PASSWORD:-$(cat /etc/uninet/ldap_admin_pass 2>/dev/null || echo "")}
if [ -z "$ADMIN_PASS" ]; then
    read -sp "Contraseña de admin LDAP: " ADMIN_PASS
    echo ""
fi

# Crear archivo LDIF temporal
TEMP_LDIF=$(mktemp)
cat > "$TEMP_LDIF" << EOF
dn: uid=$USERNAME,ou=users,$LDAP_BASE
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: $USERNAME
cn: $FULL_NAME
sn: Usuario
givenName: $FULL_NAME
mail: $EMAIL
uidNumber: $UID_NUMBER
gidNumber: 5000
homeDirectory: /home/$USERNAME
loginShell: /bin/bash
userPassword: $(slappasswd -s "$PASSWORD")
EOF

# Agregar usuario a LDAP
if ldapadd -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -f "$TEMP_LDIF" 2>/dev/null; then
    rm "$TEMP_LDIF"
    echo "✅ Usuario $USERNAME creado exitosamente"
    echo "   UID: $UID_NUMBER"
    echo "   Email: $EMAIL"
    echo "   DN: uid=$USERNAME,ou=users,$LDAP_BASE"
    exit 0
else
    rm "$TEMP_LDIF"
    echo "❌ Error al crear usuario $USERNAME" >&2
    exit 1
fi
