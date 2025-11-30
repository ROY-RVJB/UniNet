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

# Actualizar repositorios
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
INSTALL_DIR="/opt/uninet-status-server"
echo ""
echo "📁 Creando directorio del servidor en $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# Copiar archivos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "   Copiando archivos desde $SCRIPT_DIR..."

if [ -f "$SCRIPT_DIR/status_server.py" ]; then
    cp "$SCRIPT_DIR/status_server.py" "$INSTALL_DIR/"
    echo -e "   ${GREEN}✓ status_server.py copiado${NC}"
else
    echo -e "   ${RED}✗ No se encontró status_server.py${NC}"
    exit 1
fi

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
deactivate

echo -e "${GREEN}✓ Dependencias instaladas correctamente${NC}"

# Crear servicio systemd
echo ""
echo "⚙️  Creando servicio systemd..."
cat > /etc/systemd/system/uninet-status.service << EOF
[Unit]
Description=UniNet Status Server - Dashboard Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/status_server.py
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
systemctl enable uninet-status
systemctl start uninet-status

# Configurar firewall (si UFW está instalado)
if command -v ufw &> /dev/null; then
    echo ""
    echo "🔥 Configurando firewall (UFW)..."
    ufw allow 4000/tcp
    echo -e "${GREEN}✓ Puerto 4000 abierto${NC}"
fi

# Verificar estado
echo ""
echo "============================================================"
echo "  ✅ Instalación completada"
echo "============================================================"
echo ""
systemctl status uninet-status --no-pager
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:      sudo journalctl -u uninet-status -f"
echo "   Reiniciar:     sudo systemctl restart uninet-status"
echo "   Detener:       sudo systemctl stop uninet-status"
echo "   Ver estado:    sudo systemctl status uninet-status"
echo ""
echo "🌐 El servidor está escuchando en:"
echo "   http://localhost:4000/status"
echo "   http://$(hostname -I | awk '{print $1}'):4000/status"
echo ""
echo "💡 Prueba desde otra máquina:"
echo "   curl http://$(hostname -I | awk '{print $1}'):4000/status"
echo ""