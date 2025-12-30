# 🚀 Comandos Rápidos - UniNet con Tailscale

Referencia rápida de comandos comunes para administrar UniNet con Tailscale.

---

## 🖥️ En el Servidor Ubuntu

### Tailscale

```bash
# Ver tu IP de Tailscale
tailscale ip -4

# Ver todos los dispositivos conectados
tailscale status

# Ver solo tu dispositivo
tailscale status --self

# Hacer ping a otro dispositivo
tailscale ping 100.66.73.74

# Desconectar
sudo tailscale down

# Reconectar
sudo tailscale up

# Ver logs
sudo journalctl -u tailscaled -f

# Reiniciar servicio
sudo systemctl restart tailscaled
```

### Backend (FastAPI)

```bash
# Iniciar servidor (desarrollo)
cd ~/UniNet/backend
./start-server.sh

# Verificar que está corriendo
curl http://localhost:4000/status
curl http://$(tailscale ip -4):4000/status

# Ver logs en tiempo real
sudo journalctl -u uninet-api -f

# Reiniciar servicio
sudo systemctl restart uninet-api

# Ver estado
sudo systemctl status uninet-api

# Detener servicio
sudo systemctl stop uninet-api

# Ver procesos en puerto 4000
sudo lsof -i :4000

# Matar proceso zombie
sudo fuser -k 4000/tcp
```

### Firewall (UFW)

```bash
# Ver reglas activas
sudo ufw status verbose

# Permitir tráfico en Tailscale
sudo ufw allow in on tailscale0

# Permitir puerto 4000 (FastAPI)
sudo ufw allow 4000/tcp

# Permitir puerto 389 (LDAP)
sudo ufw allow 389/tcp

# Recargar firewall
sudo ufw reload

# Habilitar firewall
sudo ufw enable

# Deshabilitar firewall (temporalmente)
sudo ufw disable
```

### LDAP

```bash
# Listar todos los usuarios
ldapsearch -x -b "dc=uninet,dc=com" "(uid=*)" uid

# Ver detalles de un usuario
ldapsearch -x -b "dc=uninet,dc=com" "(uid=alex)" 

# Crear usuario
cd ~/UniNet/backend/scripts/ldap
sudo ./create-user.sh

# Eliminar usuario
sudo ./delete-user.sh

# Listar usuarios con getent
getent passwd | grep '/home'

# Ver grupos
getent group

# Probar autenticación
sudo -u pepe whoami
```

---

## 💻 En tu PC de Desarrollo (Windows)

### Tailscale (PowerShell)

```powershell
# Ver tu IP de Tailscale
tailscale status --self

# Ver todos los dispositivos
tailscale status

# Hacer ping al servidor
tailscale ping 100.112.81.15

# Ver logs
tailscale debug watch-ipn
```

### Frontend (React + Vite)

```bash
# Instalar dependencias
cd UniNet/frontend
npm install

# Iniciar desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Ver variables de entorno
cat .env.local
```

### Verificar Backend

```powershell
# Health check
curl http://100.112.81.15:4000/health

# Status del servidor
curl http://100.112.81.15:4000/status

# Ver documentación API
# Abrir en navegador: http://100.112.81.15:4000/docs
```

---

## 🖥️ En PCs Clientes (Ubuntu Desktop)

### Tailscale

```bash
# Ver IP de Tailscale
tailscale ip -4

# Ver estado
tailscale status

# Hacer ping al servidor
tailscale ping 100.112.81.15
```

### Agente de Monitoreo

```bash
# Ejecutar manualmente
sudo /usr/local/bin/uninet-agent

# Ver configuración
cat /etc/uninet/config

# Ver logs
grep uninet /var/log/syslog | tail -50

# Ver cron job
crontab -l | grep uninet

# Verificar que cron está activo
systemctl status cron

# Reinstalar agente (si falla)
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

### LDAP en Cliente

```bash
# Ver usuario actual
whoami

# Ver información de usuario LDAP
id pepe

# Listar usuarios LDAP disponibles
getent passwd | grep '/home'

# Cambiar a usuario LDAP
sudo -u pepe -i

