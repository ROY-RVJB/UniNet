# 🚀 Guía de Instalación Rápida - UniNet Agent

> **Para Compañeros de Equipo**: Instrucciones simples para configurar las VMs como clientes del sistema de monitoreo

---

## 📋 Requisitos Previos

- ✅ VM Ubuntu (18.04 o superior)
- ✅ Conexión a la red ZeroTier (deben estar en la misma red que el servidor)
- ✅ Acceso a internet para descargar paquetes
- ✅ Permisos de sudo

---

## ⚡ Instalación en 1 Comando

### 🎯 Paso Único: Ejecutar el Instalador

En tu VM Ubuntu, abre una terminal y ejecuta:

```bash
curl -sSL http://IP_DEL_SERVIDOR:4000/install | sudo bash
```

> **Reemplaza `IP_DEL_SERVIDOR`** con la IP de ZeroTier del servidor (te la proporcionará el administrador del servidor)

**Ejemplo:**
```bash
curl -sSL http://172.29.137.160:4000/install | sudo bash
```

---

## ✅ ¿Qué hace este comando?

El script automáticamente:

1. ✨ Detecta la IP del servidor
2. 📥 Descarga el agente de monitoreo
3. ⚙️ Crea la configuración automáticamente
4. ⏱️ Configura el envío de estado cada 30 segundos
5. 🎯 Registra tu PC en el sistema

---

## 🎬 Para la Presentación

### Secuencia Recomendada:

1. **Antes de la presentación:**
   - Apagar las VMs Ubuntu
   - Mantener solo el servidor prendido

2. **Durante la presentación:**
   - Mostrar el dashboard vacío o con PCs "offline"
   - Prender las laptops y las VMs
   - Las PCs aparecerán automáticamente como "online" 🟢
   - Hacer login en las VMs
   - Las PCs cambiarán a "inUse" 🔵 mostrando el usuario

---

## 🔍 Verificación

### Verificar que el agente está instalado:

```bash
ls -l /usr/local/bin/uninet-agent
```

### Ver la configuración:

```bash
cat /etc/uninet/config
```

### Ejecutar manualmente para probar:

```bash
sudo /usr/local/bin/uninet-agent
```

### Ver logs de cron:

```bash
grep uninet /var/log/syslog | tail -20
```

---

## 🌐 Acceder al Dashboard

Una vez instalado el agente, tu PC aparecerá automáticamente en:

```
http://IP_DEL_SERVIDOR:5173
```

---

## 🆘 Solución de Problemas

### No aparece mi PC en el dashboard:

1. **Verificar conectividad con el servidor:**
   ```bash
   curl http://IP_DEL_SERVIDOR:4000/health
   ```
   Debe responder: `{"status":"ok"}`

2. **Verificar que el agente se está ejecutando:**
   ```bash
   sudo /usr/local/bin/uninet-agent
   ```

3. **Verificar que cron está activo:**
   ```bash
   systemctl status cron
   ```

4. **Verificar la IP de ZeroTier:**
   ```bash
   ip addr show | grep zt
   ```

### La PC aparece como "offline":

- Espera 60 segundos (timeout del heartbeat)
- Verifica que cron esté ejecutándose
- Ejecuta manualmente: `sudo /usr/local/bin/uninet-agent`

### No se muestra el usuario logueado:

- Asegúrate de haber iniciado sesión en la sesión gráfica (no solo terminal)
- El usuario debe aparecer en el comando `who`

---

## 🎓 Información Técnica

### Arquitectura:

```
VM Ubuntu (Cliente)
    ↓ (heartbeat cada 30s)
Servidor Backend (FastAPI)
    ↓ (WebSocket/API)
Frontend Dashboard (React)
```

### Datos que envía cada PC:

- **Hostname**: Nombre de la máquina
- **IP**: Dirección IP en la red
- **Usuario**: Usuario con sesión activa (si hay alguno)

### Estados posibles:

- 🔴 **offline**: No envía heartbeat hace más de 60 segundos
- 🟢 **online**: Envía heartbeat pero sin usuario activo
- 🔵 **inUse**: Envía heartbeat con usuario activo

---

## 📞 Contacto

Si tienes problemas durante la instalación, contacta al administrador del servidor.

---

## 🔄 Desinstalación (Opcional)

Si necesitas desinstalar el agente:

```bash
# Remover crontab
sudo crontab -l | grep -v uninet-agent-runner | sudo crontab -

# Eliminar archivos
sudo rm -f /usr/local/bin/uninet-agent
sudo rm -f /usr/local/bin/uninet-agent-runner
sudo rm -rf /etc/uninet
```

---

**¡Éxito con la presentación! 🎉**
