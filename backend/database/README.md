# 🔧 Sistema de Persistencia de UniNet

## 📋 Problema Resuelto

**Problema anterior**: Las máquinas clientes desaparecían cuando se reiniciaba el servidor porque todo se almacenaba en memoria RAM (diccionarios de Python).

**Solución implementada**: Sistema de persistencia con SQLite para mantener los datos entre reinicios.

## 🗄️ Base de Datos SQLite

Ubicación: `backend/database/uninet.db`

### Tablas creadas:

1. **`clients`** - Almacena todas las máquinas registradas
   - hostname (PK)
   - id (pc-01, pc-02, etc.)
   - ip
   - user (usuario actualmente logueado)
   - carrera (GID de la carrera)
   - last_seen (última conexión)
   - first_seen (primera conexión)

2. **`network_rules`** - Reglas de bloqueo de internet por carrera
   - gid_carrera (PK)
   - accion (bloquear/desbloquear)
   - updated_at

3. **`logs`** - Historial de eventos del sistema
   - id (PK)
   - timestamp
   - level (INFO/WARN/ERROR)
   - category (SYSTEM/NETWORK/AUTH)
   - message
   - carrera
   - hostname

## ✨ Características

### Persistencia Automática
- Las máquinas se guardan automáticamente cuando envían heartbeat
- Las reglas de red se guardan cuando el profesor las modifica
- Los logs se almacenan permanentemente

### Caché en Memoria
- Los datos se cargan de la BD a memoria al iniciar el servidor
- Las consultas son rápidas (memoria RAM)
- Cada cambio se guarda inmediatamente en la BD

### Estado Correcto de Máquinas
- **Online**: Máquina conectada sin usuario (heartbeat < 15s)
- **In Use**: Máquina conectada con usuario activo
- **Offline**: Máquina registrada pero sin heartbeat reciente

**Ahora las máquinas NUNCA desaparecen**, simplemente cambian a estado "offline" cuando se apagan.

## 🔄 Flujo de Funcionamiento

1. **Arranque del servidor** (`api/main.py`)
   ```python
   @app.on_event("startup")
   async def startup_event():
       db.init_database()      # Crea las tablas si no existen
       monitoring.init_cache()  # Carga datos de BD a memoria
   ```

2. **Cliente envía heartbeat** (`api/monitoring.py`)
   - Se actualiza en memoria: `clients_state[hostname]`
   - Se guarda en BD: `db.save_client(hostname, data)`

3. **Profesor cambia regla de red**
   - Se actualiza en memoria: `network_rules[gid]`
   - Se guarda en BD: `db.save_network_rule(gid, accion)`

4. **Evento del sistema**
   - Se genera log: `add_log(...)`
   - Se guarda en BD: `db.save_log(entry)`

## 📊 Ventajas del Sistema

### Antes (Solo RAM)
❌ Máquinas desaparecen al reiniciar
❌ Logs se pierden
❌ Reglas de red no persisten
❌ No hay historial

### Ahora (SQLite + Caché)
✅ Máquinas persisten entre reinicios
✅ Logs almacenados permanentemente
✅ Reglas de red se mantienen
✅ Historial completo del sistema
✅ Rendimiento optimizado (caché)

## 🛠️ Mantenimiento

### Limpiar logs antiguos
```python
from database import db
deleted = db.clean_old_logs(days=30)  # Borra logs > 30 días
```

### Verificar base de datos
```bash
cd backend/database
sqlite3 uninet.db
.tables           # Ver tablas
SELECT * FROM clients;  # Ver máquinas
SELECT * FROM logs ORDER BY created_at DESC LIMIT 10;  # Últimos logs
.quit
```

### Backup
```bash
cp backend/database/uninet.db backend/database/uninet_backup_$(date +%Y%m%d).db
```

## 🚀 Producción

En producción, considera:
- Hacer backups periódicos de `uninet.db`
- Limpiar logs antiguos con cron job
- Monitorear tamaño de la BD

```bash
# Cron job para limpiar logs (cada semana)
0 0 * * 0 python3 -c "from database import db; db.clean_old_logs(30)"
```

## 📝 Notas Técnicas

- SQLite es una BD embebida (no requiere servidor)
- Thread-safe por defecto
- Ligera y rápida para este caso de uso
- La BD se crea automáticamente en el primer arranque
- El archivo `.gitignore` evita subir la BD al repositorio
