#!/bin/bash
# Script para limpiar alertas STUN/P2P del cliente y deshabilitar esas reglas

echo "🧹 Limpiando alertas STUN/P2P..."

# 1. Deshabilitar reglas en Suricata
sudo bash -c 'cat > /etc/suricata/disable.conf' <<'EOF'
# Alertas STUN/NAT (tráfico VPN normal - muy frecuente)
2016149
2016150
# Alertas Go HTTP Client (tráfico Tailscale/Docker normal)
2024897
2060251
EOF

echo "✅ Reglas deshabilitadas en Suricata"

# 2. Limpiar el archivo de última alerta para resetear el tracking
sudo rm -f /var/run/uninet-last-alert
echo "✅ Archivo de tracking limpiado"

# 3. Reiniciar Suricata
echo "🔄 Reiniciando Suricata..."
sudo systemctl restart suricata

# 4. Esperar a que Suricata inicie
sleep 3

# 5. Verificar estado
if sudo systemctl is-active --quiet suricata; then
    echo "✅ Suricata reiniciado correctamente"
    echo "📊 Las nuevas alertas serán solo de actividad relevante"
else
    echo "❌ Suricata no está corriendo"
fi

echo ""
echo "ℹ️  Ahora solo verás alertas de:"
echo "   • Escaneos de puertos"
echo "   • Intentos de SSH brute force"
echo "   • Inyección SQL"
echo "   • Floods ICMP/TCP"
echo "   • Actividad sospechosa real"
