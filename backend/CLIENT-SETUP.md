# Script de Configuración para Clientes

Este script configura automáticamente un cliente Ubuntu para ser monitoreado por el servidor UniNet.

## 📋 ¿Qué hace el script?

1. ✅ Instala SSH y dependencias básicas
2. ✅ Configura el firewall (UFW) para permitir administración
3. ✅ Crea archivo de identificación del cliente
4. ✅ Configura servicio de heartbeat
5. ✅ Prepara el cliente para ser monitoreado

## 🚀 Cómo usar

### En cada PC cliente Ubuntu:

1. **Descargar el script del repositorio:**

```bash
cd ~
git clone https://github.com/ROY-RVJB/UniNet.git
cd UniNet/backend
```

2. **Dar permisos de ejecución:**

```bash
chmod +x client-setup.sh
```

3. **Ejecutar el script:**

```bash
sudo ./client-setup.sh
```

El script mostrará el progreso y al final te dará la IP del cliente configurado.

## 📝 Verificación

Después de ejecutar el script en un cliente, desde el servidor puedes verificar:

```bash
# Hacer ping al cliente
ping 172.29.2.37

# Ver si el servicio está corriendo
ssh usuario@172.29.2.37 "systemctl status uninet-heartbeat"
```

## ⚙️ Archivos creados

- `/etc/uninet/client.conf` - Información del cliente
- `/usr/local/bin/uninet-heartbeat.sh` - Script de heartbeat
- `/etc/systemd/system/uninet-heartbeat.service` - Servicio systemd

## 🔄 Desinstalar

Para remover la configuración:

```bash
sudo systemctl stop uninet-heartbeat
sudo systemctl disable uninet-heartbeat
sudo rm /etc/systemd/system/uninet-heartbeat.service
sudo rm /usr/local/bin/uninet-heartbeat.sh
sudo rm -rf /etc/uninet
sudo systemctl daemon-reload
```

## 🎯 Notas importantes

- El script requiere permisos de root (sudo)
- Asegúrate de que el cliente esté en la red ZeroTier
- El servidor podrá detectar el cliente automáticamente una vez configurado
- El heartbeat asegura que el cliente responda al ping del servidor
