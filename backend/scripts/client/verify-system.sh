#!/bin/bash

# Script de verificación del sistema de monitoreo UniNet
# Verifica que todos los componentes estén funcionando correctamente

echo "==========================================="
echo "UniNet - Verificación del Sistema"
echo "==========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
API_URL="http://172.29.137.160:4000"

# Función para verificar requisito
check_requirement() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# 1. Verificar que el servidor API está corriendo
echo "1️⃣  Verificando servidor API..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/monitoring/hosts")
if [ "$STATUS_CODE" = "200" ]; then
    check_requirement 0 "Servidor API accesible en ${API_URL}"
else
    check_requirement 1 "Servidor API NO accesible (HTTP $STATUS_CODE)"
    echo ""
    echo "Por favor, inicia el servidor backend:"
    echo "  cd ~/UniNet/UniNet/backend"
    echo "  uvicorn api.main:app --host 0.0.0.0 --port 4000"
    exit 1
fi
echo ""

# 2. Verificar endpoint de heartbeat
echo "2️⃣  Verificando endpoint de heartbeat..."
HEARTBEAT_RESPONSE=$(curl -s -X POST "${API_URL}/api/monitoring/heartbeat" \
    -H "Content-Type: application/json" \
    -d '{"hostname":"test-verification","ip":"127.0.0.1","user":null}' \
    -w "\nHTTP:%{http_code}")

HEARTBEAT_CODE=$(echo "$HEARTBEAT_RESPONSE" | grep "HTTP:" | cut -d: -f2)
if [ "$HEARTBEAT_CODE" = "200" ]; then
    check_requirement 0 "Endpoint POST /heartbeat funcional"
else
    check_requirement 1 "Endpoint POST /heartbeat falló (HTTP $HEARTBEAT_CODE)"
fi
echo ""

# 3. Verificar endpoint de status
echo "3️⃣  Verificando endpoint de status..."
STATUS_RESPONSE=$(curl -s "${API_URL}/api/monitoring/status")
if echo "$STATUS_RESPONSE" | grep -q "test-verification"; then
    check_requirement 0 "Endpoint GET /status funcional (cliente test detectado)"
else
    check_requirement 1 "Endpoint GET /status no retornó el cliente test"
fi
echo ""

# 4. Verificar estructura de respuesta
echo "4️⃣  Verificando estructura de datos..."
if echo "$STATUS_RESPONSE" | grep -q '"status"'; then
    check_requirement 0 "Campo 'status' presente en respuesta"
else
    check_requirement 1 "Campo 'status' NO encontrado"
fi

if echo "$STATUS_RESPONSE" | grep -q '"last_seen"'; then
    check_requirement 0 "Campo 'last_seen' presente en respuesta"
else
    check_requirement 1 "Campo 'last_seen' NO encontrado"
fi
echo ""

# 5. Verificar scripts de cliente
echo "5️⃣  Verificando scripts de cliente..."
if [ -f "./uninet-agent.sh" ]; then
    check_requirement 0 "uninet-agent.sh encontrado"
    if [ -x "./uninet-agent.sh" ]; then
        check_requirement 0 "uninet-agent.sh es ejecutable"
    else
        check_requirement 1 "uninet-agent.sh NO es ejecutable (chmod +x)"
    fi
else
    check_requirement 1 "uninet-agent.sh NO encontrado"
fi

if [ -f "./install-client.sh" ]; then
    check_requirement 0 "install-client.sh encontrado"
else
    check_requirement 1 "install-client.sh NO encontrado"
fi
echo ""

# 6. Mostrar estado actual de todos los hosts
echo "6️⃣  Estado actual de hosts registrados:"
echo "---------------------------------------"
echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

# Resumen
echo "==========================================="
echo "✅ Verificación completa"
echo "==========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. En las máquinas cliente, ejecutar:"
echo "   sudo bash install-client.sh"
echo ""
echo "2. Verificar que aparecen en el dashboard:"
echo "   http://localhost:5173"
echo ""
echo "3. Probar estados:"
echo "   - Sin usuario: Debería mostrar 'online' (verde)"
echo "   - Con usuario logueado: Debería mostrar 'inUse' (azul)"
echo "   - Máquina apagada >60s: Debería mostrar 'offline' (rojo)"
echo ""
