#!/bin/bash
#
# Script de inicialización post-instalación
# Da permisos de ejecución a todos los scripts .sh
#

echo "🔧 Configurando permisos de ejecución..."

# Dar permisos a scripts del backend
chmod +x backend/*.sh 2>/dev/null
chmod +x backend/scripts/**/*.sh 2>/dev/null

echo "✅ Permisos configurados correctamente"
echo ""
echo "Ahora puedes ejecutar:"
echo "  cd backend/scripts && sudo bash setup-permissions.sh"
echo "  cd backend && ./start-server.sh"
