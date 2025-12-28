# 🚀 Guía de Inicio Rápido para el Servidor

> **Para el Administrador del Servidor**: Cómo preparar el servidor para que los clientes se conecten

---

## 📋 Antes de la Presentación

### 1. Obtener la IP del Servidor en ZeroTier

En tu VM Ubuntu (servidor), ejecuta:

```bash
ip addr show | grep zt
```

Busca la línea que muestra la IP de ZeroTier, por ejemplo:
```
inet 172.29.137.160/16 brd 172.29.255.255 scope global zt...
```

En este caso, tu IP es: **172.29.137.160**

---

### 2. Iniciar el Servidor Backend

```bash
cd ~/UniNet/backend
./start-server.sh
```

Verifica que esté corriendo:
```bash
curl http://localhost:4000/health
```

Debe responder: `{"status":"ok"}`

---

### 3. Iniciar el Frontend

Abre otra terminal:

```bash
cd ~/UniNet/frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

### 4. Compartir el Comando de Instalación

Comparte este comando con tus compañeros (reemplaza la IP):

```bash
curl -sSL http://172.29.137.160:4000/install | sudo bash
```

---

## 🎬 Durante la Presentación

### Secuencia Recomendada:

1. **Mostrar el servidor corriendo:**
   ```bash
   cd ~/UniNet/backend
   ./check-server.sh
   ```

2. **Abrir el dashboard** en tu navegador Windows:
   ```
   http://IP_SERVIDOR_ZEROTIER:5173
   ```

3. **Mostrar dashboard vacío** o con mensaje "Esperando conexiones..."

4. **Los compañeros ejecutan el comando** en sus VMs

5. **Las PCs aparecen automáticamente** en el dashboard como "online" 🟢

6. **Compañeros hacen login** → cambian a "inUse" 🔵 con nombre de usuario

---

## 🔍 Monitorear las Conexiones

### Ver todas las PCs registradas:

```bash
curl http://localhost:4000/api/status | jq
```

### Ver estadísticas:

```bash
curl http://localhost:4000/api/stats | jq
```

Respuesta ejemplo:
```json
{
  "total": 4,
  "online": 2,
  "inUse": 1,
  "offline": 1
}
```

---

## 📊 Endpoints Útiles

### Estado de todas las PCs:
```bash
curl http://localhost:4000/api/status
```

### Lista de hosts registrados:
```bash
curl http://localhost:4000/api/hosts
```

### Health check del servidor:
```bash
curl http://localhost:4000/health
```

### Servir script de instalación:
```bash
curl http://localhost:4000/install
```

### Servir agente:
```bash
curl http://localhost:4000/agent
```

---

## 🆘 Troubleshooting

### El servidor no inicia:

1. **Verificar puerto ocupado:**
   ```bash
   sudo fuser -k 4000/tcp
   ```

2. **Ver logs:**
   ```bash
   tail -f ~/UniNet/backend/logs/api.log
   ```

### Los clientes no aparecen:

1. **Verificar que el endpoint de heartbeat funciona:**
   ```bash
   curl -X POST http://localhost:4000/api/heartbeat \
     -H "Content-Type: application/json" \
     -d '{"hostname":"test","ip":"1.2.3.4","user":"testuser"}'
   ```

2. **Ver estado actual:**
   ```bash
   curl http://localhost:4000/api/status
   ```

### No puedo acceder desde mi Windows:

1. **Verificar que ZeroTier esté activo en Windows**

2. **Verificar conectividad:**
   ```bash
   # Desde Windows PowerShell
   curl http://172.29.137.160:4000/health
   ```

3. **Verificar firewall en el servidor:**
   ```bash
   sudo ufw status
   sudo ufw allow 4000/tcp
   sudo ufw allow 5173/tcp
   ```

---

## 🎯 Checklist Pre-Presentación

- [ ] Servidor backend corriendo (`./start-server.sh`)
- [ ] Frontend corriendo (`npm run dev`)
- [ ] Puedes acceder al dashboard desde tu Windows
- [ ] Health check responde correctamente
- [ ] IP de ZeroTier anotada y compartida
- [ ] Comando de instalación listo para compartir
- [ ] Compañeros tienen sus VMs Ubuntu listas
- [ ] Todos están en la misma red ZeroTier

---

## 📝 Notas Importantes

### Auto-registro Dinámico:

- ✅ No necesitas configurar IPs de antemano
- ✅ Las PCs se registran automáticamente al enviar su primer heartbeat
- ✅ Se les asigna un ID secuencial (pc-01, pc-02, pc-03, etc.)
- ✅ El sistema detecta automáticamente usuarios logueados

### Timeouts:

- **Heartbeat**: Cada 30 segundos
- **Timeout**: 60 segundos sin heartbeat = offline
- **Auto-reconexión**: Si una PC se desconecta y vuelve, se detecta automáticamente

### Límites de ZeroTier:

- Plan gratuito: 25 dispositivos por red (actualizado, antes era 10)
- Tu caso: Servidor + 3-4 VMs + laptops = ~10 dispositivos (OK)

---

**¡Éxito con la presentación! 🎉**
