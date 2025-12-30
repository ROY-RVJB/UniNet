#!/bin/bash
# Script para verificar el estado de LDAP en el servidor
# Ejecutar en el servidor Ubuntu con: bash check-ldap.sh

echo "=== Verificando servidor LDAP ==="
echo ""

# 1. Verificar si slapd está corriendo
echo "1. Estado del servicio slapd:"
sudo systemctl status slapd --no-pager | grep -E "(Active|Main PID)"
echo ""

# 2. Verificar si el puerto 389 está escuchando
echo "2. Puerto LDAP (389):"
sudo ss -tlnp | grep :389
echo ""

# 3. Probar consulta LDAP simple
echo "3. Prueba de consulta LDAP (anónima):"
ldapsearch -x -H ldap://localhost:389 -b "dc=uninet,dc=local" -LLL "(objectClass=*)" dn 2>&1 | head -20
echo ""

# 4. Ver configuración LDAP
echo "4. Configuración en /etc/uninet/ldap.conf:"
if [ -f /etc/uninet/ldap.conf ]; then
    cat /etc/uninet/ldap.conf
else
    echo "Archivo no encontrado"
fi
echo ""

# 5. Verificar logs recientes
echo "5. Últimas líneas del log de slapd:"
sudo tail -20 /var/log/syslog | grep slapd
