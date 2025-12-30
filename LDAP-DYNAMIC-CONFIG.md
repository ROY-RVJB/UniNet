# 🔐 Configuración LDAP Dinámica para Clientes

## 🎯 Problema Resuelto

Anteriormente, el script de instalación del cliente tenía **valores hardcodeados**:
```bash
LDAP_BASE_DN="dc=uninet,dc=com"          # ❌ Hardcodeado
LDAP_BIND_DN="cn=admin,dc=uninet,dc=com" # ❌ Hardcodeado
LDAP_BIND_PW="admin123"                   # ❌ Hardcodeado
```

Esto causaba problemas cuando:
- Otra persona/empresa usaba el proyecto con su propio dominio
- La contraseña de LDAP era diferente
- Se necesitaba flexibilidad en la configuración

---

## ✅ Solución Implementada

Ahora el cliente **descarga automáticamente** la configuración LDAP del servidor durante la instalación.

### Flujo de Trabajo

```
┌─────────────────────────────────────┐
│   SERVIDOR (Backend)                │
│   • /etc/uninet/ldap.conf           │
│   • /etc/uninet/ldap_admin_pass     │
└─────────────┬───────────────────────┘
              │
              │ GET /ldap-config
              ▼
┌─────────────────────────────────────┐
│   API Endpoint                      │
│   • Lee configuración del servidor  │
│   • Devuelve JSON con valores       │
└─────────────┬───────────────────────┘
              │
              │ JSON Response
              ▼
┌─────────────────────────────────────┐
│   CLIENTE (Ubuntu)                  │
│   • curl http://IP:4000/ldap-config │
│   • Parsea valores automáticamente  │
│   • Configura NSLCD y PAM           │
└─────────────────────────────────────┘
```

---

## 🔧 Configuración del Servidor

### 1. Configurar LDAP en el Servidor

Si aún no has configurado LDAP:

```bash
cd backend/scripts/ldap
sudo bash setup.sh
```

Esto te preguntará:
- **Dominio base**: `miempresa.com` (o el que quieras)
- **Organización**: `Mi Empresa Lab`
- **Contraseña admin**: Tu contraseña segura

Crea automáticamente:
- `/etc/uninet/ldap.conf` - Configuración
- `/etc/uninet/ldap_admin_pass` - Contraseña (permisos 600)

---

### 2. Verificar Configuración

Antes de instalar clientes, verifica que todo esté correcto:

```bash
cd backend/scripts/ldap
sudo bash verify-client-config.sh
```

Salida esperada:
```
============================================
  UniNet - Verificación de Config LDAP
============================================

🔍 Servidor detectado: 100.112.81.15

📋 Verificando archivos de configuración locales:

✅ /etc/uninet/ldap.conf existe
LDAP_URI=ldap://localhost:389
LDAP_BASE=dc=miempresa,dc=com
LDAP_ADMIN=cn=admin,dc=miempresa,dc=com
...

✅ /etc/uninet/ldap_admin_pass existe

============================================

🌐 Probando endpoint /ldap-config:

✅ Endpoint funcionando correctamente

📦 Configuración que recibirán los clientes:
{
  "ldap_uri": "ldap://100.112.81.15",
  "ldap_base": "dc=miempresa,dc=com",
  "ldap_admin": "cn=admin,dc=miempresa,dc=com",
  "ldap_admin_pass": "tu_contraseña",
  "ldap_groups_base": "ou=groups,dc=miempresa,dc=com"
}
```

---

## 📦 Instalación de Clientes

Ahora los clientes se instalan con **UN SOLO COMANDO**:

```bash
curl -sSL http://IP-DEL-SERVIDOR:4000/install | sudo bash
```

El script automáticamente:
1. ✅ Descarga la configuración LDAP del servidor
2. ✅ Parsea los valores JSON
3. ✅ Configura NSLCD con los valores correctos
4. ✅ Configura PAM para autenticación

**No necesitas editar nada manualmente** 🎉

---

## 🛠️ Endpoint de la API

### `GET /ldap-config`

Devuelve la configuración LDAP del servidor en formato JSON.

