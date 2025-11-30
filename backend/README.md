# Backend - Status Server

Servidor Python (Flask) que monitorea el estado de las máquinas cliente mediante ping.

## 📋 Contenido

- `status_server.py` - Servidor Flask principal
- `requirements.txt` - Dependencias Python
- `install.sh` - Script de instalación automática

## 🚀 Instalación Rápida

```bash
# Asegúrate de estar en la carpeta backend
cd backend

# Da permisos y ejecuta
chmod +x install.sh
sudo ./install.sh
```

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
