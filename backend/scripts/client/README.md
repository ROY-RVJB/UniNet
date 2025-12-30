# UniNet - Sistema de Monitoreo de Clientes

Scripts para configurar el monitoreo automático en equipos de laboratorio (VMs Ubuntu de estudiantes).

---

## 🎯 Instalación en Equipos de Laboratorio

### 📦 Método Recomendado (Interactivo)

**En cada equipo Ubuntu del laboratorio, ejecutar UN SOLO COMANDO:**

```bash
curl -sSL http://IP-DEL-SERVIDOR:4000/install | sudo bash
```

> **Reemplaza `IP-DEL-SERVIDOR`** con la IP real de tu servidor (ejemplo: `172.29.137.160`)

**Ejemplo real:**
```bash
curl -sSL http://172.29.137.160:4000/install | sudo bash
```

---

### 📝 Durante la Instalación

Te preguntará a qué laboratorio pertenece el equipo:

```
🏫 Selecciona el laboratorio al que pertenece esta PC:

  1) Administración y Negocios Internacionales
  2) Contabilidad y Finanzas
  3) Derecho y Ciencias Políticas
  4) Ecoturismo
  5) Educación Inicial y Especial
  6) Educación Matemáticas y Computación
  7) Educación Primaria e Informática
  8) Enfermería
  9) Ingeniería Agroindustrial
 10) Ingeniería de Sistemas e Informática
 11) Ingeniería Forestal y Medio Ambiente
 12) Medicina Veterinaria y Zootecnia

Selecciona (1-12): _
```

**Escribe el número** del laboratorio y presiona Enter.

✅ **¡Instalación completa!** El equipo ahora:
- Aparece automáticamente en el dashboard
- Permite login con usuarios LDAP creados en la web
- Reporta su estado cada **5 segundos** (detección rápida)
- Solo se muestra en el dashboard de su carrera

---

## 🔧 Métodos Alternativos

### Opción 1: Con Variable de Entorno (Para instalaciones masivas sin interacción)

**Solo úsalo si necesitas automatizar** la instalación en muchas PCs sin que pregunte:

```bash
# Ejemplo: Instalar en 20 PCs de Contabilidad sin menú interactivo
CARRERA=5002 curl -sSL http://IP-DEL-SERVIDOR:4000/install | sudo -E bash
```

**¿Cuándo usar esto?**
- Scripts de instalación masiva
- Imágenes pre-configuradas
- Ansible/automatización

**Códigos de carrera:** Ver tabla al final de este documento.

### Opción 2: Modo Default (NO recomendado - solo para testing)

```bash
curl -sSL http://IP-DEL-SERVIDOR:4000/install | sudo bash
```

⚠️ Si no defines CARRERA ni seleccionas en el menú, usa automáticamente 5010 (Sistemas)

---

## 📋 Descripción del Sistema

El sistema de monitoreo funciona mediante **heartbeats** (latidos): cada máquina cliente envía su estado cada **5 segundos** al servidor. El servidor determina el estado de cada máquina basándose en:

### Estados de las PCs

1. **offline** 🔴
   - No se ha recibido heartbeat en más de **15 segundos**
   - La máquina está apagada o sin conexión de red

2. **online** 🟢
   - Se recibió heartbeat recientemente (< 15s)
   - No hay usuario activo en la sesión

3. **inUse** 🔵
   - Se recibió heartbeat recientemente
   - Hay un usuario con sesión iniciada

**⚡ Detección rápida:** Los cambios de estado se reflejan en **3-5 segundos**

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

## � ¿Qué hace la instalación?

1. **Detecta IP del servidor** automáticamente desde donde se descargó
2. **Pregunta el laboratorio** (modo interactivo) o usa variable/default
3. **Instala agente de monitoreo** en `/usr/local/bin/uninet-agent`
4. **Guarda configuración** en `/etc/uninet/config` (incluye código de carrera)
5. **Configura autenticación LDAP:**
   - Instala nslcd, PAM, NSS
   - Configura conexión al servidor LDAP
   - Habilita login con usuarios LDAP
6. **Crea grupos del sistema:**
   - GID 5000: alumnos
   - GID 6000: docentes
7. **Configura cron** para ejecutar el agente cada 30 segundos
8. **Habilita auto-creación** de home directories (pam_mkhomedir)

---

## 📡 Funcionamiento del Agente

El agente (`uninet-agent.sh`) recopila y envía cada **5 segundos**:

- **Hostname**: Nombre de la máquina
- **IP**: Dirección IP principal (excluyendo loopback)
- **Usuario**: Usuario LDAP con sesión activa (detectado con `who`)
- **Carrera**: Código del laboratorio al que pertenece (5001-5012)

Envía esta información mediante POST JSON a:
```
http://SERVIDOR:4000/api/monitoring/heartbeat
```

**Ejemplo de payload:**
```json
{
  "hostname": "equipo",
  "ip": "172.29.137.161",
  "user": "tomas.quispe",
  "carrera": "5002"
}
```

---

## 🎓 Códigos de Carrera

