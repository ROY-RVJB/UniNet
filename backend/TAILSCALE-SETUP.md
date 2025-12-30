# 🌐 Guía de Configuración de Tailscale para UniNet

Esta guía documenta cómo configurar Tailscale para conectar todos los componentes de UniNet: servidores, clientes (PCs de estudiantes) y máquinas de desarrollo.

---

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Arquitectura de la Red](#arquitectura-de-la-red)
3. [Configuración del Administrador (Alex)](#configuración-del-administrador-alex)
4. [Agregar Servidores Ubuntu a la Red](#agregar-servidores-ubuntu-a-la-red)
5. [Agregar Clientes Windows/Linux a la Red](#agregar-clientes-windowslinux-a-la-red)
6. [Agregar Desarrolladores al Equipo](#agregar-desarrolladores-al-equipo)
7. [Verificación y Troubleshooting](#verificación-y-troubleshooting)
8. [Comandos Útiles](#comandos-útiles)

---

## ✅ Requisitos Previos

- **Cuenta de Tailscale:** Gratis para hasta 100 dispositivos
- **Ubuntu 22.04+** en servidores
- **Windows 10/11** o **Ubuntu Desktop** en PCs cliente
- **Permisos de administrador** en todos los dispositivos

---

## 🏗️ Arquitectura de la Red

```
Tailscale Network (tailnet de Alex)
├── 🖥️ Servidor Ubuntu (Backend + LDAP)
│   └── IP: 100.112.81.15
│   └── Hostname: server-alexander
│
├── 💻 PC de Desarrollo Windows (Frontend)
│   └── IP: 100.66.73.74
│   └── Hostname: desktop-u83ilns
│
└── 🖥️ PCs de Laboratorio (Clientes)
    ├── lab-pc-01 → 100.x.x.x
    ├── lab-pc-02 → 100.y.y.y
    └── lab-pc-XX → 100.z.z.z
```

**Ventajas:**
- ✅ IPs privadas fijas (`100.x.x.x`) que nunca cambian
- ✅ Comunicación cifrada automática
- ✅ Acceso remoto desde casa sin configurar routers
- ✅ Sin dependencia de redes físicas de la universidad

---

## 👑 Configuración del Administrador (Alex)

### Paso 1: Crear Cuenta de Tailscale

1. Ve a: https://login.tailscale.com/start
2. Inicia sesión con tu cuenta de **GitHub** (recomendado)
3. Completa el proceso de registro

### Paso 2: Configurar Límites (Opcional)

- Plan gratuito: **100 dispositivos activos**
- Si necesitas más, considera el plan Personal Pro ($48/año)

### Paso 3: Instalar Tailscale en tu PC Windows

**Opción A: Instalador GUI**
1. Descarga: https://tailscale.com/download/windows
2. Ejecuta el instalador
3. Inicia sesión con tu cuenta de GitHub

**Opción B: PowerShell (Requiere Admin)**
```powershell
winget install tailscale.tailscale
```

### Paso 4: Verificar tu Tailnet

Ve a: https://login.tailscale.com/admin/machines

Deberías ver tu PC Windows listado con una IP `100.x.x.x`.

---

## 🖥️ Agregar Servidores Ubuntu a la Red

### Para el Servidor Principal (Backend + LDAP)

#### Paso 1: Instalar Tailscale en Ubuntu

```bash
# Instalar Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Iniciar Tailscale
sudo tailscale up
```

#### Paso 2: Autenticarse

Aparecerá un enlace como:
```
To authenticate, visit:
  https://login.tailscale.com/a/abc123def456
```

1. Copia el enlace y ábrelo en un navegador
2. Selecciona **"Join [tu-nombre]'s tailnet"**
3. Confirma la conexión

#### Paso 3: Renombrar el Dispositivo

En el panel web de Tailscale:
1. Ve a **Machines**
2. Busca tu servidor (ej: `ubuntu-vm`)
3. Haz clic en los 3 puntos → **Rename**
4. Cámbialo a: `server-alexander` (o el nombre que prefieras)

#### Paso 4: Obtener la IP de Tailscale

```bash
# Ver tu IP de Tailscale
tailscale ip -4

# Ejemplo de salida:
# 100.112.81.15
```

**¡IMPORTANTE!** Anota esta IP, la usarás para conectar clientes.

#### Paso 5: Configurar Firewall Automáticamente

El script de instalación del servidor ya hace esto automáticamente:

```bash
cd /ruta/a/UniNet/backend
sudo ./install.sh
```

El script detectará Tailscale y configurará:
- ✅ Permitir tráfico en `tailscale0`
- ✅ Permitir puerto `4000/tcp` (FastAPI)
- ✅ Permitir puerto `389/tcp` (LDAP)

**Verificación manual (opcional):**
```bash
sudo ufw status verbose
```

---

## 💻 Agregar Clientes Windows/Linux a la Red

### Para PCs de Estudiantes (Windows)

#### Opción 1: Instalación GUI (Recomendado para pocos PCs)

1. Descarga: https://tailscale.com/download/windows
2. Ejecuta el instalador en cada PC
3. Inicia sesión con **la cuenta del administrador** (Alex)

#### Opción 2: Instalación Masiva con PowerShell (Para muchos PCs)

```powershell
# En cada PC (Requiere Admin)
winget install tailscale.tailscale --silent

# Configurar con Auth Key (ver abajo)
tailscale up --authkey=tskey-auth-XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Para PCs de Estudiantes (Linux Desktop)

```bash
# Instalar Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Opción A: Autenticarse manualmente
sudo tailscale up

# Opción B: Usar Auth Key
sudo tailscale up --authkey=tskey-auth-XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### ⚙️ Crear Auth Keys (Para instalación masiva)

**Ventaja:** No necesitas autenticarte en cada PC manualmente.

1. Ve a: https://login.tailscale.com/admin/settings/keys
2. Haz clic en **"Generate auth key"**
3. Configura:
   - ✅ **Reusable** (para usar en múltiples PCs)
   - ✅ **Ephemeral** OFF (para mantener las PCs permanentemente)
   - ✅ **Preauthorized** (agregar automáticamente sin aprobación)
4. Copia la clave generada: `tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX`

**Uso:**
```bash
sudo tailscale up --authkey=tskey-auth-kXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🤝 Agregar Desarrolladores al Equipo

Si Roy y Patrick quieren desarrollar en sus propias VMs Ubuntu:

### Paso 1: Alex Invita a Roy y Patrick

1. Ve a: https://login.tailscale.com/admin/settings/users
2. Haz clic en **"Invite user"**
3. Ingresa el correo de Roy (ej: `roy@gmail.com`)
4. Selecciona rol: **Admin** (para gestión completa) o **Member** (solo ver)
5. Enviar invitación

### Paso 2: Roy Acepta la Invitación

1. Roy recibe un correo con el enlace de invitación
2. Hace clic en "Aceptar invitación"
3. Crea su cuenta de Tailscale vinculada al correo invitado

### Paso 3: Roy Instala Tailscale en su VM Ubuntu

```bash
# En la VM de Roy
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**IMPORTANTE:** Cuando se abra el enlace de autenticación, Roy debe:
- ❌ NO hacer clic en "Log in with GitHub" arriba
- ✅ Hacer clic en **"Join [Alex]'s tailnet"** abajo

### Paso 4: Roy Obtiene su IP de Tailscale

```bash
tailscale ip -4
# Ejemplo: 100.96.133.34
```

### Paso 5: Roy Configura su Entorno de Desarrollo

En su Windows, edita `.env.local` del frontend:

```env
VITE_API_URL=http://100.96.133.34:4000
```

**¡Listo!** Roy trabaja independientemente sin afectar el servidor de Alex.

---

## 🔍 Verificación y Troubleshooting

### Verificar Conexión de Tailscale

```bash
# Ver estado de Tailscale
tailscale status

# Ver tu IP
tailscale ip -4

# Verificar conectividad con otros dispositivos
tailscale ping 100.112.81.15
```

### Verificar que el Backend esté Accesible

Desde cualquier PC conectado a Tailscale:

```bash
# Verificar health check
curl http://100.112.81.15:4000/health

# Verificar status
curl http://100.112.81.15:4000/status
```

### Problemas Comunes

#### 1. "No puedo conectar al servidor desde el cliente"

**Causa:** Firewall bloqueando el tráfico.

**Solución:**
```bash
# En el servidor Ubuntu
sudo ufw allow in on tailscale0
sudo ufw allow 4000/tcp
sudo ufw reload
```

#### 2. "El servidor de Roy/Patrick no aparece en la red"

**Causa:** Se autenticó con su propia cuenta en lugar de unirse a la red de Alex.

**Solución:**
```bash
# En la VM de Roy
sudo tailscale down
sudo tailscale logout
sudo tailscale up

# Abrir el enlace y seleccionar "Join Alex's tailnet"
```

#### 3. "Mi IP de Tailscale cambió"

**Respuesta:** Las IPs de Tailscale (`100.x.x.x`) son **permanentes** mientras el dispositivo esté en la red. Si cambió, significa que eliminaste y volviste a agregar el dispositivo.

#### 4. "Tailscale no inicia automáticamente"

```bash
# Habilitar inicio automático
sudo systemctl enable tailscaled
sudo systemctl start tailscaled
```

#### 5. "Quiero eliminar ZeroTier primero"

```bash
# Desinstalar ZeroTier en Ubuntu
sudo systemctl stop zerotier-one
sudo apt-get remove --purge zerotier-one
sudo rm -rf /var/lib/zerotier-one
```

En Windows:
1. Panel de Control → Programas → Desinstalar ZeroTier

---

## 🛠️ Comandos Útiles

### En el Servidor Ubuntu

```bash
# Ver IP de Tailscale
tailscale ip -4

# Ver estado de la conexión
tailscale status

# Ver todos los dispositivos en la red
tailscale status | grep "100\."

# Reiniciar Tailscale
sudo systemctl restart tailscaled

# Ver logs de Tailscale
sudo journalctl -u tailscaled -f

# Verificar que UFW permite Tailscale
sudo ufw status verbose | grep tailscale0

# Verificar que el backend está corriendo
curl http://localhost:4000/status
curl http://$(tailscale ip -4):4000/status
```

### En PCs Cliente

**Windows (PowerShell):**
```powershell
# Ver IP de Tailscale
tailscale status --self

# Hacer ping al servidor
tailscale ping 100.112.81.15

# Verificar conectividad HTTP
curl http://100.112.81.15:4000/status
```

**Linux:**
```bash
# Ver IP de Tailscale
tailscale ip -4

# Hacer ping al servidor
tailscale ping 100.112.81.15

# Verificar conectividad HTTP
curl http://100.112.81.15:4000/status
```

### Panel Web de Administración

- **Ver todos los dispositivos:** https://login.tailscale.com/admin/machines
- **Gestionar usuarios:** https://login.tailscale.com/admin/settings/users
- **Crear Auth Keys:** https://login.tailscale.com/admin/settings/keys
- **Ver ACLs (permisos):** https://login.tailscale.com/admin/acls

---

## 📦 Instalación del Agente de Monitoreo en Clientes

Una vez que los PCs estén conectados a Tailscale:

### Instalación Automática desde el Servidor

```bash
# En un PC cliente Linux
SERVER_IP=100.112.81.15 CARRERA=5010 curl -sSL http://100.112.81.15:4000/install | sudo -E bash
```

**Variables:**
- `SERVER_IP`: La IP de Tailscale de tu servidor (obtenida con `tailscale ip -4`)
- `CARRERA`: Código de la carrera (5001-5012)

**Códigos de Carrera:**
- 5001 → Administración y Negocios Internacionales
- 5002 → Contabilidad y Finanzas
- 5003 → Derecho y Ciencias Políticas
- 5004 → Ecoturismo
- 5005 → Educación Inicial y Especial
- 5006 → Educación Matemáticas y Computación
- 5007 → Educación Primaria e Informática
- 5008 → Enfermería
- 5009 → Ingeniería Agroindustrial
- 5010 → Ingeniería de Sistemas e Informática
- 5011 → Ingeniería Forestal y Medio Ambiente
- 5012 → Medicina Veterinaria y Zootecnia

---

## 🎯 Flujo de Trabajo para Desarrollo en Equipo

### Escenario: Alex, Roy y Patrick trabajan simultáneamente

1. **Alex** trabaja con su servidor: `100.112.81.15`
2. **Roy** trabaja con su servidor: `100.96.133.34`
3. **Patrick** trabaja con su servidor: `100.120.50.30`

Cada uno en su Windows edita `.env.local`:

**Alex:**
```env
VITE_API_URL=http://100.112.81.15:4000
```

**Roy:**
```env
VITE_API_URL=http://100.96.133.34:4000
```

**Patrick:**
```env
VITE_API_URL=http://100.120.50.30:4000
```

**Resultado:**
- ✅ Cada uno ve su propia instancia del backend
- ✅ No hay conflictos entre desarrolladores
- ✅ Pueden trabajar sin internet (Tailscale funciona en LAN también)
- ✅ Pueden SSH entre servidores para ayudarse

---

## 🔐 Seguridad y Permisos

### Access Control Lists (ACLs)

Por defecto, **todos los dispositivos pueden comunicarse entre sí**. Si quieres restringir el acceso:

1. Ve a: https://login.tailscale.com/admin/acls
2. Edita las reglas en formato JSON

**Ejemplo: Solo permitir a los clientes conectarse al servidor:**

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:client"],
      "dst": ["tag:server:4000,389"]
    }
  ],
  "tagOwners": {
    "tag:server": ["4l3x4nd3r-s@github"],
    "tag:client": ["4l3x4nd3r-s@github"]
  }
}
```

### Deshabilitar Key Expiry (Recomendado para servidores)

Por defecto, los dispositivos se desconectan cada 180 días. Para evitarlo:

1. Ve a **Machines**
2. Haz clic en los 3 puntos del servidor
3. Selecciona **"Disable key expiry"**

---

## 📞 Soporte

- **Documentación oficial:** https://tailscale.com/kb/
- **Status de Tailscale:** https://status.tailscale.com/
- **Foro de la comunidad:** https://forum.tailscale.com/

---

## ✅ Checklist de Configuración

### Para el Administrador (Alex)

- [ ] Cuenta de Tailscale creada
- [ ] Tailscale instalado en PC Windows
- [ ] Servidor Ubuntu conectado a Tailscale
- [ ] IP de Tailscale del servidor anotada (`tailscale ip -4`)
- [ ] Firewall configurado (`ufw allow in on tailscale0`)
- [ ] Backend corriendo y accesible

### Para Desarrolladores (Roy, Patrick)

- [ ] Invitación recibida y aceptada
- [ ] Tailscale instalado en VM Ubuntu
- [ ] Autenticado en la red de Alex ("Join tailnet")
- [ ] IP de Tailscale obtenida
- [ ] `.env.local` del frontend configurado con su IP
- [ ] Backend corriendo en su VM

### Para PCs de Laboratorio (Clientes)

- [ ] Tailscale instalado (GUI o Auth Key)
- [ ] Conectado a la red de Alex
- [ ] Agente de monitoreo instalado (`curl | sudo bash`)
- [ ] Carrera correctamente asignada
- [ ] Heartbeat enviándose cada 30 segundos
- [ ] PC visible en el dashboard del frontend

---

**¡Listo! Tu red de UniNet está configurada con Tailscale.**
