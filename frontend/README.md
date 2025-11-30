# 🖥️ UniNet Admin - Dashboard Frontend

**Sistema Centralizado de Gestión de Laboratorios de Cómputo**

Dashboard web para monitorear y controlar PCs Ubuntu en tiempo real.

---

## ⚙️ Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

### Node.js v18+ y npm v9+

**Verificar si ya lo tienes:**
```bash
node -v    # Debe mostrar v18.0.0 o superior
npm -v     # Debe mostrar v9.0.0 o superior
```

**Si no lo tienes, instalar Node.js:**

- **Windows:** Descarga desde https://nodejs.org/ (versión LTS)
- **Linux/Ubuntu:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
- **macOS:**
```bash
brew install node
```

---

## 🚀 Instalación y Ejecución

### Paso 1: Clonar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd UniNet/frontend/mockup/uninet-dashboard
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Esto instalará React, TypeScript, Vite, Tailwind CSS y todas las dependencias necesarias.
Puede tardar 1-2 minutos.

### Paso 3: Ejecutar el proyecto

```bash
npm run dev
```

**Salida esperada:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Paso 4: Abrir en el navegador

Abre tu navegador en: **http://localhost:5173/**

**Deberías ver:**
- ✅ Dashboard con sidebar negro
- ✅ Grid de 12 PCs simuladas
- ✅ 4 secciones: Dashboard, Usuarios, Red & Firewall, Logs

---

## 📜 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza el build de producción |

---

## 🐛 Solución de Problemas

### Error: `npm install` falla

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Error: Puerto 5173 ocupado

El puerto está en uso por otro proceso. Cierra otras aplicaciones que puedan estar usando Vite.

### Error: `Cannot find module '@/...'`

Reinicia el servidor:
```bash
# Presiona Ctrl+C para detener
npm run dev
```

---

## 📝 Notas

- **Los datos son simulados**: Este es un prototipo con datos de prueba
- **Backend no incluido**: Este es solo el frontend

---

**Equipo:** ROY (Dashboard) | PATRICK (Cliente) | ALEX (Servidor)
**Proyecto:** UniNet Admin - UNAMAD
**Fecha:** 29 nov 2025
