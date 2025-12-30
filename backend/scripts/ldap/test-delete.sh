#!/bin/bash
#
# Script de prueba para diagnosticar problemas de eliminación LDAP
#

echo "=========================================="
echo "  Diagnóstico de Eliminación LDAP"
echo "=========================================="
echo ""

# 1. Verificar archivos de configuración
echo "1. Verificando archivos de configuración..."
if [ -f /etc/uninet/ldap.conf ]; then
    echo "   ✅ /etc/uninet/ldap.conf existe"
    source /etc/uninet/ldap.conf
    echo "   LDAP_BASE: $LDAP_BASE"
    echo "   LDAP_ADMIN: $LDAP_ADMIN"
else
    echo "   ❌ /etc/uninet/ldap.conf NO existe"
    exit 1
fi

if [ -f /etc/uninet/ldap_admin_pass ]; then
    echo "   ✅ /etc/uninet/ldap_admin_pass existe"
    ADMIN_PASS=$(cat /etc/uninet/ldap_admin_pass)
else
    echo "   ❌ /etc/uninet/ldap_admin_pass NO existe"
    exit 1
fi

echo ""

# 2. Probar conexión LDAP
echo "2. Probando conexión LDAP..."
if ldapsearch -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -b "$LDAP_BASE" "(uid=*)" uid 2>&1 | grep -q "^dn:"; then
    echo "   ✅ Conexión LDAP exitosa"
else
    echo "   ❌ Error de conexión LDAP"
    echo "   Intentando sin autenticación..."
    ldapsearch -x -b "$LDAP_BASE" "(uid=*)" uid 2>&1 | head -20
    exit 1
fi

echo ""

# 3. Listar usuarios disponibles
echo "3. Usuarios LDAP disponibles:"
ldapsearch -x -b "ou=users,$LDAP_BASE" "(uid=*)" uid 2>/dev/null | grep "^uid:" | awk '{print "   - " $2}'

echo ""

# 4. Pedir usuario a eliminar (o usar argumento)
if [ -n "$1" ]; then
    USERNAME=$1
else
    read -p "Ingresa el username a eliminar (o Enter para cancelar): " USERNAME
    if [ -z "$USERNAME" ]; then
        echo "Cancelado"
        exit 0
    fi
fi

USER_DN="uid=$USERNAME,ou=users,$LDAP_BASE"

echo ""
echo "4. Verificando usuario '$USERNAME'..."

# Verificar que existe
if ldapsearch -x -b "$USER_DN" "(objectClass=*)" dn 2>/dev/null | grep -q "^dn: "; then
    echo "   ✅ Usuario existe"
    ldapsearch -x -b "$USER_DN" "(objectClass=*)" 2>/dev/null | head -15
else
    echo "   ❌ Usuario NO existe"
    exit 1
fi

echo ""

# 5. Intentar eliminar
read -p "¿Eliminar este usuario? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Cancelado"
    exit 0
fi

echo ""
echo "5. Eliminando usuario..."
echo "   Comando: ldapdelete -x -D \"$LDAP_ADMIN\" -w \"***\" \"$USER_DN\""

# Ejecutar con output completo
if ldapdelete -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" "$USER_DN" 2>&1; then
    echo ""
    echo "   ✅ Usuario eliminado exitosamente"
    exit 0
else
    EXITCODE=$?
    echo ""
    echo "   ❌ Error al eliminar (código: $EXITCODE)"
    exit 1
fi
