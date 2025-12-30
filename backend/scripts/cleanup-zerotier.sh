#!/bin/bash

# ============================================================
# UniNet - Script de Limpieza de ZeroTier
# ============================================================
# Este script elimina completamente ZeroTier del sistema
# para evitar conflictos al migrar a Tailscale
#
# Uso: sudo ./cleanup-zerotier.sh
# ============================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "============================================"
echo "🧹 UniNet - Limpieza de ZeroTier"
echo "============================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Error: Este script debe ejecutarse como root (sudo)${NC}"
    exit 1
fi

# Verificar si ZeroTier está instalado
if ! command -v zerotier-cli &> /dev/null && ! systemctl list-units --full -all 2>/dev/null | grep -q zerotier; then
    echo -e "${GREEN}✅ ZeroTier no está instalado${NC}"
    echo ""
    echo "No hay nada que limpiar."
    exit 0
fi

echo -e "${YELLOW}⚠️  ZeroTier detectado en el sistema${NC}"
echo ""
echo "Este script eliminará:"
echo "  • Servicio zerotier-one"
echo "  • Paquete zerotier-one"
echo "  • Configuraciones en /var/lib/zerotier-one"
echo "  • Repositorio APT de ZeroTier"
echo "  • Claves GPG de ZeroTier"
echo ""

read -p "¿Deseas continuar? (s/n): " CONFIRMAR

if [ "$CONFIRMAR" != "s" ] && [ "$CONFIRMAR" != "S" ]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Eliminando ZeroTier...${NC}"

# Paso 1: Detener el servicio
echo ""
echo "1️⃣  Deteniendo servicio zerotier-one..."
if systemctl is-active --quiet zerotier-one 2>/dev/null; then
    systemctl stop zerotier-one
    echo -e "   ${GREEN}✓ Servicio detenido${NC}"
else
    echo -e "   ${YELLOW}⚠️  Servicio no estaba corriendo${NC}"
fi

# Deshabilitar inicio automático
if systemctl is-enabled --quiet zerotier-one 2>/dev/null; then
    systemctl disable zerotier-one
    echo -e "   ${GREEN}✓ Inicio automático deshabilitado${NC}"
fi

# Paso 2: Desinstalar el paquete
echo ""
echo "2️⃣  Desinstalando paquete zerotier-one..."
if dpkg -l | grep -q zerotier-one; then
    apt-get remove --purge zerotier-one -y
    echo -e "   ${GREEN}✓ Paquete desinstalado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Paquete no estaba instalado${NC}"
fi

# Paso 3: Eliminar archivos de configuración
echo ""
echo "3️⃣  Eliminando archivos de configuración..."
if [ -d "/var/lib/zerotier-one" ]; then
    rm -rf /var/lib/zerotier-one
    echo -e "   ${GREEN}✓ /var/lib/zerotier-one eliminado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Directorio no existía${NC}"
fi

# Paso 4: Eliminar repositorio APT
echo ""
echo "4️⃣  Eliminando repositorio APT..."
REPO_REMOVED=false

if [ -f "/etc/apt/sources.list.d/zerotier.list" ]; then
    rm -f /etc/apt/sources.list.d/zerotier.list
    echo -e "   ${GREEN}✓ zerotier.list eliminado${NC}"
    REPO_REMOVED=true
fi

# Buscar otros archivos relacionados
for file in /etc/apt/sources.list.d/*zerotier*; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo -e "   ${GREEN}✓ $(basename "$file") eliminado${NC}"
        REPO_REMOVED=true
    fi
done

if [ "$REPO_REMOVED" = false ]; then
    echo -e "   ${YELLOW}⚠️  Repositorio no estaba configurado${NC}"
fi

# Paso 5: Eliminar claves GPG
echo ""
echo "5️⃣  Eliminando claves GPG..."
GPG_REMOVED=false

if [ -f "/etc/apt/trusted.gpg.d/zerotier.gpg" ]; then
    rm -f /etc/apt/trusted.gpg.d/zerotier.gpg
    echo -e "   ${GREEN}✓ zerotier.gpg eliminado${NC}"
    GPG_REMOVED=true
fi

# Buscar otras claves relacionadas
for key in /etc/apt/trusted.gpg.d/*zerotier*; do
    if [ -f "$key" ]; then
        rm -f "$key"
        echo -e "   ${GREEN}✓ $(basename "$key") eliminado${NC}"
        GPG_REMOVED=true
    fi
done

if [ "$GPG_REMOVED" = false ]; then
    echo -e "   ${YELLOW}⚠️  Claves GPG no encontradas${NC}"
fi

# Paso 6: Actualizar lista de paquetes
echo ""
echo "6️⃣  Actualizando lista de paquetes..."
apt-get update -qq
echo -e "   ${GREEN}✓ Lista de paquetes actualizada${NC}"

# Verificación final
echo ""
echo "============================================"
echo -e "${GREEN}✅ Limpieza completada${NC}"
echo "============================================"
echo ""

# Verificar que ZeroTier ya no está
if command -v zerotier-cli &> /dev/null; then
    echo -e "${RED}⚠️  Advertencia: zerotier-cli aún está disponible${NC}"
    echo "   Es posible que necesites reiniciar el sistema."
else
    echo -e "${GREEN}✅ ZeroTier completamente eliminado${NC}"
fi

# Verificar repositorios
if apt-cache policy 2>/dev/null | grep -q zerotier; then
    echo -e "${YELLOW}⚠️  Advertencia: Repositorio de ZeroTier aún aparece en la caché${NC}"
    echo "   Ejecuta: sudo apt-get clean"
else
    echo -e "${GREEN}✅ Repositorios limpios${NC}"
fi

echo ""
echo "💡 Siguiente paso: Instalar Tailscale"
echo "   curl -fsSL https://tailscale.com/install.sh | sh"
echo "   sudo tailscale up --authkey=TU-AUTH-KEY"
echo ""
