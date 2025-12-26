#!/bin/bash
#
# UniNet - Script para eliminar usuario LDAP
# Uso: ./delete-user.sh <username>
#

# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/ldap.conf

# Validar argumentos
if [ $# -lt 1 ]; then
    echo "Uso: $0 <username>" >&2
    exit 1
fi

USERNAME=$1
USER_DN="uid=$USERNAME,ou=users,$LDAP_BASE"

# Verificar que el usuario existe
if ! ldapsearch -x -b "$USER_DN" "(objectClass=*)" dn 2>/dev/null | grep -q "^dn: "; then
    echo "❌ Error: Usuario $USERNAME no encontrado" >&2
    exit 1
fi

# Pedir contraseña de admin LDAP
ADMIN_PASS=${LDAP_ADMIN_PASSWORD:-$(cat /etc/uninet/ldap_admin_pass 2>/dev/null || echo "")}
if [ -z "$ADMIN_PASS" ]; then
    read -sp "Contraseña de admin LDAP: " ADMIN_PASS
    echo ""
fi

# Eliminar usuario
if ldapdelete -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" "$USER_DN" 2>/dev/null; then
    echo "✅ Usuario $USERNAME eliminado exitosamente"
    exit 0
else
    echo "❌ Error al eliminar usuario $USERNAME" >&2
    exit 1
fi
