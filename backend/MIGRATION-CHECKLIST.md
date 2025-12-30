# 🔄 Checklist de Migración: ZeroTier → Tailscale

Esta guía paso a paso te ayudará a migrar de ZeroTier a Tailscale sin interrumpir tu trabajo.

---

## 📋 Pre-Migración (Preparación)

### ✅ Antes de empezar, anota:

- [ ] IP actual de ZeroTier de tu servidor: `_________________`
- [ ] Usuarios LDAP importantes: `_________________`
- [ ] PCs clientes conectadas: `_________________`

### ✅ Hacer backup:

```bash
# En el servidor Ubuntu
cd ~/UniNet
git add .
git commit -m "Backup antes de migrar a Tailscale"
git push

# Backup de LDAP
sudo slapcat > ~/ldap_backup_$(date +%Y%m%d).ldif
```

---

## 🖥️ Parte 1: Migrar el Servidor Ubuntu

### Paso 1: Crear cuenta de Tailscale

- [ ] Ir a: https://login.tailscale.com/start
- [ ] Iniciar sesión con GitHub
- [ ] Completar registro

### Paso 2: Instalar Tailscale en el servidor

```bash
cd ~/UniNet/backend/scripts
sudo ./setup-tailscale.sh
```

- [ ] Copiar y anotar tu IP de Tailscale: `100.___.___.___ `

### Paso 3: Verificar conectividad

```bash
# Desde el servidor, hacer ping a tu PC Windows
tailscale ping 100.66.73.74

# Ver todos los dispositivos conectados
tailscale status
```

### Paso 4: Actualizar configuración del backend

```bash
cd ~/UniNet/backend
./start-server.sh
```

**Verificar que el servidor muestre:**
```
✅ Tailscale detectado
   IP: 100.112.81.15
📡 URL Tailscale: http://100.112.81.15:4000
```

---

## 💻 Parte 2: Migrar tu PC de Desarrollo (Windows)

### Paso 1: Instalar Tailscale en Windows

- [ ] Descargar: https://tailscale.com/download/windows
- [ ] Ejecutar instalador
- [ ] Iniciar sesión con la misma cuenta de GitHub

### Paso 2: Verificar conexión

**En PowerShell:**
```powershell
# Ver tu IP de Tailscale
tailscale status --self

# Hacer ping al servidor
tailscale ping 100.112.81.15

# Verificar backend
curl http://100.112.81.15:4000/status
```

### Paso 3: Actualizar configuración del frontend

```bash
cd UniNet/frontend

# Copiar ejemplo
cp .env.example .env.local

# Editar con tu IP de Tailscale
notepad .env.local
```

**Contenido de `.env.local`:**
```env
VITE_API_URL=http://100.112.81.15:4000
VITE_STATUS_SERVER_URL=http://100.112.81.15:4000/api/status
```

### Paso 4: Reiniciar el frontend

```bash
npm run dev
```

- [ ] Abrir http://localhost:5173
- [ ] Verificar que puedes iniciar sesión
- [ ] Verificar que el dashboard carga correctamente

---

## 🖥️ Parte 3: Migrar PCs de Laboratorio (Clientes)

### Opción A: Reinstalar uno por uno (Pocos PCs)

Para cada PC cliente:

```bash
# 1. Desinstalar ZeroTier
sudo systemctl stop zerotier-one
sudo apt-get remove --purge zerotier-one
sudo rm -rf /var/lib/zerotier-one

# 2. Instalar Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 3. Conectar con Auth Key (ver abajo)
sudo tailscale up --authkey=tskey-auth-XXXXXXXXXXXXXXXXXXXXX

# 4. Reinstalar agente de monitoreo
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

### Opción B: Script de migración masiva (Muchos PCs)

**Crear Auth Key primero:**
1. Ir a: https://login.tailscale.com/admin/settings/keys
2. Generar Auth Key con opciones:
   - ✅ Reusable
   - ✅ Preauthorized
   - ✅ Ephemeral OFF

**Script de migración (ejecutar en cada PC):**

```bash
#!/bin/bash
# migrate-to-tailscale.sh

# Configuración
SERVER_IP="100.112.81.15"
AUTH_KEY="tskey-auth-XXXXXXXXXXXXXXXXXXXXX"
CARRERA="5010"  # Cambiar según la PC

# Desinstalar ZeroTier
echo "🗑️  Eliminando ZeroTier..."
sudo systemctl stop zerotier-one 2>/dev/null
sudo apt-get remove --purge zerotier-one -y 2>/dev/null
sudo rm -rf /var/lib/zerotier-one

# Instalar Tailscale
echo "📦 Instalando Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

