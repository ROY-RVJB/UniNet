#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================================"
echo "  Status Server - UniNet Dashboard"
echo "  Instalación y configuración"
echo "============================================================"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ejecutando como root${NC}"
echo ""
echo "📦 Actualizando repositorios del sistema..."
apt update

# Instalar Python 3 y herramientas necesarias
echo ""
echo "🐍 Verificando Python 3..."
if command -v python3 &> /dev/null; then
    echo -e "   ${GREEN}✓ Python 3 ya está instalado${NC}"
else
    echo "   Instalando Python 3..."
    apt install -y python3 python3-pip python3-venv
fi

# Instalar python3-venv si no está
echo "   Verificando python3-venv..."
if ! dpkg -l | grep -q python3-venv; then
    apt install -y python3-venv
fi

# Crear directorio del servidor
INSTALL_DIR="/opt/uninet-api-server"
echo ""
echo "📁 Creando directorio del servidor en $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# Copiar archivos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "   Copiando archivos del backend completo..."

# Copiar todo el contenido recursivamente (FastAPI necesita la carpeta api/)
cp -r "$SCRIPT_DIR/"* "$INSTALL_DIR/"

# Ajustar permisos de ejecución para scripts
if [ -d "$INSTALL_DIR/scripts" ]; then
    find "$INSTALL_DIR/scripts" -name "*.sh" -exec chmod +x {} \;
fi

echo -e "   ${GREEN}✓ Archivos copiados y permisos ajustados${NC}"

if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    cp "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/"
    echo -e "   ${GREEN}✓ requirements.txt copiado${NC}"
else
    echo -e "   ${RED}✗ No se encontró requirements.txt${NC}"
    exit 1
fi

# Crear entorno virtual
echo ""
echo "🐍 Creando entorno virtual de Python..."
cd "$INSTALL_DIR"
python3 -m venv venv

# Activar entorno virtual e instalar dependencias
echo ""
echo "📚 Instalando dependencias Python en el entorno virtual..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install uvicorn
deactivate

echo -e "${GREEN}✓ Dependencias instaladas correctamente${NC}"

# Crear servicio systemd
echo ""
echo "⚙️  Creando servicio systemd..."
cat > /etc/systemd/system/uninet-api.service << EOF
[Unit]
Description=UniNet API Server (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 4000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Servicio creado${NC}"

# Recargar systemd
systemctl daemon-reload

# Habilitar e iniciar el servicio
echo ""
echo "🚀 Iniciando el servicio..."
systemctl enable uninet-api
systemctl start uninet-api

# Configurar firewall (si UFW está instalado)
if command -v ufw &> /dev/null; then
    echo ""
    echo "🔥 Configurando firewall (UFW)..."
    
    # Permitir tráfico en la interfaz de Tailscale
    if ip link show tailscale0 &> /dev/null; then
        echo "   🔓 Permitiendo tráfico en tailscale0 (Tailscale)..."
        ufw allow in on tailscale0
        echo -e "   ${GREEN}✓ Tailscale configurado${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Tailscale no detectado. Considera instalarlo para acceso remoto.${NC}"
        echo "      Comando: curl -fsSL https://tailscale.com/install.sh | sh"
    fi
    
    # Permitir puerto 4000 (FastAPI)
    ufw allow 4000/tcp
    echo -e "   ${GREEN}✓ Puerto 4000/tcp abierto (FastAPI)${NC}"
    
    # Permitir puerto 389 (LDAP) si está instalado
    if command -v slapd &> /dev/null; then
        ufw allow 389/tcp
        echo -e "   ${GREEN}✓ Puerto 389/tcp abierto (LDAP)${NC}"
    fi
    
    # Asegurar que UFW esté activo
    ufw --force enable
    echo -e "${GREEN}✓ Firewall configurado${NC}"
fi

# Verificar estado
echo ""
echo "============================================================"
echo "  ✅ Instalación completada"
echo "============================================================"
echo ""
systemctl status uninet-api --no-pager
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:      sudo journalctl -u uninet-api -f"
echo "   Reiniciar:     sudo systemctl restart uninet-api"
echo "   Detener:       sudo systemctl stop uninet-api"
echo "   Ver estado:    sudo systemctl status uninet-api"
echo ""
echo "🌐 El servidor está escuchando en:"
echo "   http://localhost:4000/health"
echo "   http://$(hostname -I | awk '{print $1}'):4000/health"

# Mostrar IP de Tailscale si está instalado
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
    if [ -n "$TAILSCALE_IP" ]; then
        echo ""
        echo -e "${GREEN}📡 IP de Tailscale detectada:${NC}"
        echo -e "   ${BLUE}http://${TAILSCALE_IP}:4000/health${NC}"
        echo ""
        echo "💡 Usa esta IP para instalar clientes desde cualquier lugar:"
        echo -e "   ${GREEN}SERVER_IP=${TAILSCALE_IP} CARRERA=5010 curl -sSL http://${TAILSCALE_IP}:4000/install | sudo -E bash${NC}"
    fi
fi

echo ""
echo "💡 Prueba desde otra máquina:"
echo "   curl http://$(hostname -I | awk '{print $1}'):4000/health"
echo ""