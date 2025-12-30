# Backend - UniNet API Server

Servidor FastAPI que gestiona autenticación LDAP, usuarios y monitoreo de laboratorio en tiempo real.

---

## 🔑 PASO 0: Generar Auth Key de Tailscale (Una sola vez)

**El administrador (Alex) debe hacer esto UNA VEZ y compartir el token con el equipo:**

1. Ir a: https://login.tailscale.com/admin/settings/keys
2. Click en **"Generate auth key"**
3. Configurar:
   - ✅ **Reusable** (para usar en múltiples máquinas)
   - ✅ **Preauthorized** (no necesita aprobación manual)
   - ❌ **Ephemeral** (desactivar)
   - **Expiration:** 90 días

4. Copiar el token generado:
   ```
   tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX
   ```

5. **Compartir este token con Roy, Patrick y guardarlo para instalaciones futuras**

---

## 🖥️ Convertir una VM Ubuntu en SERVIDOR

**Ejecutar estos comandos en orden:**

```bash
# 1. Instalar Tailscale y unirse a la red
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX

# 2. Clonar el proyecto
git clone https://github.com/TU-REPO/UniNet.git
cd UniNet/backend

# 3. Instalar el servidor (configura automáticamente Tailscale, LDAP, firewall, etc.)
sudo ./install.sh

# 4. Anotar tu IP de Tailscale
tailscale ip -4
# Ejemplo: 100.112.81.15
```

**¡Listo!** Tu servidor está corriendo en: `http://100.112.81.15:4000`

### Verificar que funciona:

```bash
# Desde el servidor
curl http://$(tailscale ip -4):4000/health

# Ver logs en tiempo real
sudo journalctl -u uninet-api -f
```

---

## 💻 Convertir una VM Ubuntu en CLIENTE (PC de Laboratorio)

**Ejecutar estos comandos en orden:**

```bash
# 1. Instalar Tailscale y unirse a la red
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX

# 2. Instalar agente de monitoreo
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

**Variables a cambiar:**
- `SERVER_IP`: La IP de Tailscale de tu servidor (del paso anterior)
- `CARRERA`: Código de la carrera (5001-5012)

### Códigos de Carrera:

```
5001 → Administración y Negocios Internacionales
5002 → Contabilidad y Finanzas
5003 → Derecho y Ciencias Políticas
5004 → Ecoturismo
5005 → Educación Inicial y Especial
5006 → Educación Matemáticas y Computación
5007 → Educación Primaria e Informática
5008 → Enfermería
5009 → Ingeniería Agroindustrial
5010 → Ingeniería de Sistemas e Informática
5011 → Ingeniería Forestal y Medio Ambiente
5012 → Medicina Veterinaria y Zootecnia
```

**¡Listo!** El cliente está reportando al servidor cada 30 segundos.

---

## 👥 Para Desarrolladores (Roy, Patrick)

Si quieres tu propio servidor de desarrollo:

```bash
# 1. Usar el mismo Auth Key compartido
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX

# 2. Clonar y configurar
git clone https://github.com/TU-REPO/UniNet.git
cd UniNet/backend
sudo ./install.sh

# 3. Obtener tu IP
tailscale ip -4
# Ejemplo: 100.96.133.34

