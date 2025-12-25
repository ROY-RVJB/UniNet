# Backend - UniNet API Server

Servidor FastAPI que gestiona autenticación, usuarios LDAP y monitoreo de laboratorio.

## 📋 Scripts Disponibles

### � Configurar Permisos (Primer Uso)
```bash
cd scripts
sudo bash setup-permissions.sh
```
**Ejecuta esto una sola vez** para configurar:
- Permisos de archivos LDAP (owner: tu usuario)
- Contraseña admin LDAP
- Contador de UID (detecta último UID en LDAP automáticamente)

### �🚀 Iniciar Servidor (Recomendado)
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
