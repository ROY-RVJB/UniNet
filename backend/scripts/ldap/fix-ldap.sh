#!/bin/bash
#
# Fix rápido para problema de LDAP no responde
#

echo "======================================"
echo "  Fix LDAP - UniNet"
echo "======================================"
echo ""

# 1. Verificar si slapd está escuchando en el puerto correcto
echo "1. Verificando configuración de slapd..."
if [ -f /etc/default/slapd ]; then
    CURRENT_CONFIG=$(grep "^SLAPD_SERVICES=" /etc/default/slapd)
    echo "   Configuración actual: $CURRENT_CONFIG"
    
    if echo "$CURRENT_CONFIG" | grep -q "ldap://"; then
        echo "   ✅ Ya está configurado para TCP"
    else
        echo "   ⚠️  Necesita configuración"
        echo ""
        read -p "¿Configurar slapd para escuchar en TCP? (y/n): " CONFIRM
        if [ "$CONFIRM" == "y" ]; then
            sudo sed -i 's|^SLAPD_SERVICES=.*|SLAPD_SERVICES="ldap://0.0.0.0:389/ ldapi:///"|' /etc/default/slapd
            echo "   ✅ Configuración actualizada"
            sudo systemctl restart slapd
            echo "   ✅ Servicio reiniciado"
        fi
    fi
else
    echo "   ⚠️  Archivo /etc/default/slapd no encontrado"
fi

echo ""

# 2. Probar conexión
echo "2. Probando conexiones LDAP..."

echo "   Probando ldapi:// (unix socket)..."
if timeout 3 ldapsearch -x -H ldapi:/// -b "dc=uninet,dc=com" "(objectClass=*)" dn &>/dev/null; then
    echo "   ✅ ldapi:// funciona"
else
    echo "   ❌ ldapi:// NO funciona"
fi

echo "   Probando ldap://localhost:389 (TCP)..."
if timeout 3 ldapsearch -x -H ldap://localhost:389 -b "dc=uninet,dc=com" "(objectClass=*)" dn &>/dev/null; then
    echo "   ✅ ldap://localhost:389 funciona"
else
    echo "   ❌ ldap://localhost:389 NO funciona"
fi

echo ""

# 3. Arreglar permisos del archivo de contraseña
echo "3. Verificando permisos de archivo de contraseña..."
if [ -f /etc/uninet/ldap_admin_pass ]; then
    CURRENT_PERMS=$(stat -c "%a %U:%G" /etc/uninet/ldap_admin_pass)
    echo "   Permisos actuales: $CURRENT_PERMS"
    
    if [ "$CURRENT_PERMS" != "600 root:root" ]; then
        echo "   ⚠️  Permisos incorrectos"
        read -p "¿Corregir permisos? (y/n): " CONFIRM
        if [ "$CONFIRM" == "y" ]; then
            sudo chown root:root /etc/uninet/ldap_admin_pass
            sudo chmod 600 /etc/uninet/ldap_admin_pass
            echo "   ✅ Permisos corregidos"
        fi
    else
        echo "   ✅ Permisos correctos"
    fi
else
    echo "   ❌ Archivo no existe: /etc/uninet/ldap_admin_pass"
    echo "   Ejecuta: sudo bash backend/scripts/ldap/check-admin-pass.sh"
fi

echo ""
echo "======================================"
echo "  Prueba de eliminación"
echo "======================================"
echo ""

# Probar eliminación con un usuario de prueba
echo "Para probar, ejecuta:"
echo "  cd ~/UniNet/backend/scripts/ldap"
echo "  sudo bash delete-user.sh NOMBRE_USUARIO"
