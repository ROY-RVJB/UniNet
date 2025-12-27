#!/bin/bash

# UniNet Client Installer
# Script de instalación automática del agente de monitoreo
# Uso: sudo bash install-client.sh

set -e

echo "==================================="
echo "UniNet - Instalador de Cliente"
echo "==================================="
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Error: Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Verificar que curl está instalado
if ! command -v curl &> /dev/null; then
    echo "📦 Instalando curl..."
    apt-get update -qq
    apt-get install -y curl
fi

# Crear directorio para el agente si no existe
INSTALL_DIR="/usr/local/bin"
AGENT_FILE="$INSTALL_DIR/uninet-agent"

echo "📥 Descargando agente de monitoreo..."

# Descargar el script desde el servidor
# Opción 1: Si está en el mismo servidor, copiar directamente
if [ -f "./uninet-agent.sh" ]; then
    cp ./uninet-agent.sh "$AGENT_FILE"
    echo "✅ Agente copiado desde directorio local"
else
    # Opción 2: Descargar desde servidor (si tienes un servidor web)
    # curl -o "$AGENT_FILE" http://172.29.137.160/uninet-agent.sh
    echo "❌ Error: No se encontró uninet-agent.sh en el directorio actual"
    echo "Por favor, ejecuta este script desde el directorio que contiene uninet-agent.sh"
    exit 1
fi

# Dar permisos de ejecución
chmod +x "$AGENT_FILE"

echo "✅ Agente instalado en: $AGENT_FILE"

# Configurar cron para ejecutar cada 30 segundos
echo "⏱️  Configurando tarea programada..."

# Crear script wrapper para ejecutar dos veces por minuto
CRON_WRAPPER="/usr/local/bin/uninet-agent-runner"
cat > "$CRON_WRAPPER" << 'EOF'
#!/bin/bash
/usr/local/bin/uninet-agent
sleep 30
/usr/local/bin/uninet-agent
EOF

chmod +x "$CRON_WRAPPER"

# Agregar tarea a cron (se ejecuta cada minuto, pero el wrapper lo hace cada 30s)
CRON_JOB="* * * * * $CRON_WRAPPER"

# Verificar si ya existe la entrada
if ! crontab -l 2>/dev/null | grep -q "uninet-agent-runner"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Tarea programada configurada (cada 30 segundos)"
else
    echo "⚠️  Tarea programada ya existe"
fi

# Verificar que el servicio cron esté activo
if systemctl is-active --quiet cron; then
    echo "✅ Servicio cron activo"
else
    echo "🔄 Iniciando servicio cron..."
    systemctl start cron
    systemctl enable cron
fi

# Ejecutar el agente inmediatamente para verificar
echo ""
echo "🔍 Probando conexión con el servidor..."
$AGENT_FILE

if [ $? -eq 0 ]; then
    echo "✅ Conexión exitosa con el servidor de monitoreo"
else
    echo "⚠️  No se pudo conectar al servidor. Verifica que el servidor esté accesible en:"
    echo "   http://172.29.137.160:4000"
fi

echo ""
echo "==================================="
echo "✅ Instalación completada"
echo "==================================="
echo ""
echo "El sistema reportará automáticamente:"
echo "  • Estado de la máquina (encendida/apagada)"
echo "  • Usuario activo (si alguien inició sesión)"
echo "  • IP y hostname"
echo ""
echo "No es necesario hacer nada más."
echo "El monitoreo se realiza automáticamente cada 30 segundos."
echo ""
