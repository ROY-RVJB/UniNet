#!/bin/bash

# ============================================================
# Script de instalación del Status Server - UniNet Dashboard
# ============================================================
# Este script instala y configura el servidor de estado Python
# que monitorea las máquinas cliente mediante ping

set -e  # Detener en caso de error

echo "============================================================"
echo "  Status Server - UniNet Dashboard"
echo "  Instalación y configuración"
echo "============================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Ejecutando como root"

# 1. Actualizar repositorios
echo ""
echo "📦 Actualizando repositorios del sistema..."
apt update -qq

# 2. Instalar Python y pip si no están instalados
echo ""
echo "🐍 Verificando Python 3..."
if ! command -v python3 &> /dev/null; then
    echo "   Instalando Python 3..."
    apt install -y python3 python3-pip python3-venv
else
    echo -e "   ${GREEN}✓${NC} Python 3 ya está instalado"
fi

# 3. Instalar pip si no está
if ! command -v pip3 &> /dev/null; then
    echo "   Instalando pip..."
    apt install -y python3-pip
else
    echo -e "   ${GREEN}✓${NC} pip ya está instalado"
fi

# 4. Crear directorio para el servidor
SERVER_DIR="/opt/uninet-status-server"
echo ""
echo "📁 Creando directorio del servidor en $SERVER_DIR..."
mkdir -p "$SERVER_DIR"

# 5. Copiar archivos (asumiendo que se ejecuta desde la carpeta server/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "   Copiando archivos desde $SCRIPT_DIR..."

if [ -f "$SCRIPT_DIR/status_server.py" ]; then
    cp "$SCRIPT_DIR/status_server.py" "$SERVER_DIR/"
    echo -e "   ${GREEN}✓${NC} status_server.py copiado"
else
    echo -e "   ${RED}❌ No se encontró status_server.py${NC}"
    exit 1
fi

if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    cp "$SCRIPT_DIR/requirements.txt" "$SERVER_DIR/"
    echo -e "   ${GREEN}✓${NC} requirements.txt copiado"
else
    echo -e "   ${RED}❌ No se encontró requirements.txt${NC}"
    exit 1
fi

# 6. Instalar dependencias Python
echo ""
echo "📚 Instalando dependencias Python..."
cd "$SERVER_DIR"
pip3 install -r requirements.txt --quiet

echo -e "${GREEN}✓${NC} Dependencias instaladas"

# 7. Crear servicio systemd
echo ""
echo "⚙️  Creando servicio systemd..."

cat > /etc/systemd/system/uninet-status.service << EOF
[Unit]
Description=UniNet Status Server - Dashboard Backend
After=network.target zerotier-one.service
Wants=zerotier-one.service

[Service]
Type=simple
User=root
WorkingDirectory=$SERVER_DIR
ExecStart=/usr/bin/python3 $SERVER_DIR/status_server.py
Restart=always
RestartSec=10

# Logs
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓${NC} Servicio creado en /etc/systemd/system/uninet-status.service"

# 8. Configurar firewall (UFW) para permitir puerto 4000
echo ""
echo "🔥 Configurando firewall (UFW)..."
if command -v ufw &> /dev/null; then
    ufw allow 4000/tcp comment "UniNet Status Server"
    echo -e "${GREEN}✓${NC} Puerto 4000/tcp abierto en UFW"
else
    echo -e "${YELLOW}⚠${NC} UFW no está instalado, omitiendo configuración de firewall"
fi

# 9. Habilitar e iniciar el servicio
echo ""
echo "🚀 Habilitando e iniciando el servicio..."
systemctl daemon-reload
systemctl enable uninet-status.service
systemctl start uninet-status.service

# Esperar un momento para que inicie
sleep 2

# 10. Verificar estado
echo ""
echo "============================================================"
if systemctl is-active --quiet uninet-status.service; then
    echo -e "${GREEN}✅ ¡Instalación completada exitosamente!${NC}"
    echo ""
    echo "📊 Estado del servicio:"
    systemctl status uninet-status.service --no-pager -l
    echo ""
    echo "============================================================"
    echo "  Comandos útiles:"
    echo "============================================================"
    echo "  Ver logs:          sudo journalctl -u uninet-status -f"
    echo "  Reiniciar:         sudo systemctl restart uninet-status"
    echo "  Detener:           sudo systemctl stop uninet-status"
    echo "  Ver estado:        sudo systemctl status uninet-status"
    echo "============================================================"
    echo ""
    echo "🌐 El servidor está escuchando en:"
    echo "   http://172.29.137.160:4000/status"
    echo ""
else
    echo -e "${RED}❌ Error: El servicio no pudo iniciarse${NC}"
    echo "Revisa los logs con: sudo journalctl -u uninet-status -xe"
    exit 1
fi
