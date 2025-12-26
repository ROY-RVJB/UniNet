#!/bin/bash
#
# UniNet - Script de Configuración de Permisos
# Configura automáticamente los permisos necesarios para la creación de usuarios LDAP
#

set -e  # Salir si hay algún error

UNINET_DIR="/etc/uninet"
ADMIN_PASS_FILE="$UNINET_DIR/ldap_admin_pass"
UID_FILE="$UNINET_DIR/last_uid"

echo "============================================"
echo "  UniNet - Configuración de Permisos"
echo "============================================"
echo ""

# Verificar que se ejecuta con sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script debe ejecutarse con sudo"
    echo "   Uso: sudo bash setup-permissions.sh [usuario]"
    echo ""
    echo "   Ejemplo: sudo bash setup-permissions.sh $(whoami)"
    exit 1
fi

# Detectar usuario automáticamente
if [ -n "$1" ]; then
    BACKEND_USER="$1"
    echo "👤 Usuario especificado: $BACKEND_USER"
else
    # Usar $SUDO_USER si está disponible (quien ejecutó sudo)
    if [ -n "$SUDO_USER" ]; then
        BACKEND_USER="$SUDO_USER"
        echo "👤 Usuario detectado automáticamente: $BACKEND_USER (quien ejecutó sudo)"
    else
        echo "❌ No se pudo detectar el usuario automáticamente"
        echo "   Uso: sudo bash setup-permissions.sh <usuario>"
        echo ""
        echo "   Ejemplo: sudo bash setup-permissions.sh miusuario"
        exit 1
    fi
fi

# Verificar que el usuario existe
if ! id "$BACKEND_USER" &>/dev/null; then
    echo "❌ El usuario '$BACKEND_USER' no existe en el sistema"
    exit 1
fi

echo ""

# 1. Crear directorio si no existe
echo "📁 Creando directorio $UNINET_DIR..."
mkdir -p "$UNINET_DIR"
echo "   ✅ Directorio creado/verificado"
echo ""

# 2. Configurar archivo de contraseña admin LDAP
echo "🔐 Configurando archivo de contraseña admin LDAP..."
if [ ! -f "$ADMIN_PASS_FILE" ]; then
    echo "   ⚠️  Archivo $ADMIN_PASS_FILE no existe"
    read -sp "   Ingresa la contraseña del admin LDAP: " LDAP_PASS
    echo ""
    echo "$LDAP_PASS" > "$ADMIN_PASS_FILE"
    echo "   ✅ Archivo de contraseña creado"
else
    echo "   ℹ️  Archivo ya existe, configurando permisos..."
fi

chown "$BACKEND_USER:$BACKEND_USER" "$ADMIN_PASS_FILE"
chmod 600 "$ADMIN_PASS_FILE"
echo "   ✅ Permisos configurados (owner: $BACKEND_USER, mode: 600)"
echo ""

# 3. Configurar archivo contador de UID
echo "🔢 Configurando archivo contador de UID..."
if [ ! -f "$UID_FILE" ]; then
    echo "   ⚠️  Archivo $UID_FILE no existe"
    echo "   🔍 Buscando el último UID en LDAP..."
    
    # Leer configuración LDAP si existe
    if [ -f "/etc/uninet/ldap.conf" ]; then
        source /etc/uninet/ldap.conf
        LAST_UID=$(ldapsearch -x -LLL -b "$LDAP_BASE" "(objectClass=posixAccount)" uidNumber 2>/dev/null | grep "^uidNumber:" | awk '{print $2}' | sort -n | tail -1)
        
        if [ -n "$LAST_UID" ]; then
            echo "$LAST_UID" > "$UID_FILE"
            echo "   ✅ Contador inicializado en $LAST_UID (último UID en LDAP)"
        else
            echo "10000" > "$UID_FILE"
            echo "   ✅ Contador inicializado en 10000 (no hay usuarios en LDAP)"
        fi
    else
        echo "10000" > "$UID_FILE"
        echo "   ✅ Contador inicializado en 10000 (ldap.conf no encontrado)"
        echo "   ⚠️  IMPORTANTE: El script create-user.sh buscará el último UID al crear el primer usuario"
    fi
else
    CURRENT_UID=$(cat "$UID_FILE")
    echo "   ℹ️  Contador actual: $CURRENT_UID (no se modifica)"
fi

chown "$BACKEND_USER:$BACKEND_USER" "$UID_FILE"
chmod 644 "$UID_FILE"
echo "   ✅ Permisos configurados (owner: $BACKEND_USER, mode: 644)"
echo ""

# 4. Crear directorio de logs del proyecto
BACKEND_DIR=$(cd "$(dirname "$0")/.." && pwd)
LOGS_DIR="$BACKEND_DIR/logs"
echo "📝 Configurando directorio de logs..."
mkdir -p "$LOGS_DIR"
chown "$BACKEND_USER:$BACKEND_USER" "$LOGS_DIR"
chmod 755 "$LOGS_DIR"
echo "   ✅ Directorio de logs creado: $LOGS_DIR"
echo ""

# 5. Verificación final
echo "✨ Verificando configuración..."
echo ""
ls -la "$UNINET_DIR"
echo ""

# 5. Validar permisos
ERRORS=0

if [ ! -f "$ADMIN_PASS_FILE" ]; then
    echo "❌ ERROR: $ADMIN_PASS_FILE no existe"
    ERRORS=$((ERRORS + 1))
elif [ "$(stat -c '%U' "$ADMIN_PASS_FILE")" != "$BACKEND_USER" ]; then
    echo "❌ ERROR: $ADMIN_PASS_FILE no pertenece a $BACKEND_USER"
    ERRORS=$((ERRORS + 1))
elif [ "$(stat -c '%a' "$ADMIN_PASS_FILE")" != "600" ]; then
    echo "❌ ERROR: $ADMIN_PASS_FILE no tiene permisos 600"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -f "$UID_FILE" ]; then
    echo "❌ ERROR: $UID_FILE no existe"
    ERRORS=$((ERRORS + 1))
elif [ "$(stat -c '%U' "$UID_FILE")" != "$BACKEND_USER" ]; then
    echo "❌ ERROR: $UID_FILE no pertenece a $BACKEND_USER"
    ERRORS=$((ERRORS + 1))
elif [ "$(stat -c '%a' "$UID_FILE")" != "644" ]; then
    echo "❌ ERROR: $UID_FILE no tiene permisos 644"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "============================================"
    echo "✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE"
    echo "============================================"
    echo ""
    echo "📋 Archivos configurados:"
    echo "   • $ADMIN_PASS_FILE (600, owner: $BACKEND_USER)"
    echo "   • $UID_FILE (644, owner: $BACKEND_USER)"
    echo "   • $LOGS_DIR/ (755, owner: $BACKEND_USER)"
    echo ""
    echo "🚀 Ahora puedes iniciar el backend:"
    echo "   cd $(dirname "$BACKEND_DIR")"
    echo "   ./start-server.sh"
    echo ""
else
    echo "============================================"
    echo "❌ CONFIGURACIÓN INCOMPLETA"
    echo "============================================"
    echo ""
    echo "Se encontraron $ERRORS errores. Por favor revisa los mensajes anteriores."
    exit 1
fi
