#!/bin/bash

# Script para generar alertas de Suricata y probar el sistema IDS completo
# Ejecutar desde la PC cliente: sudo ./test-suricata-alerts.sh

set -e

SERVER_IP="${1:-100.112.81.15}"  # IP del servidor (argumento o default)

echo "========================================"
echo "🔥 Generador de Alertas de Seguridad"
echo "========================================"
echo ""
echo "Este script generará 6 tipos de alertas"
echo "para probar el sistema IDS integrado"
echo ""
echo "Servidor objetivo: $SERVER_IP"
echo ""
read -p "Presiona ENTER para continuar..."
echo ""

# Verificar que Suricata esté corriendo
if ! systemctl is-active --quiet suricata 2>/dev/null; then
    echo "⚠️  Suricata no está activo. Iniciando..."
    sudo systemctl start suricata
    sleep 3
fi

echo "✅ Suricata activo"
echo ""

# 1. Port Scan (CRÍTICA)
echo "🎯 [1/6] Generando Port Scan (CRÍTICA)..."
echo "   Ejecutando: nmap -F $SERVER_IP"
if command -v nmap &> /dev/null; then
    nmap -F $SERVER_IP 2>/dev/null || echo "   ⚠️  nmap falló"
else
    echo "   ⚠️  nmap no instalado (instalar: sudo apt install nmap)"
fi
sleep 2
echo ""

# 2. SSH Brute Force (ALTA)
echo "🎯 [2/6] Generando SSH Brute Force (ALTA)..."
echo "   Intentando 5 logins fallidos a SSH..."
for i in {1..5}; do 
  echo "   Intento $i/5..."
  timeout 2 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=1 fake_user_$i@$SERVER_IP 2>/dev/null || true
done
sleep 2
echo ""

# 3. HTTP Sospechoso (MEDIA)
echo "🎯 [3/6] Generando Tráfico HTTP Sospechoso (MEDIA)..."
echo "   Enviando requests con user-agents maliciosos..."
curl -A "sqlmap/1.0" http://$SERVER_IP 2>/dev/null || true
curl "http://$SERVER_IP/?id=1'OR'1" 2>/dev/null || true
curl http://$SERVER_IP/admin.php 2>/dev/null || true
sleep 2
echo ""

# 4. ICMP Flood (MEDIA)
echo "🎯 [4/6] Generando ICMP Flood (MEDIA)..."
echo "   Enviando 20 pings rápidos..."
ping -c 20 -i 0.01 $SERVER_IP 2>/dev/null || true
sleep 2
echo ""

# 5. Puerto No Estándar (BAJA)
echo "🎯 [5/6] Intentando Puertos No Estándar (BAJA)..."
echo "   Conectando a puerto 4444 (backdoor común)..."
timeout 2 nc -w 1 $SERVER_IP 4444 2>/dev/null || true
timeout 2 telnet $SERVER_IP 31337 2>/dev/null <<< $'\x04' 2>/dev/null || true
sleep 2
echo ""

# 6. DNS Flood (INFO)
echo "🎯 [6/6] Generando DNS Flood (INFO)..."
echo "   Haciendo 50 consultas DNS rápidas..."
for i in {1..50}; do 
  nslookup google.com 8.8.8.8 >/dev/null 2>&1 &
done
wait
sleep 2
echo ""

echo "========================================"
echo "✅ ¡Todas las alertas generadas!"
echo "========================================"
echo ""
echo "📊 Ver alertas generadas localmente:"
echo "   sudo tail -20 /var/log/suricata/fast.log"
echo ""
echo "🔍 Ver alertas en formato JSON:"
echo "   sudo tail -20 /var/log/suricata/eve.json | jq 'select(.event_type==\"alert\")'"
echo ""
echo "🌐 Ver en el dashboard:"
echo "   http://$SERVER_IP:5173/security"
echo ""
echo "⏱️  Las alertas deberían aparecer en el dashboard en ~10 segundos"
echo ""
