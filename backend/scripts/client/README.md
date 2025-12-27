# UniNet - Sistema de Monitoreo de Clientes

Este directorio contiene los scripts necesarios para configurar el monitoreo automático de las máquinas cliente (VMs de estudiantes).

---

## 🎯 Instalación Rápida (Recomendado)

### Para Usuarios/Estudiantes:

**Solo ejecuta este comando en tu VM Ubuntu:**

```bash
curl -sSL http://IP_DEL_SERVIDOR:4000/install | sudo bash
```

> Reemplaza `IP_DEL_SERVIDOR` con la IP que te proporcione el administrador

**¡Eso es todo!** Tu PC se registrará automáticamente y empezará a enviar su estado cada 30 segundos.

📖 **Ver guía detallada:** [QUICK-INSTALL.md](QUICK-INSTALL.md)

---

## 📋 Descripción del Sistema

El sistema de monitoreo funciona mediante **heartbeats** (latidos): cada máquina cliente envía su estado cada 30 segundos al servidor. El servidor determina el estado de cada máquina basándose en:

### Estados de las PCs

1. **offline** 🔴
   - No se ha recibido heartbeat en más de 60 segundos
   - La máquina está apagada o sin conexión de red

2. **online** 🟢
   - Se recibió heartbeat recientemente (< 60s)
   - No hay usuario activo en la sesión

3. **inUse** 🔵
   - Se recibió heartbeat recientemente
   - Hay un usuario con sesión iniciada

---

## 🔧 Instalación Avanzada (Solo para Administradores)

### Opción 1: Instalación Automática (Recomendado)

El método estándar que usan los estudiantes también funciona para testing:

En la máquina cliente (VM del estudiante), ejecutar:

```bash
# Descargar los scripts
cd /tmp
wget http://172.29.137.160/scripts/uninet-agent.sh
wget http://172.29.137.160/scripts/install-client.sh

# Ejecutar instalador
sudo bash install-client.sh
```

### Opción 2: Instalación Manual

Si no hay servidor web para descargar los scripts:

```bash
# 1. Copiar uninet-agent.sh e install-client.sh a la máquina cliente

# 2. Ejecutar instalador desde el directorio que contiene ambos archivos
sudo bash install-client.sh
```

## 🔧 ¿Qué hace la instalación?

1. Copia `uninet-agent.sh` a `/usr/local/bin/uninet-agent`
2. Le da permisos de ejecución
3. Configura una tarea cron que ejecuta el agente cada 30 segundos
4. Verifica que el servicio cron esté activo
5. Hace una prueba de conexión con el servidor

## 📡 Funcionamiento del Agente

El agente (`uninet-agent.sh`) recopila y envía:

- **Hostname**: Nombre de la máquina
- **IP**: Dirección IP principal (excluyendo loopback)
- **Usuario**: Usuario con sesión gráfica activa (detectado con `who`)

Envía esta información mediante POST a:
```
http://172.29.137.160:4000/api/monitoring/heartbeat
```

## 🛠️ Verificación

### En el cliente

```bash
# Verificar que el agente está instalado
ls -l /usr/local/bin/uninet-agent

# Verificar tarea cron
crontab -l | grep uninet

# Ejecutar manualmente para probar
sudo /usr/local/bin/uninet-agent
```

### En el servidor

```bash
# Ver logs del backend
tail -f ~/UniNet/backend/logs/api.log

# Verificar estado de las PCs
curl http://172.29.137.160:4000/api/monitoring/status
```

### En el frontend

Acceder al dashboard: `http://localhost:5173`

Las PCs deberían aparecer con su estado real:
- Antes de instalar el agente: **offline** (rojo)
- Después de instalar, sin login: **online** (verde)
- Con usuario logueado: **inUse** (azul)

## 🔄 Desinstalación

```bash
# Eliminar agente
sudo rm /usr/local/bin/uninet-agent
sudo rm /usr/local/bin/uninet-agent-runner

# Eliminar tarea cron
crontab -l | grep -v uninet | crontab -
```

## 🐛 Solución de Problemas

### El agente no envía datos

1. Verificar conectividad con el servidor:
   ```bash
   ping 172.29.137.160
   curl http://172.29.137.160:4000/api/monitoring/status
   ```

2. Verificar que cron está activo:
   ```bash
   systemctl status cron
   ```

3. Ejecutar el agente manualmente para ver errores:
   ```bash
   sudo bash -x /usr/local/bin/uninet-agent
   ```

### La PC aparece como offline

- Verificar que pasaron menos de 60 segundos desde el último heartbeat
- El agente se ejecuta cada 30s, por lo que debería actualizarse constantemente

### No detecta el usuario activo

- El comando `who` debe mostrar el usuario con sesión gráfica
- Verificar ejecutando: `who`
- Si usa otra forma de login, ajustar la línea de detección en `uninet-agent.sh`

## 📝 Notas

- El sistema NO requiere autenticación para enviar heartbeats (es unidireccional)
- Los datos se almacenan en memoria en el servidor (se pierden al reiniciar)
- El umbral de timeout es de 60 segundos (configurable en `monitoring.py`)
- La frecuencia de heartbeat es de 30 segundos (cron cada minuto, ejecuta 2 veces)

## 🔐 Seguridad

- Solo se recopilan: hostname, IP y usuario activo
- No se capturan contraseñas ni datos sensibles
- La comunicación es HTTP (considerar HTTPS para producción)
- El endpoint `/heartbeat` no requiere autenticación (considerar tokens para producción)
