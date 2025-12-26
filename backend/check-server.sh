#!/bin/bash
#
# UniNet - Script para verificar estado del servidor
#

echo "🔍 Estado del servidor UniNet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar procesos uvicorn
if pgrep -f "uvicorn api.main:app" > /dev/null; then
    echo "✅ Servidor: CORRIENDO"
    echo "   PID: $(pgrep -f 'uvicorn api.main:app')"
else
    echo "❌ Servidor: DETENIDO"
fi

# Verificar puerto 4000
if sudo lsof -ti:4000 >/dev/null 2>&1; then
    echo "⚠️  Puerto 4000: OCUPADO"
    echo "   Proceso: $(sudo lsof -ti:4000)"
else
    echo "✅ Puerto 4000: LIBRE"
fi

echo ""
echo "📊 Procesos Python activos:"
ps aux | grep python | grep -v grep | head -5

echo ""
echo "🌐 Puertos en uso:"
sudo netstat -tlnp | grep :4000