# Verificar directorio home
ls -la /home/pepe
```

---

## 🌐 Panel Web de Tailscale

### URLs importantes:

- **Máquinas:** https://login.tailscale.com/admin/machines
- **Usuarios:** https://login.tailscale.com/admin/settings/users
- **Auth Keys:** https://login.tailscale.com/admin/settings/keys
- **ACLs:** https://login.tailscale.com/admin/acls
- **DNS:** https://login.tailscale.com/admin/dns

### Acciones comunes:

1. **Renombrar dispositivo:**
   - Machines → Click en 3 puntos → Rename

2. **Deshabilitar expiración:**
   - Machines → Click en 3 puntos → Disable key expiry

3. **Eliminar dispositivo:**
   - Machines → Click en 3 puntos → Remove

4. **Crear Auth Key:**
   - Settings → Keys → Generate auth key
   - ✅ Reusable
   - ✅ Preauthorized
   - ❌ Ephemeral

---

## 🔧 Instalación Rápida

### Servidor nuevo (Ubuntu)

```bash
# 1. Clonar repo
git clone https://github.com/TU-REPO/UniNet.git
cd UniNet/backend

# 2. Instalar Tailscale
sudo ./scripts/setup-tailscale.sh

# 3. Anotar IP
tailscale ip -4

# 4. Instalar backend
sudo ./install.sh

# 5. Verificar
curl http://$(tailscale ip -4):4000/status
```

### Cliente nuevo (PC de laboratorio)

```bash
# Instalación con una sola línea
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

### Desarrollador nuevo (Roy/Patrick)

```bash
# 1. Aceptar invitación (correo)
# 2. Instalar Tailscale en VM
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 3. Seleccionar "Join [Alex]'s tailnet"
# 4. Obtener IP
tailscale ip -4

# 5. Configurar .env.local
echo "VITE_API_URL=http://$(tailscale ip -4):4000" > ~/UniNet/frontend/.env.local
```

---

## 📊 Monitoreo en Tiempo Real

### Ver heartbeats en el servidor

```bash
# Ver logs del backend en tiempo real
sudo journalctl -u uninet-api -f | grep heartbeat

# Ver logs del agente en clientes
# (ejecutar en cada PC cliente)
grep uninet /var/log/syslog | tail -f
```

### Ver conexiones de red

```bash
# Ver conexiones activas en puerto 4000
sudo netstat -tulpn | grep :4000

# Ver conexiones de Tailscale
sudo netstat -i | grep tailscale
```

---

## 🚨 Troubleshooting Rápido

### Backend no responde

```bash
# 1. Verificar que está corriendo
sudo systemctl status uninet-api

# 2. Reiniciar
sudo systemctl restart uninet-api

# 3. Ver logs de error
sudo journalctl -u uninet-api -n 50

# 4. Verificar puerto
sudo lsof -i :4000
```

### Cliente no envía heartbeat

```bash
# 1. Verificar configuración
cat /etc/uninet/config

# 2. Ejecutar manualmente
sudo /usr/local/bin/uninet-agent

# 3. Ver error exacto
sudo /usr/local/bin/uninet-agent 2>&1

# 4. Reinstalar
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

### No puedo conectar por Tailscale

```bash
# 1. Verificar que está conectado
tailscale status

# 2. Hacer ping
tailscale ping 100.112.81.15

# 3. Ver logs
sudo journalctl -u tailscaled -f

# 4. Reconectar
sudo tailscale down
sudo tailscale up

# 5. Verificar firewall
sudo ufw status verbose
sudo ufw allow in on tailscale0
```

---

## 📋 Variables de Entorno

### Backend (no necesita .env actualmente)

Las configuraciones están en los scripts.

### Frontend (.env.local)

```env
# Desarrollo de Alex
VITE_API_URL=http://100.112.81.15:4000
VITE_STATUS_SERVER_URL=http://100.112.81.15:4000/api/status

# Desarrollo de Roy
VITE_API_URL=http://100.96.133.34:4000
VITE_STATUS_SERVER_URL=http://100.96.133.34:4000/api/status

# Desarrollo de Patrick
VITE_API_URL=http://100.120.50.30:4000
VITE_STATUS_SERVER_URL=http://100.120.50.30:4000/api/status
```

### Cliente (/etc/uninet/config)

```bash
SERVER_URL="http://100.112.81.15:4000/api/monitoring/heartbeat"
SERVER_IP="100.112.81.15"
SERVER_PORT="4000"
CARRERA="5010"
```

---

## 🔑 Códigos de Carrera

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

---

## 📞 Recursos Adicionales

- **Guía completa de Tailscale:** [TAILSCALE-SETUP.md](TAILSCALE-SETUP.md)
- **Checklist de migración:** [MIGRATION-CHECKLIST.md](MIGRATION-CHECKLIST.md)
- **README del backend:** [README.md](README.md)
- **Documentación de Tailscale:** https://tailscale.com/kb/

---

**Tip:** Guarda este archivo en tus favoritos para acceso rápido! 📌
