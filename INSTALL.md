# UniNet Dashboard - Instalación y Uso

Sistema de monitoreo en tiempo real para laboratorios de cómputo con Ubuntu.

---

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Tu PC Windows (Desarrollo)                    │
│  ├─ Frontend React (npm run dev)               │
│  └─ http://localhost:5173                      │
└───────────────┬─────────────────────────────────┘
                │ fetch cada 5s
                ↓
┌─────────────────────────────────────────────────┐
│  Servidor Ubuntu (172.29.137.160)              │
│  ├─ Backend Python (Flask)                     │
│  ├─ Puerto 4000                                │
│  └─ Hace ping a las 3 PCs cliente              │
└─────────────────────────────────────────────────┘
                │
                ↓ ping via ZeroTier
┌─────────────────────────────────────────────────┐
│  3 PCs Cliente Ubuntu (red ZeroTier)           │
│  ├─ PC-LAB-01: 172.29.2.37                     │
│  ├─ PC-LAB-02: 172.29.157.94                   │
│  └─ PC-LAB-03: 172.29.177.20                   │
└─────────────────────────────────────────────────┘
```

---

## 🖥️ Parte 1: Configurar Clientes Ubuntu (Opcional pero Recomendado)

Antes de configurar el servidor, puedes preparar los clientes para que sean detectados automáticamente.

### Script de Auto-configuración para Clientes

En cada PC cliente Ubuntu (172.29.2.37, 172.29.157.94, 172.29.177.20):

```bash
# Clonar el repositorio
cd ~
git clone https://github.com/ROY-RVJB/UniNet.git
cd UniNet/backend

# Dar permisos y ejecutar
chmod +x client-setup.sh
sudo ./client-setup.sh
```

El script automáticamente:
- ✅ Configura SSH
- ✅ Configura firewall (UFW)
- ✅ Crea identificación del cliente
- ✅ Activa servicio de heartbeat

**Nota:** Ver `backend/CLIENT-SETUP.md` para más detalles.

---

## 🖥️ Parte 2: Configurar el Servidor Ubuntu (172.29.137.160)

### Método Recomendado: Instalación usando Git

Conéctate a tu servidor Ubuntu (físicamente o por SSH):

```bash
ssh usuario@172.29.137.160
```

#### Paso 1: Instalar Git (si no lo tienes)

```bash
sudo apt update
sudo apt install git -y
```

#### Paso 2: Clonar el repositorio

```bash
cd ~
git clone https://github.com/ROY-RVJB/UniNet.git
```

#### Paso 3: Ejecutar el script de instalación

```bash
# Entrar al proyecto
cd UniNetls

# Entrar a la carpeta del backend
cd backend

# Dar permisos de ejecución al script
chmod +x install.sh

# Ejecutar el instalador
sudo ./install.sh
```

El script automáticamente:
- ✅ Instala Python 3 y pip
- ✅ Instala Flask y dependencias
- ✅ Crea un servicio systemd (`uninet-status`)
- ✅ Abre el puerto 4000 en el firewall (UFW)
- ✅ Inicia el servidor automáticamente

#### Paso 4: Verificar que el servidor esté corriendo

```bash
# Ver estado del servicio
sudo systemctl status uninet-status

# Ver logs en tiempo real
sudo journalctl -u uninet-status -f
```

**Prueba desde el servidor:**
```bash
curl http://localhost:4000/status
# Debe retornar JSON con el estado de las 4 máquinas
```

**Prueba desde tu PC Windows:**
```powershell
# En PowerShell
curl http://172.29.137.160:4000/status

# O abre en el navegador:
# http://172.29.137.160:4000/status
```

---

## 💻 Parte 3: Ejecutar el Frontend en Windows

### Paso 1: Clonar el repositorio (si aún no lo has hecho)

```powershell
# En PowerShell
cd ~\Documents
git clone https://github.com/ROY-RVJB/UniNet.git
cd UniNet\frontend
```

### Paso 2: Instalar dependencias (solo la primera vez)

```powershell
npm install
```

### Paso 3: Iniciar el servidor de desarrollo

```powershell
npm run dev
```

### Paso 4: Abrir en el navegador

Abre la URL que muestra Vite (normalmente `http://localhost:5173`)

El dashboard automáticamente:
- 🔄 Consulta `http://172.29.137.160:4000/status` cada 5 segundos
- 🟢 Muestra "online" (verde) si el ping es exitoso
- 🔴 Muestra "offline" (rojo) si no hay respuesta

---

## 🛠️ Comandos Útiles

### En el Servidor Ubuntu:

```bash
# Ver logs en tiempo real
sudo journalctl -u uninet-status -f

# Reiniciar el servicio
sudo systemctl restart uninet-status

# Detener el servicio
sudo systemctl stop uninet-status

# Iniciar el servicio
sudo systemctl start uninet-status

# Ver estado del servicio
sudo systemctl status uninet-status

# Editar lista de hosts monitoreados
sudo nano /opt/uninet-status-server/status_server.py
# Luego reinicia: sudo systemctl restart uninet-status
```

