# 🛡️ Sistema de Alertas de Seguridad UniNet - Suricata IDS

## 📋 Resumen

El sistema de alertas de seguridad de UniNet está completamente integrado con Suricata IDS. La instalación y configuración es **100% automática** para los clientes.

## ✅ Cambios Implementados

### 1. **Script de Instalación Automática** (`install-client.sh`)
- ✅ Instala Suricata IDS automáticamente
- ✅ Detecta la interfaz de red principal
- ✅ Configura Suricata para monitorear esa interfaz
- ✅ Actualiza reglas de detección
- ✅ Habilita logs en formato JSON (`eve.json`)
- ✅ Inicia Suricata como servicio

### 2. **Agente Mejorado** (`uninet-agent.sh`)
- ✅ Lee alertas nuevas desde `/var/log/suricata/eve.json`
- ✅ Envía alertas al backend en tiempo real
- ✅ Incluye información completa: PC, usuario, carrera, severidad
- ✅ Evita duplicados con sistema de timestamps

### 3. **Backend API** (`monitoring.py`)
- ✅ Endpoint POST `/api/monitoring/security/alerts` - Recibe alertas de clientes
- ✅ Endpoint GET `/api/monitoring/security/alerts` - Lista alertas con filtros
- ✅ Endpoint POST `/api/monitoring/security/alerts/{id}/acknowledge` - Marca como revisada
- ✅ Endpoint POST `/api/monitoring/security/remediation` - Ejecuta acciones correctivas
- ✅ Almacenamiento en memoria (últimas 1000 alertas)
- ✅ Mapeo de severidad Suricata → Dashboard

### 4. **Frontend Dashboard** (`SecurityAlertsPanel.tsx`)
- ✅ Consume alertas reales del backend
- ✅ Actualización automática cada 10 segundos
- ✅ Fallback a datos mock si backend no disponible
- ✅ Click en PC abre panel de detalles (htop + logs)
- ✅ Botones de remediación funcionales
- ✅ Confirmación antes de ejecutar acciones

## 🚀 Cómo Usar el Sistema

### **Paso 1: Instalar Cliente (Incluye Suricata)**

Desde cualquier PC cliente Ubuntu:

```bash
# Opción A: Instalación automática
curl -sSL http://100.112.81.15:4000/install | sudo bash

# Opción B: Instalación manual
sudo apt install curl -y
curl -O http://100.112.81.15:4000/install
chmod +x install
sudo ./install
```

**Lo que hace automáticamente:**
1. Instala Tailscale y configura VPN
2. Instala y configura Suricata IDS
3. Instala agente UniNet con monitoreo cada 5 segundos
4. Configura autenticación LDAP
5. Crea directorios y permisos necesarios

### **Paso 2: Generar Alertas de Prueba**

```bash
# Descargar script de prueba
curl -O http://100.112.81.15:4000/test-alerts
chmod +x test-alerts

# Ejecutar (genera 6 tipos de alertas)
sudo ./test-alerts

# O especificar servidor manualmente
sudo ./test-alerts 100.112.81.15
```

**Alertas generadas:**
1. 🔴 Port Scan (CRÍTICA)
2. 🟠 SSH Brute Force (ALTA)
3. 🟡 HTTP Sospechoso (MEDIA)
4. 🟡 ICMP Flood (MEDIA)
5. 🔵 Puerto No Estándar (BAJA)
6. ℹ️ DNS Flood (INFO)

### **Paso 3: Ver Alertas en el Dashboard**

1. Abre el dashboard: `http://100.112.81.15:5173`
2. Ve a la sección **Seguridad** (menú superior)
3. Las alertas aparecen en tiempo real (~10 segundos)

**Funcionalidades:**
- 🖱️ Click en icono de PC → Ver htop y logs
- 🚨 3 botones de remediación:
  - **Cuarentena** - Bloquea toda conectividad
  - **Expulsar** - Cierra sesión del usuario
  - **Bloquear IP** - Rechaza tráfico de esa IP
- ✅ Marcar como revisada sin acción

## 🔧 Verificación del Sistema

### **En el Cliente (PC con Suricata)**

```bash
# 1. Verificar que Suricata está corriendo
sudo systemctl status suricata

# 2. Ver alertas generadas localmente
sudo tail -f /var/log/suricata/fast.log

# 3. Ver alertas en formato JSON
sudo tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'

# 4. Contar alertas
sudo grep -c '"event_type":"alert"' /var/log/suricata/eve.json

# 5. Ver si el agente está enviando datos
grep uninet /var/log/syslog | tail -20
```

### **En el Servidor**

