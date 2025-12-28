# Backend - UniNet API Server

Servidor FastAPI que gestiona autenticación LDAP, usuarios y monitoreo de laboratorio en tiempo real.

---

## 🚀 Configuración del Servidor (Primera Vez)

### 1️⃣ Clonar el Repositorio
```bash
git clone https://github.com/TU-REPO/UniNet.git
cd UniNet/backend
```

### 2️⃣ Instalar Dependencias
```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3️⃣ Configurar OpenLDAP (si no está instalado)
```bash
cd scripts/ldap
sudo bash setup.sh
```
Este script configura:
- ✅ OpenLDAP (slapd)
- ✅ Base DN: `dc=uninet,dc=com`
- ✅ Usuario admin: `cn=admin,dc=uninet,dc=com`
- ✅ Contraseña admin: `admin123` (cámbiala en producción)
- ✅ OUs: users, groups

### 4️⃣ Configurar Permisos
```bash
cd scripts
sudo bash setup-permissions.sh
```
Configura:
- Permisos de archivos LDAP
- Contador de UID automático
- Archivo de contraseña admin

### 5️⃣ Iniciar el Servidor
```bash
cd backend
./start-server.sh
```

✅ **Servidor corriendo en:** `http://0.0.0.0:4000`
📊 **Documentación API:** `http://0.0.0.0:4000/docs`

---

## 🖥️ Configuración de Equipos Cliente (Estudiantes)

Una vez que el servidor esté corriendo, los equipos de los estudiantes se instalan fácilmente.

### 📦 Instalación en Cliente (Método Interactivo - Recomendado)

En cada equipo Ubuntu de laboratorio, ejecutar:

```bash
# Paso 1: Descargar script de instalación
curl -sSL http://IP_DEL_SERVIDOR:4000/install -o /tmp/uninet-install.sh

# Paso 2: Ejecutar instalación interactiva
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

### 🔧 Métodos Alternativos de Instalación

#### Opción 1: Modo Rápido con Variable (Sin Menú)
```bash
# Para Contabilidad (código 5002):
CARRERA=5002 curl -sSL http://IP_DEL_SERVIDOR:4000/install | sudo -E bash

# Para Sistemas (código 5010):
CARRERA=5010 curl -sSL http://IP_DEL_SERVIDOR:4000/install | sudo -E bash
```

#### Opción 2: Modo Automático (Default = Sistemas)
```bash
curl -sSL http://IP_DEL_SERVIDOR:4000/install | sudo bash
```
⚠️ Usa automáticamente carrera 5010 (Sistemas)

---

## 🔄 ¿Qué hace la instalación en los clientes?

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