**Respuesta exitosa:**
```json
{
  "ldap_uri": "ldap://100.112.81.15",
  "ldap_base": "dc=miempresa,dc=com",
  "ldap_admin": "cn=admin,dc=miempresa,dc=com",
  "ldap_admin_pass": "contraseña_segura",
  "ldap_groups_base": "ou=groups,dc=miempresa,dc=com"
}
```

**Respuesta de error (LDAP no configurado):**
```json
{
  "error": "LDAP not configured",
  "message": "Run backend/scripts/ldap/setup.sh first"
}
```

---

## 🔄 Fallback Automático

Si el servidor no tiene LDAP configurado, el cliente usa valores por defecto:

```bash
⚠️  No se pudo obtener configuración LDAP del servidor
⚠️  Usando configuración por defecto

💡 Para configurar LDAP en el servidor, ejecuta:
   cd backend/scripts/ldap && sudo bash setup.sh
```

---

## 🧪 Casos de Uso

### Caso 1: Universidad con dominio `unaj.edu.pe`

**Servidor:**
```bash
sudo bash setup.sh
# Dominio: unaj.edu.pe
# Base DN: dc=unaj,dc=edu,dc=pe
# Contraseña: unaj_secure_2025
```

**Clientes:**
```bash
curl -sSL http://100.112.81.15:4000/install | sudo bash
# ✅ Configurados automáticamente con dc=unaj,dc=edu,dc=pe
```

---

### Caso 2: Empresa con dominio `techcorp.com`

**Servidor:**
```bash
sudo bash setup.sh
# Dominio: techcorp.com
# Base DN: dc=techcorp,dc=com
# Contraseña: corp_admin_pass
```

**Clientes:**
```bash
curl -sSL http://192.168.1.100:4000/install | sudo bash
# ✅ Configurados automáticamente con dc=techcorp,dc=com
```

---

## 🔐 Seguridad

### Archivo de Contraseña

- **Ubicación**: `/etc/uninet/ldap_admin_pass`
- **Permisos**: `600` (solo root puede leer)
- **Propietario**: `root:root`
- **Contenido**: Contraseña en texto plano (necesaria para bind LDAP)

### Transmisión

⚠️ **Nota de Seguridad**: La contraseña se transmite en HTTP (texto plano).

**Para producción**, considera:
1. Usar HTTPS (SSL/TLS)
2. VPN entre servidor y clientes (como Tailscale)
3. Autenticación del endpoint

---

## 📋 Archivos Involucrados

| Archivo | Descripción |
|---------|-------------|
| `backend/api/main.py` | Endpoint `/ldap-config` |
| `backend/scripts/ldap/setup.sh` | Configura LDAP y guarda contraseña |
| `backend/scripts/ldap/verify-client-config.sh` | Verifica configuración |
| `backend/scripts/client/install-client.sh` | Descarga config automáticamente |

---

## 🐛 Troubleshooting

### El cliente dice "No se pudo obtener configuración"

1. Verifica que el servidor tenga LDAP configurado:
```bash
ls -la /etc/uninet/ldap.conf
ls -la /etc/uninet/ldap_admin_pass
```

2. Verifica que el endpoint funcione:
```bash
curl http://IP-SERVIDOR:4000/ldap-config
```

3. Si falta el archivo, créalo:
```bash
cd backend/scripts/ldap
sudo bash check-admin-pass.sh
```

---

### Los clientes usan valores antiguos hardcodeados

Reinstala el cliente con el script actualizado:
```bash
curl -sSL http://IP-SERVIDOR:4000/install | sudo bash
```

El script detecta instalación existente y actualiza la configuración.

---

## 🎉 Beneficios

✅ **Centralizado** - Configuración en un solo lugar (servidor)  
✅ **Flexible** - Funciona con cualquier dominio/contraseña  
✅ **Automático** - Los clientes se configuran solos  
✅ **Mantenible** - Cambios en el servidor se propagan automáticamente  
✅ **Escalable** - Instalar 100 clientes es tan fácil como 1  

---

**Fecha de implementación**: Diciembre 2025  
**Versión**: 2.1 - Configuración LDAP Dinámica