```bash
# 1. Ver logs del backend
cd ~/UniNet/backend
tail -f logs/app.log | grep "alerta"

# 2. Probar endpoint manualmente
curl http://100.112.81.15:4000/api/monitoring/security/alerts | jq .

# 3. Ver clientes conectados
curl http://100.112.81.15:4000/api/monitoring/status | jq .
```

## 📊 Flujo Completo

```
┌─────────────────────────┐
│  Cliente Ubuntu         │
│  - Suricata detecta     │ 
│    tráfico sospechoso   │
│  - Escribe eve.json     │
└───────────┬─────────────┘
            │
            │ cada 5s
            ↓
┌─────────────────────────┐
│  Agente UniNet          │
│  - Lee eve.json         │
│  - Extrae nuevas alerts │
│  - POST al backend      │
└───────────┬─────────────┘
            │
            │ HTTP POST
            ↓
┌─────────────────────────┐
│  Backend FastAPI        │
│  - Recibe alertas       │
│  - Mapea severidad      │
│  - Almacena en memoria  │
└───────────┬─────────────┘
            │
            │ GET cada 10s
            ↓
┌─────────────────────────┐
│  Frontend Dashboard     │
│  - Muestra alertas      │
│  - Click en PC → Panel  │
│  - Botones remediación  │
└─────────────────────────┘
```

## 🎯 Tipos de Alertas Detectadas

| Tipo | Severidad | Descripción | Ejemplo |
|------|-----------|-------------|---------|
| Port Scan | 🔴 Crítica | Escaneo masivo de puertos | `nmap -F` |
| SSH Brute Force | 🟠 Alta | Múltiples intentos de login | 5+ intentos fallidos |
| SQL Injection | 🟠 Alta | Intento de inyección SQL | `?id=1'OR'1` |
| HTTP Malware UA | 🟡 Media | User-Agent sospechoso | `sqlmap/1.0` |
| ICMP Flood | 🟡 Media | Ping flood | `ping -f` |
| Puerto Backdoor | 🔵 Baja | Conexión a puerto malicioso | Puerto 4444, 31337 |
| DNS Flood | ℹ️ Info | Consultas DNS masivas | 50+ queries/sec |

## 🐛 Troubleshooting

### **Suricata no inicia**

```bash
# Ver logs de Suricata
sudo tail -f /var/log/suricata/suricata.log

# Verificar configuración
sudo suricata -T -c /etc/suricata/suricata.yaml

# Reiniciar
sudo systemctl restart suricata
```

### **No aparecen alertas en el dashboard**

```bash
# 1. Verificar que hay alertas en el cliente
sudo tail /var/log/suricata/fast.log

# 2. Verificar que el agente envía datos
curl -X POST http://100.112.81.15:4000/api/monitoring/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"hostname":"test","ip":"1.2.3.4","user":"testuser","carrera":"5010"}'

# 3. Verificar endpoint de alertas
curl http://100.112.81.15:4000/api/monitoring/security/alerts

# 4. Ver logs del agente
grep uninet /var/log/syslog | tail
```

### **Alertas no se envían al backend**

```bash
# 1. Verificar permisos del log de Suricata
sudo chmod 644 /var/log/suricata/eve.json

# 2. Verificar que el agente puede leerlo
sudo -u root cat /var/log/suricata/eve.json

# 3. Ejecutar agente manualmente para debug
sudo /usr/local/bin/uninet-agent
```

## 📚 Archivos Modificados

1. `backend/scripts/client/install-client.sh` - Instalación automática
2. `backend/scripts/client/uninet-agent.sh` - Lectura y envío de alertas
3. `backend/api/monitoring.py` - Endpoints de seguridad
4. `frontend/src/components/SecurityAlertsPanel.tsx` - UI de alertas
5. `backend/scripts/client/test-suricata-alerts.sh` - Script de prueba

## 🎉 Estado del Sistema

✅ **Instalación automática** de Suricata en clientes
✅ **Detección en tiempo real** de amenazas
✅ **Envío automático** de alertas al backend
✅ **Dashboard funcional** con alertas reales
✅ **Click en PC** abre panel de detalles
✅ **Botones de remediación** conectados al backend
✅ **Fallback a datos mock** si no hay conexión

## 🚧 Próximos Pasos (Opcionales)

- [ ] Implementar cola de acciones de remediación pendientes
- [ ] Persistir alertas en PostgreSQL
- [ ] WebSocket para alertas en tiempo real
- [ ] Mapeo automático de carreras por GID
- [ ] Email/notificaciones para alertas críticas
- [ ] Exportar reportes de seguridad (PDF/CSV)
- [ ] Gráficas de tendencias de seguridad