# Conectar
echo "🔗 Conectando a Tailscale..."
sudo tailscale up --authkey="$AUTH_KEY"

# Reinstalar agente
echo "🔧 Configurando agente de monitoreo..."
SERVER_IP=$SERVER_IP CARRERA=$CARRERA curl -sSL http://$SERVER_IP:4000/install | sudo -E bash

echo "✅ Migración completada"
echo "   IP de Tailscale: $(tailscale ip -4)"
```

**Uso:**
```bash
# Copiar el script a cada PC
sudo bash migrate-to-tailscale.sh
```

---

## 👥 Parte 4: Agregar Desarrolladores (Roy, Patrick)

### Si Roy o Patrick quieren unirse:

1. **Alex invita a Roy:**
   - Ir a: https://login.tailscale.com/admin/settings/users
   - Click en "Invite user"
   - Ingresar correo de Roy: `roy@gmail.com`
   - Seleccionar rol: **Admin**

2. **Roy acepta invitación:**
   - Recibe correo → Click "Aceptar invitación"
   - Crea cuenta vinculada

3. **Roy instala Tailscale en su VM Ubuntu:**
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
   - **IMPORTANTE:** Seleccionar "Join [Alex]'s tailnet"

4. **Roy obtiene su IP:**
   ```bash
   tailscale ip -4
   # Ejemplo: 100.96.133.34
   ```

5. **Roy configura su `.env.local`:**
   ```env
   VITE_API_URL=http://100.96.133.34:4000
   VITE_STATUS_SERVER_URL=http://100.96.133.34:4000/api/status
   ```

---

## 🧹 Parte 5: Limpieza Post-Migración

### Una vez que todo funciona con Tailscale:

- [ ] Desinstalar ZeroTier de TODOS los dispositivos
- [ ] Eliminar la red de ZeroTier desde el panel web
- [ ] Actualizar documentación del proyecto
- [ ] Notificar al equipo de la migración completada

### Comandos de limpieza:

**En servidores Ubuntu:**
```bash
# Verificar que ZeroTier no esté corriendo
systemctl status zerotier-one

# Si aún existe, desinstalar
sudo systemctl stop zerotier-one
sudo apt-get remove --purge zerotier-one
sudo rm -rf /var/lib/zerotier-one
```

**En Windows:**
- Panel de Control → Programas → Desinstalar ZeroTier

---

## ✅ Verificación Final

### En el servidor:

```bash
# Ver estado de Tailscale
tailscale status

# Ver IP
tailscale ip -4

# Verificar que el backend está corriendo
curl http://$(tailscale ip -4):4000/status

# Ver logs del backend
sudo journalctl -u uninet-api -f
```

### En el frontend:

- [ ] Abrir http://localhost:5173
- [ ] Iniciar sesión con usuario LDAP
- [ ] Ver dashboard de PCs
- [ ] Verificar que los heartbeats llegan correctamente
- [ ] Probar bloqueo/desbloqueo de internet en una carrera

### En PCs clientes:

```bash
# Ver estado de Tailscale
tailscale status

# Verificar agente de monitoreo
sudo /usr/local/bin/uninet-agent

# Ver logs del agente
grep uninet /var/log/syslog | tail -20
```

---

## 🚨 Troubleshooting

### Problema: No puedo conectar al backend desde el frontend

**Solución:**
```bash
# En el servidor Ubuntu
sudo ufw allow in on tailscale0
sudo ufw allow 4000/tcp
sudo ufw reload
```

### Problema: El dispositivo no aparece en Tailscale

**Solución:**
```bash
# Verificar que está autenticado
tailscale status

# Si no, reconectar
sudo tailscale down
sudo tailscale up
```

### Problema: Los clientes no envían heartbeat

**Solución:**
```bash
# Verificar configuración
cat /etc/uninet/config

# Debe mostrar:
# SERVER_URL="http://100.112.81.15:4000/api/monitoring/heartbeat"

# Si no, reinstalar agente
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

---

## 📝 Checklist Final

- [ ] Servidor Ubuntu migrado a Tailscale
- [ ] PC de desarrollo Windows migrado
- [ ] Frontend actualizado con nueva IP
- [ ] Backend accesible desde Tailscale
- [ ] Todos los PCs clientes migrados
- [ ] Heartbeats funcionando correctamente
- [ ] Dashboard mostrando PCs en tiempo real
- [ ] Bloqueo de internet funciona
- [ ] ZeroTier desinstalado de todos los dispositivos
- [ ] Equipo notificado de la migración

---

**¡Migración completada! 🎉**

Ahora tienes una red más estable, segura y fácil de gestionar con Tailscale.
