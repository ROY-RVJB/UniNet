#!/bin/bash
#
# UniNet - Script para eliminar usuario LDAP
# Uso: ./delete-user.sh <username>
#

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Timeout para operaciones LDAP (en segundos)
LDAP_TIMEOUT=5

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

# Intentar usar ldapi:// primero (más confiable), luego ldap://
LDAP_URI_TO_USE=""
if [ -z "$LDAP_URI" ] || [ "$LDAP_URI" == "ldap://localhost:389" ]; then
    # Probar ldapi:// (unix socket) primero
    if timeout $LDAP_TIMEOUT ldapsearch -x -H ldapi:/// -b "dc=uninet,dc=com" "(objectClass=*)" dn &>/dev/null; then
        LDAP_URI_TO_USE="ldapi:///"
    else
        LDAP_URI_TO_USE="ldap://localhost:389"
    fi
else
    LDAP_URI_TO_USE="$LDAP_URI"
fi

# Verificar que el usuario existe (con timeout)
if ! timeout $LDAP_TIMEOUT ldapsearch -x -H "$LDAP_URI_TO_USE" -b "$USER_DN" "(objectClass=*)" dn 2>/dev/null | grep -q "^dn: "; then
    echo "❌ Error: Usuario $USERNAME no encontrado o LDAP no responde" >&2
    exit 1
fi

# Obtener contraseña de admin LDAP (primero variable, luego archivo)
ADMIN_PASS=${LDAP_ADMIN_PASSWORD:-$(cat /etc/uninet/ldap_admin_pass 2>/dev/null || echo "")}

# Si no hay contraseña disponible, error
if [ -z "$ADMIN_PASS" ]; then
    echo "❌ Error: No se pudo obtener la contraseña de admin LDAP" >&2
    echo "   Verifica que existe /etc/uninet/ldap_admin_pass o define LDAP_ADMIN_PASSWORD" >&2
    exit 1
fi

# Eliminar usuario (con timeout)
if timeout $LDAP_TIMEOUT ldapdelete -x -H "$LDAP_URI_TO_USE" -D "$LDAP_ADMIN" -w "$ADMIN_PASS" "$USER_DN" 2>&1; then
    echo "✅ Usuario $USERNAME eliminado exitosamente"
    exit 0
else
    EXITCODE=$?
    if [ $EXITCODE -eq 124 ]; then
        echo "❌ Error: Timeout al conectar con LDAP server" >&2
    else
        echo "❌ Error al eliminar usuario $USERNAME (código: $EXITCODE)" >&2
    fi
    exit 1
fi
