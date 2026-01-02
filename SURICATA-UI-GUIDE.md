# 🛡️ Guía Visual: Sistema de Alertas de Suricata

## 📋 ¿Cómo funciona el sistema de alertas?

### 1. **Detección Automática (Suricata IDS)**
```
┌─────────────────────────────────┐
│  PC Cliente (Estudiante)        │
│  ┌──────────────────────────┐   │
│  │  Suricata IDS            │   │
│  │  - Monitorea tráfico     │   │
│  │  - Detecta amenazas      │   │
│  │  - Genera alertas        │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 2. **¿Qué significa "Revisadas"?**

Las alertas tienen **2 estados**:

#### 🔴 **Alertas Activas** (No revisadas)
- Son alertas **nuevas** que Suricata acaba de detectar
- **REQUIEREN atención del administrador**
- Se muestran en la parte superior con fondo de color
- Tienen un botón: **"Marcar como Revisada"**

#### ✅ **Alertas Revisadas** (Acknowledged)
- Son alertas que **ya fueron vistas y atendidas** por el administrador
- Se marcan desde la **interfaz web** (dashboard)
- Se muestran en la parte inferior con menor opacidad
- Tienen un check verde ✓

---

## 🖥️ Visualización Mejorada

### Antes (confuso):
```
PC-LAB-03 • 172.29.137.103 → 172.29.137.160 • TCP
```
❌ **Problema:** No está claro qué significa cada elemento
❌ **Falta información crítica:** ¿De qué carrera? ¿Qué estudiante?

### Después (intuitivo):
```
┌────────────────────────────────────────────┐
│ 🟣 Carrera: Ingeniería de Sistemas (5001)  │
│ 🟡 Estudiante: juan.perez                  │
│                                            │
│ 🖥️ PC: [PC-LAB-03]                         │
│                                            │
│ 📡 Flujo de Red:                           │
│  172.29.137.103 ──→ 172.29.137.160        │
│  (PC estudiante)    (Servidor)    TCP     │
└────────────────────────────────────────────┘
```
✅ **Mejora:** Cada elemento tiene un label claro y visual
✅ **Información completa:** Carrera + Estudiante + PC + Red

---

## 🎨 Elementos Visuales del Nuevo Diseño

### 1. **Sección de Alertas Activas**
```
🔴 ALERTAS ACTIVAS (2)
├─ Alerta 1: Escaneo de Puertos
│  ├─ 💀 CRÍTICA
│  ├─ � Carrera: Ingeniería de Sistemas (5001)
│  ├─ 🟡 Estudiante: juan.perez
│  ├─ 🖥️ PC: PC-LAB-03
│  ├─ 📡 172.29.137.103 → 172.29.137.160 | TCP
│  └─ [👁️ Marcar como Revisada] ← ACCIÓN
│
└─ Alerta 2: Brute Force SSH
   ├─ ⚠️ ALTA
   ├─ 🟣 Carrera: Ingeniería Civil (5003)
   ├─ 🟡 Estudiante: maria.gomez
   ├─ 🖥️ PC: PC-LAB-07
   ├─ 📡 172.29.137.107 → 172.29.137.160 | TCP:22
   └─ [👁️ Marcar como Revisada] ← ACCIÓN
```

### 2. **Sección de Alertas Revisadas**
```
✅ REVISADAS (3)
├─ Alerta 3: Tráfico Sospechoso ✓
├─ Alerta 4: Violación de Política ✓
└─ Alerta 5: Actividad Inusual ✓
```

---

## 🔄 Flujo de Trabajo del Administrador

### Paso 1: **Detectar**
```
Suricata detecta tráfico sospechoso
        ↓
Alerta aparece en dashboard (🔴 ACTIVA)
```

### Paso 2: **Revisar**
```
Administrador ve la alerta en el dashboard
        ↓