# 4. Configurar frontend en tu PC Windows
cd ../frontend
cp .env.example .env.local
echo "VITE_API_URL=http://100.96.133.34:4000" > .env.local
```

---

## 📚 Documentación Completa

- **Guía completa de Tailscale:** [TAILSCALE-SETUP.md](TAILSCALE-SETUP.md)
- **Migrar desde ZeroTier:** [MIGRATION-CHECKLIST.md](MIGRATION-CHECKLIST.md)
- **Comandos rápidos:** [QUICK-REFERENCE.md](QUICK-REFERENCE.md)

---

## 🛠️ Instalación Manual (Si prefieres paso a paso)

### 📦 Instalación en Cliente (Método Interactivo - Alternativo)

Si no quieres especificar la carrera en el comando:

```bash
# Descargar e instalar interactivamente
curl -sSL http://100.112.81.15:4000/install -o /tmp/uninet-install.sh
sudo bash /tmp/uninet-install.sh
```

**Durante la instalación, aparecerá:**
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

**Selecciona el número de la carrera** → ¡Listo! ✅

---

##  ¿Qué hace la instalación en los clientes?

1. **Detecta IP del servidor automáticamente**
2. **Solicita laboratorio/carrera** (interactivo o por variable)
3. **Instala agente de monitoreo** (`uninet-agent.sh`)
4. **Configura autenticación LDAP** (nslcd + PAM + NSS)
5. **Crea grupos del sistema** (alumnos=5000, docentes=6000)
6. **Configura cron** (heartbeat cada 30 segundos)
7. **Habilita auto-creación de home directories**

✅ El equipo ahora:
- Aparece automáticamente en el dashboard
- Permite login con usuarios LDAP
- Reporta su estado en tiempo real
- Solo se muestra en el dashboard de SU carrera

---

## 🎓 Códigos de Carrera

| Código | Carrera |
|--------|---------|
| 5001 | Administración y Negocios Internacionales |
| 5002 | Contabilidad y Finanzas |
| 5003 | Derecho y Ciencias Políticas |
| 5004 | Ecoturismo |
| 5005 | Educación Inicial y Especial |
| 5006 | Educación Matemáticas y Computación |
| 5007 | Educación Primaria e Informática |
| 5008 | Enfermería |
| 5009 | Ingeniería Agroindustrial |
| 5010 | Ingeniería de Sistemas e Informática (default) |
| 5011 | Ingeniería Forestal y Medio Ambiente |
| 5012 | Medicina Veterinaria y Zootecnia |

---

## 📋 Scripts Disponibles

### 🚀 Iniciar Servidor (Recomendado)
```bash
chmod +x start-server.sh
./start-server.sh
```
Este script:
- ✅ Mata procesos zombies automáticamente
- ✅ Verifica que el puerto esté libre
- ✅ Activa el entorno virtual
- ✅ Inicia uvicorn con reload

### 🛑 Detener Servidor
```bash
chmod +x stop-server.sh
./stop-server.sh
```

### 🔍 Verificar Estado
```bash
chmod +x check-server.sh
./check-server.sh
```
Muestra:
- Estado del servidor (corriendo/detenido)
- Puerto 4000 (libre/ocupado)
- PIDs de procesos activos

---

## 🔧 Instalación Manual

Si prefieres el método tradicional:

```bash
# Asegúrate de estar en la carpeta backend
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Iniciar manualmente (sin auto-limpieza)
```bash
# Opción 1: Con auto-reload (desarrollo)
python -m uvicorn api.main:app --host 0.0.0.0 --port 4000 --reload

# Opción 2: Sin auto-reload (producción)
python -m uvicorn api.main:app --host 0.0.0.0 --port 4000
```

⚠️ **Problema común:** Si el puerto está ocupado:
```bash
# Mata el proceso zombie
sudo fuser -k 4000/tcp
```

---

## 📡 Endpoints

- `GET /status` - Estado de todos los hosts (con ping)
- `GET /hosts` - Lista de hosts configurados
- `GET /health` - Salud del servidor

## ⚙️ Configuración

Para modificar los hosts monitoreados, edita `status_server.py`:

```python
HOSTS = [
    {"id": "pc-01", "name": "PC-LAB-01", "ip": "172.29.2.37"},
    {"id": "pc-02", "name": "PC-LAB-02", "ip": "172.29.157.94"},
    {"id": "pc-03", "name": "PC-LAB-03", "ip": "172.29.177.20"},
    {"id": "server-01", "name": "SERVIDOR", "ip": "172.29.137.160"},
]
```

Luego reinicia el servicio:

```bash
sudo systemctl restart uninet-status
```

## 🛠️ Comandos Útiles

```bash
# Ver logs en tiempo real
sudo journalctl -u uninet-status -f

# Ver estado del servicio
sudo systemctl status uninet-status

# Reiniciar servicio
sudo systemctl restart uninet-status
```

## 📝 Notas

- El servidor escucha en el puerto `4000`
- Requiere acceso a la red ZeroTier para hacer ping a las IPs
- Se instala como servicio systemd con auto-inicio
