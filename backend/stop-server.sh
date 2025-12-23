#!/bin/bash
#
# UniNet - Script para detener servidor backend
# Mata todos los procesos de uvicorn
#

echo "🛑 Deteniendo servidor UniNet..."

# Matar todos los procesos de uvicorn
if pgrep -f "uvicorn api.main:app" > /dev/null; then
    sudo pkill -f "uvicorn api.main:app"
    echo "✅ Servidor detenido"
else
    echo "ℹ️  No hay servidor corriendo"
fi

# Verificar puerto 4000
if sudo lsof -ti:4000 >/dev/null 2>&1; then
    echo "🧹 Limpiando puerto 4000..."
    sudo fuser -k 4000/tcp
    echo "✅ Puerto liberado"
fi

echo "✨ Listo"
