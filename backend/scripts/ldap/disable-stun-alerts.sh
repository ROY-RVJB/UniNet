#!/bin/bash
# Script para deshabilitar alertas STUN/P2P en Suricata
# Estas alertas son muy frecuentes y de bajo interés

echo "🔧 Deshabilitando alertas STUN/P2P en Suricata..."

# Verificar que Suricata esté instalado
if ! command -v suricata &> /dev/null; then
    echo "❌ Suricata no está instalado"
    exit 1
fi

# Archivo de reglas deshabilitadas
DISABLE_FILE="/etc/suricata/disable.conf"

# Crear archivo si no existe
sudo touch "$DISABLE_FILE"

# Deshabilitar reglas STUN (2016149, 2016150)
echo "2016149" | sudo tee -a "$DISABLE_FILE" > /dev/null
echo "2016150" | sudo tee -a "$DISABLE_FILE" > /dev/null

# Deshabilitar reglas Go HTTP Client (2024897, 2060251)
echo "2024897" | sudo tee -a "$DISABLE_FILE" > /dev/null
echo "2060251" | sudo tee -a "$DISABLE_FILE" > /dev/null

# Remover duplicados
sudo sort -u "$DISABLE_FILE" -o "$DISABLE_FILE"

echo "✅ Reglas deshabilitadas:"
cat "$DISABLE_FILE"

# Reiniciar Suricata
echo "🔄 Reiniciando Suricata..."
sudo systemctl restart suricata

echo "✅ Listo. Las alertas STUN/P2P ya no se generarán."
