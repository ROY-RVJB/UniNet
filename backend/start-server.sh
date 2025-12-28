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
echo "🚀 Iniciando servidor UniNet..."
echo "📡 URL: http://0.0.0.0:4000"
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