| Código | Carrera | Dashboard |
|--------|---------|-----------|
| 5001 | Administración y Negocios Internacionales | Solo ve estas PCs |
| 5002 | Contabilidad y Finanzas | Solo ve estas PCs |
| 5003 | Derecho y Ciencias Políticas | Solo ve estas PCs |
| 5004 | Ecoturismo | Solo ve estas PCs |
| 5005 | Educación Inicial y Especial | Solo ve estas PCs |
| 5006 | Educación Matemáticas y Computación | Solo ve estas PCs |
| 5007 | Educación Primaria e Informática | Solo ve estas PCs |
| 5008 | Enfermería | Solo ve estas PCs |
| 5009 | Ingeniería Agroindustrial | Solo ve estas PCs |
| 5010 | Ingeniería de Sistemas e Informática | Solo ve estas PCs |
| 5011 | Ingeniería Forestal y Medio Ambiente | Solo ve estas PCs |
| 5012 | Medicina Veterinaria y Zootecnia | Solo ve estas PCs |

**Importante:** Cada dashboard filtra automáticamente y solo muestra las PCs de su laboratorio.

---

## 🛠️ Verificación

### En el cliente

```bash
# Verificar que el agente está instalado
ls -l /usr/local/bin/uninet-agent

# Verificar configuración (incluyendo carrera)
cat /etc/uninet/config

# Verificar tarea cron
crontab -l | grep uninet

# Ejecutar manualmente para probar
sudo /usr/local/bin/uninet-agent

# Verificar autenticación LDAP
getent passwd nombre.usuario  # Debe mostrar el usuario
id nombre.usuario             # Debe mostrar uid, gid
```

### En el servidor

```bash
# Ver estado de las PCs (todas)
curl http://IP-DEL-SERVIDOR:4000/api/monitoring/status

# Ver PCs de una carrera específica (ej: Contabilidad)
curl http://IP-DEL-SERVIDOR:4000/api/monitoring/status?carrera=5002

# Verificar que el backend recibe heartbeats
tail -f backend/logs/server.log
```

### En el frontend (Dashboard Web)

Acceder al dashboard: `http://localhost:5173` o desde otra máquina `http://IP_WINDOWS:5173`

Las PCs aparecerán según su estado:
- **offline** 🔴 - Sin heartbeat en 60+ segundos (apagada/desconectada)
- **online** 🟢 - Con heartbeat pero sin usuario
- **inUse** 🔵 - Con heartbeat y usuario activo

**Filtrado automático:**
- Dashboard de Contabilidad → Solo ve PCs con carrera=5002
- Dashboard de Sistemas → Solo ve PCs con carrera=5010
- etc.

---

## 🐛 Troubleshooting

### El equipo no aparece en el dashboard

1. Verifica conectividad al servidor:
```bash
ping IP-DEL-SERVIDOR
curl http://IP-DEL-SERVIDOR:4000/health
```

2. Ejecuta el agente manualmente y ve si hay errores:
```bash
sudo /usr/local/bin/uninet-agent -v
```

3. Verifica que cron está corriendo:
```bash
sudo systemctl status cron
```

### El usuario LDAP no puede hacer login

1. Verifica que el usuario existe en LDAP (desde el servidor):
```bash
sudo ldapsearch -x -b "dc=uninet,dc=com" "(uid=nombre.usuario)"
```

2. Verifica conectividad LDAP desde el cliente:
```bash
sudo systemctl status nslcd
getent passwd | grep nombre.usuario
```

3. Verifica grupos:
```bash
getent group alumnos   # Debe existir con GID 5000
getent group docentes  # Debe existir con GID 6000
```

### La PC aparece en todas las carreras (bug)

Verifica que el config tiene la carrera correcta:
```bash
cat /etc/uninet/config | grep CARRERA
```

Si está mal, corrígelo manualmente:
```bash
sudo nano /etc/uninet/config
# Cambia CARRERA="XXXX" al código correcto
```

---

## 📚 Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `/usr/local/bin/uninet-agent` | Script del agente de monitoreo |
| `/etc/uninet/config` | Configuración (servidor, carrera) |
| `/etc/nslcd.conf` | Configuración de autenticación LDAP |
| `/etc/nsswitch.conf` | Name Service Switch (passwd, group, shadow) |
| `/etc/pam.d/common-*` | Configuración PAM para autenticación |

---
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

- Verificar que pasaron menos de **15 segundos** desde el último heartbeat
- El agente se ejecuta cada **5 segundos**, por lo que debería actualizarse constantemente

### No detecta el usuario activo

- El comando `who` debe mostrar el usuario con sesión gráfica
- Verificar ejecutando: `who`
- Si usa otra forma de login, ajustar la línea de detección en `uninet-agent.sh`

## 📝 Notas

- El sistema NO requiere autenticación para enviar heartbeats (es unidireccional)
- Los datos se almacenan en memoria en el servidor (se pierden al reiniciar)
- El umbral de timeout es de **15 segundos** (configurable en `monitoring.py`)
- La frecuencia de heartbeat es de **5 segundos** (cron ejecuta 12 veces por minuto)
- **Detección rápida**: Cambios visibles en 3-5 segundos máximo

### 🔄 Actualización de Clientes Existentes

**¿Ya tienes clientes instalados con la versión antigua (30 segundos)?**

Simplemente **vuelve a ejecutar el mismo comando de instalación:**
```bash
curl -sSL http://IP-DEL-SERVIDOR:4000/install | sudo bash
```

El script es **idempotente** - detecta instalación existente y actualiza automáticamente a 5 segundos.

## 🔐 Seguridad

- Solo se recopilan: hostname, IP y usuario activo
- No se capturan contraseñas ni datos sensibles
- La comunicación es HTTP (considerar HTTPS para producción)
- El endpoint `/heartbeat` no requiere autenticación (considerar tokens para producción)
