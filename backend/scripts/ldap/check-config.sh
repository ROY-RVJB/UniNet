#!/bin/bash
#
# UniNet - Script para verificar y actualizar configuración LDAP
# Asegura que ldap.conf tenga todos los campos necesarios
#

CONFIG_FILE="/etc/uninet/ldap.conf"
BACKUP_FILE="/etc/uninet/ldap.conf.backup"

if [ "$EUID" -ne 0 ]; then 
    echo "Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE no existe. Ejecuta setup.sh primero."
    exit 1
fi

echo "=== Verificando configuración LDAP ==="
echo ""

# Leer configuración actual
source "$CONFIG_FILE"

NEEDS_UPDATE=false

# Verificar cada campo necesario
if [ -z "$LDAP_URI" ]; then
    echo "⚠️  Falta LDAP_URI"
    LDAP_URI="ldap://localhost:389"
    NEEDS_UPDATE=true
fi

if [ -z "$LDAP_GROUPS_BASE" ]; then
    echo "⚠️  Falta LDAP_GROUPS_BASE"
    LDAP_GROUPS_BASE="ou=groups,$LDAP_BASE"
    NEEDS_UPDATE=true
fi

if [ "$NEEDS_UPDATE" = true ]; then
    echo ""
    echo "📝 Actualizando configuración..."
    
    # Hacer backup
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "   Backup guardado en: $BACKUP_FILE"
    
    # Escribir nueva configuración
    cat > "$CONFIG_FILE" << EOF
LDAP_URI=$LDAP_URI
LDAP_BASE=$LDAP_BASE
LDAP_ADMIN=$LDAP_ADMIN
LDAP_DOMAIN=$LDAP_DOMAIN
LDAP_GROUPS_BASE=$LDAP_GROUPS_BASE
EOF
    
    echo "   ✅ Configuración actualizada"
else
    echo "✅ Configuración correcta"
fi

echo ""
echo "📋 Configuración actual:"
cat "$CONFIG_FILE"
echo ""

# Verificar estructura LDAP
echo "=== Verificando estructura LDAP ==="
echo ""

# Verificar conexión
if timeout 3 ldapsearch -x -H "$LDAP_URI" -b "$LDAP_BASE" -LLL -s base "(objectClass=*)" dn &>/dev/null; then
    echo "✅ Conexión a LDAP OK"
else
    echo "❌ No se puede conectar a LDAP"
    exit 1
fi

# Verificar ou=users
if timeout 3 ldapsearch -x -H "$LDAP_URI" -b "ou=users,$LDAP_BASE" -LLL -s base "(objectClass=*)" dn &>/dev/null; then
    USER_COUNT=$(timeout 3 ldapsearch -x -H "$LDAP_URI" -b "ou=users,$LDAP_BASE" -LLL "(objectClass=posixAccount)" dn 2>/dev/null | grep -c "^dn:")
    echo "✅ ou=users existe ($USER_COUNT usuarios)"
else
    echo "❌ ou=users no existe"
fi

# Verificar ou=groups
if timeout 3 ldapsearch -x -H "$LDAP_URI" -b "ou=groups,$LDAP_BASE" -LLL -s base "(objectClass=*)" dn &>/dev/null; then
    GROUP_COUNT=$(timeout 3 ldapsearch -x -H "$LDAP_URI" -b "ou=groups,$LDAP_BASE" -LLL "(objectClass=posixGroup)" dn 2>/dev/null | grep -c "^dn:")
    if [ "$GROUP_COUNT" -eq 0 ]; then
        echo "⚠️  ou=groups existe pero está vacío (sin carreras)"
    else
        echo "✅ ou=groups existe ($GROUP_COUNT grupos)"
    fi
else
    echo "❌ ou=groups no existe"
fi

echo ""
echo "=== Verificación completa ==="
