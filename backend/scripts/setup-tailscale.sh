#!/bin/bash

# UniNet - Script de instalación y configuración de Tailscale
# Este script instala Tailscale, lo configura y ajusta el firewall automáticamente
# Uso: sudo ./setup-tailscale.sh [AUTH_KEY]

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================"
echo "🌐 UniNet - Configuración de Tailscale"
echo "============================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Error: Este script debe ejecutarse como root (sudo)${NC}"
    exit 1
fi

# Detectar si ya está instalado
if command -v tailscale &> /dev/null; then
    echo -e "${GREEN}✅ Tailscale ya está instalado${NC}"
    TAILSCALE_VERSION=$(tailscale version | head -n1)
    echo "   Versión: $TAILSCALE_VERSION"
else
    echo -e "${BLUE}📦 Instalando Tailscale...${NC}"
    curl -fsSL https://tailscale.com/install.sh | sh
    echo -e "${GREEN}✅ Tailscale instalado${NC}"
fi

echo ""

# Verificar si ya está conectado
CURRENT_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$CURRENT_IP" ]; then
    echo -e "${GREEN}✅ Tailscale ya está conectado${NC}"
    echo "   IP actual: $CURRENT_IP"
    echo ""
    echo "Para reconectar, ejecuta:"
    echo "   sudo tailscale down"
    echo "   sudo tailscale up"
else
    echo -e "${BLUE}🔗 Conectando a Tailscale...${NC}"
    echo ""
    
    # Verificar si se pasó un Auth Key como argumento
    AUTH_KEY="$1"
    
    if [ -n "$AUTH_KEY" ]; then
        echo -e "${BLUE}🔑 Usando Auth Key proporcionada...${NC}"
        tailscale up --authkey="$AUTH_KEY"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Conectado exitosamente${NC}"
        else
            echo -e "${RED}❌ Error al conectar con el Auth Key${NC}"
            exit 1
        fi
    else
        echo -e "${BLUE}🔐 Iniciando proceso de autenticación manual...${NC}"
        echo ""
        echo "Se abrirá un enlace de autenticación."
        echo ""
        echo -e "${YELLOW}IMPORTANTE:${NC}"
        echo "  • Si eres el administrador (Alex), inicia sesión normalmente"
        echo "  • Si fuiste invitado, selecciona 'Join [nombre]'s tailnet'"
        echo ""
        
        tailscale up
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Conectado exitosamente${NC}"
        else
            echo -e "${RED}❌ Error al conectar${NC}"
            exit 1
        fi
    fi
fi

echo ""

# Obtener IP asignada
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -z "$TAILSCALE_IP" ]; then
    echo -e "${RED}❌ No se pudo obtener la IP de Tailscale${NC}"
    exit 1
fi

echo -e "${GREEN}📍 IP de Tailscale asignada: ${BLUE}$TAILSCALE_IP${NC}"
echo ""

# Configurar firewall (UFW)
if command -v ufw &> /dev/null; then
    echo -e "${BLUE}🔥 Configurando firewall (UFW)...${NC}"
    
    # Permitir tráfico en la interfaz de Tailscale
    ufw allow in on tailscale0
    echo -e "   ${GREEN}✓ Tráfico en tailscale0 permitido${NC}"
    
    # Permitir puerto 4000 (FastAPI)
    ufw allow 4000/tcp
    echo -e "   ${GREEN}✓ Puerto 4000/tcp abierto (FastAPI)${NC}"
    
    # Permitir puerto 389 (LDAP) si slapd está instalado
    if command -v slapd &> /dev/null; then
        ufw allow 389/tcp
        echo -e "   ${GREEN}✓ Puerto 389/tcp abierto (LDAP)${NC}"
    fi
    
    # Asegurar que UFW esté activo
    ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configurado${NC}"
else
    echo -e "${YELLOW}⚠️  UFW no está instalado, omitiendo configuración de firewall${NC}"
fi

echo ""

# Habilitar inicio automático
echo -e "${BLUE}⚙️  Configurando inicio automático...${NC}"
systemctl enable tailscaled
systemctl start tailscaled
echo -e "${GREEN}✅ Tailscale se iniciará automáticamente${NC}"

echo ""
echo "============================================"
echo "  ✅ Configuración completada"
echo "============================================"
echo ""
echo "📋 Información de tu dispositivo:"
echo "   • Hostname: $(hostname)"
echo "   • IP de Tailscale: $TAILSCALE_IP"
echo ""
echo "🔗 URLs de acceso:"
echo "   • Backend: http://$TAILSCALE_IP:4000"
echo "   • Health check: http://$TAILSCALE_IP:4000/health"
echo "   • Docs API: http://$TAILSCALE_IP:4000/docs"
echo ""
echo "📝 Comandos útiles:"
echo "   • Ver estado:     tailscale status"
echo "   • Ver IP:         tailscale ip -4"
echo "   • Desconectar:    sudo tailscale down"
echo "   • Reconectar:     sudo tailscale up"
echo "   • Ver logs:       sudo journalctl -u tailscaled -f"
echo ""
echo "🌐 Panel web de administración:"
echo "   https://login.tailscale.com/admin/machines"
echo ""
echo "💡 Para instalar clientes, usa:"
echo -e "   ${GREEN}SERVER_IP=$TAILSCALE_IP CARRERA=5010 curl -sSL http://$TAILSCALE_IP:4000/install | sudo -E bash${NC}"
echo ""
