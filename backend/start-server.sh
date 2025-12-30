#!/bin/bash
#
# UniNet - Script para iniciar servidor backend
# Mata procesos zombies automáticamente y arranca uvicorn
#

echo "🔍 Verificando procesos en puerto 4000..."

# Verificar si hay algo corriendo en el puerto 4000
if sudo lsof -ti:4000 >/dev/null 2>&1; then
    echo "⚠️  Encontrado proceso zombie en puerto 4000"
    echo "🧹 Matando proceso..."
    sudo fuser -k 4000/tcp
    sleep 1
    echo "✅ Proceso eliminado"
else
    echo "✅ Puerto 4000 libre"
fi

echo ""
echo "� Verificando configuración de red..."

# Verificar Tailscale
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
    if [ -n "$TAILSCALE_IP" ]; then
        echo "✅ Tailscale detectado"
        echo "   IP: $TAILSCALE_IP"
        
        # Configurar firewall automáticamente si UFW está instalado
        if command -v ufw &> /dev/null; then
            echo "🔥 Configurando firewall..."
            sudo ufw allow in on tailscale0 >/dev/null 2>&1
            sudo ufw allow 4000/tcp >/dev/null 2>&1
            echo "✅ Firewall configurado"
        fi
    else
        echo "⚠️  Tailscale instalado pero no conectado"
        echo "   Ejecuta: sudo tailscale up"
    fi
else
    echo "⚠️  Tailscale no detectado"
    echo "   Considera instalarlo: curl -fsSL https://tailscale.com/install.sh | sh"
fi

echo ""
echo "🚀 Iniciando servidor UniNet..."
echo "📡 URL local: http://0.0.0.0:4000"
if [ -n "$TAILSCALE_IP" ]; then
    echo "📡 URL Tailscale: http://$TAILSCALE_IP:4000"
fi
echo "📊 Docs: http://0.0.0.0:4000/docs"
echo ""
echo "⏸️  Para detener: Ctrl+C"
echo ""

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Iniciar servidor
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 4000 --reload