### En Windows (desarrollo):

```powershell
# Iniciar frontend
npm run dev

# Compilar para producción
npm run build

# Vista previa de la compilación
npm run preview
```

---

## 🔄 Actualizar el Código (Pull desde Git)

### En el servidor Ubuntu:

```bash
cd ~/UniNet
git pull origin main

# Si hay cambios en el backend, reinstala
cd backend
sudo ./install.sh
```

### En Windows:

```powershell
cd ~\Documents\UniNet
git pull origin main

# Si hay cambios en dependencias
cd frontend
npm install
```

---

## 🔧 Solución de Problemas

### ❌ "El frontend no muestra el estado de las PCs"

**Verifica:**

1. ¿El servidor Python está corriendo?
   ```bash
   sudo systemctl status uninet-status
   ```

2. ¿El puerto 4000 está abierto en el firewall?
   ```bash
   sudo ufw status
   # Debe aparecer: 4000/tcp ALLOW Anywhere
   ```

3. ¿Tu PC Windows puede alcanzar el servidor?
   ```powershell
   curl http://172.29.137.160:4000/health
   # Debe retornar: {"status":"ok","timestamp":"..."}
   ```

4. ¿Las PCs cliente están en la red ZeroTier?
   ```bash
   # Desde el servidor
   ping -c 2 172.29.2.37
   ping -c 2 172.29.157.94
   ping -c 2 172.29.177.20
   ```

### ❌ "CORS error" en la consola del navegador

El servidor Python ya tiene CORS habilitado. Si ves este error:
```bash
# Reinicia el servicio
sudo systemctl restart uninet-status
```

### ❌ "No se puede conectar al servidor desde Windows"

Verifica que tu PC Windows esté en la misma red ZeroTier:

```powershell
# En Windows, verifica la ruta
ping 172.29.137.160
# Si no responde, no estás en la red ZeroTier
```

### ❌ "Error al ejecutar install.sh"

Asegúrate de tener permisos y estar en la carpeta correcta:

```bash
cd ~/UniNet/backend
ls -la
# Debe aparecer: install.sh, status_server.py, requirements.txt

chmod +x install.sh
sudo ./install.sh
```

---

## 📦 Despliegue a Producción (Próximo paso)

Para que Nginx sirva el frontend compilado:

### 1. Compilar el frontend en Windows:

```powershell
cd frontend\mockup\uninet-dashboard
npm run build
# Genera carpeta dist/
```

### 2. Copiar al servidor:

```powershell
scp -r dist/* usuario@172.29.137.160:/var/www/html/uninet/
```

### 3. Configurar Nginx (en el servidor Ubuntu):

```bash
sudo nano /etc/nginx/sites-available/uninet
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name 172.29.137.160;
    root /var/www/html/uninet;
    index index.html;

    # Servir frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend Python
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar y reiniciar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/uninet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎯 Resumen Rápido

| **Acción** | **Dónde** | **Comando** |
|------------|-----------|-------------|
| Clonar repositorio | Ubuntu/Windows | `git clone https://github.com/ROY-RVJB/UniNet.git` |
| Instalar backend | Ubuntu Server | `cd ~/UniNet/backend && sudo ./install.sh` |
| Ver logs del backend | Ubuntu Server | `sudo journalctl -u uninet-status -f` |
| Instalar frontend | Windows | `cd frontend\mockup\uninet-dashboard && npm install` |
| Iniciar frontend (dev) | Windows | `npm run dev` |
| Ver dashboard | Windows (navegador) | `http://localhost:5173` |
| API de estado | Navegador/curl | `http://172.29.137.160:4000/status` |
| Actualizar código | Ubuntu/Windows | `git pull origin main` |

---

## 📁 Estructura del Proyecto

```
UniNet/
├── backend/                   # Backend Python (servidor)
│   ├── status_server.py       # Servidor Flask
│   ├── requirements.txt       # Dependencias Python
│   └── install.sh            # Script de instalación
│
├── frontend/                  # Frontend React
│   ├── src/                  # Código fuente React
│   ├── package.json          # Dependencias Node.js
│   └── vite.config.ts        # Configuración Vite
│
├── INSTALL.md                # Este archivo
└── README.md                 # Documentación del proyecto
```

---

## 📞 Soporte

Si tienes dudas:
- Revisa los logs: `sudo journalctl -u uninet-status -f`
- Verifica la conectividad ZeroTier
- Asegúrate de que el firewall permita el puerto 4000
- Usa `git pull` para mantener el código actualizado

---

**¡Listo! 🚀 Tu dashboard debería estar funcionando.**