Lee la información COMPLETA:
  - ¿De qué CARRERA es la PC? → Ingeniería de Sistemas
  - ¿Qué ESTUDIANTE estaba usando la PC? → juan.perez
  - ¿Qué PC generó el problema? → PC-LAB-03
  - ¿Qué tipo de ataque fue? → Escaneo de puertos
  - ¿Hacia dónde iba el tráfico? → Servidor (172.29.137.160)
```

### Paso 3: **Actuar**
```
Administrador toma acción:
  - Contacta al estudiante (juan.perez)
  - Notifica al docente de la carrera
  - Investiga la PC-LAB-03
  - Bloquea al usuario si es necesario
  - Aplica reglas de firewall
  - O determina que es un falso positivo
```

### Paso 4: **Marcar como Revisada**
```
Administrador hace clic en:
[👁️ Marcar como Revisada]
        ↓
La alerta se mueve a la sección "Revisadas" (✅)
```

---

## ❓ Preguntas Frecuentes

### ¿Se resuelven las alertas automáticamente?
**No.** Las alertas se marcan como **revisadas** manualmente desde la interfaz web por el administrador.

### ¿Qué significa "resolver" una alerta?
Significa que el administrador:
1. **Vio** la alerta
2. **Entendió** qué pasó
3. **Tomó acción** (si era necesaria)
4. **Marcó como revisada** para que no aparezca como pendiente

### ¿Puedo probar con una sola VM?
**Sí!** Puedes simular todo con una sola VM cliente:

```bash
# En la VM cliente (estudiante)
# Simular un escaneo de puertos
nmap -sS 172.29.137.160

# Suricata lo detectará
# La alerta aparecerá en el dashboard
# Tú la revisarás desde la web
# Y la marcarás como revisada
```

---

## 🧪 Plan de Pruebas con 1 VM

### Configuración Mínima:
```
┌─────────────────────┐      ┌─────────────────────┐
│  Tu PC (Windows)    │      │  VM Ubuntu Cliente  │
│  - Dashboard Web    │◄────►│  - Suricata IDS     │
│  - Navegador        │      │  - Agente UniNet    │
└─────────────────────┘      └─────────────────────┘
         │                            │
         └────────────────────────────┘
              Red ZeroTier/Tailscale
```

### Escenario de Prueba:

1. **Instala Suricata** en la VM cliente
2. **Genera tráfico sospechoso** desde la VM:
   ```bash
   # Escaneo de puertos (detectado por Suricata)
   nmap -sS 172.29.137.160
   
   # Intento de SSH repetido (brute force)
   hydra -l admin -P passwords.txt ssh://172.29.137.160
   ```
3. **Verifica en el dashboard web:**
   - Aparece alerta en "Alertas Activas"
   - Ves la info: PC origen, IPs, protocolo
4. **Marca como revisada:**
   - Haces clic en el botón
   - La alerta se mueve a "Revisadas"

### ¿Funciona con más VMs?
**Sí!** El sistema escala automáticamente:
- 1 VM = 1 PC monitoreada
- 10 VMs = 10 PCs monitoreadas
- 50 VMs = 50 PCs monitoreadas

Cada PC genera sus propias alertas y las envía al servidor central.

---

## 📊 Niveles de Severidad (Visual)

```
💀 CRÍTICA     → Rojo    → Ataque activo, requiere acción inmediata
⚠️  ALTA       → Naranja → Amenaza seria, investigar pronto
⚠️  MEDIA      → Amarillo → Sospechoso, revisar cuando puedas
ℹ️  BAJA       → Azul    → Informativo, baja prioridad
ℹ️  INFO       → Gris    → Solo información, no es amenaza
```

---

## 🚀 Próximos Pasos

Cuando digas **"hazlo funcional"**, implementaré:

1. **Backend:** Endpoint para recibir alertas de Suricata
2. **Agente:** Script que lee `/var/log/suricata/eve.json` y envía al backend
3. **WebSocket:** Alertas en tiempo real sin recargar página
4. **Base de datos:** Almacenar historial de alertas
5. **Filtros:** Por severidad, fecha, PC, etc.

---

**¿Listo para probarlo visualmente en el dashboard?** 🎯
