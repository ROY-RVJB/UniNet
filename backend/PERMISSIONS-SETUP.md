# Configuración de Permisos para UniNet Backend

## Problema Resuelto
El script `create-user.sh` se bloqueaba esperando la contraseña de sudo al usar `sudo tee`, causando timeouts de 30+ segundos en la creación de usuarios.

## Solución
Cambiar la propiedad de los archivos críticos al usuario `vm2` (usuario que ejecuta el backend) para que pueda escribir directamente sin sudo.

## Pasos de Configuración

### Configuración Automatizada (Recomendado) ✨

Ejecuta el script automatizado que configura todo por ti:

```bash
cd /path/to/backend/scripts
sudo bash setup-permissions.sh
```

El script:
- ✅ **Detecta automáticamente** el usuario que ejecutó sudo (no hardcoded)
- ✅ Crea el directorio `/etc/uninet` si no existe
- ✅ Solicita la contraseña del admin LDAP (solo si no existe el archivo)
- ✅ Configura permisos correctos automáticamente
- ✅ **Busca el último UID en LDAP** para evitar conflictos
- ✅ Inicializa el contador con el último UID encontrado (o 10000 si no hay usuarios)
- ✅ Verifica que todo esté correcto
- ✅ Muestra un resumen al final

**Si quieres especificar un usuario diferente:**
```bash
sudo bash setup-permissions.sh nombre_usuario
```

### Verificación Manual (Opcional)

Si quieres verificar manualmente que los permisos estén correctos:

```bash
ls -la /etc/uninet/
```

Deberías ver que los archivos pertenecen al usuario que ejecutó sudo:
```
-rw------- 1 tu_usuario tu_usuario <tamaño> <fecha> ldap_admin_pass
-rw-r--r-- 1 tu_usuario tu_usuario <tamaño> <fecha> last_uid
```

## Detección Inteligente de UID

El script tiene **doble protección** contra conflictos de UID:

### 1. En setup-permissions.sh:
- Busca el último UID en LDAP al inicializar
- Si encuentra usuarios, usa ese UID como base
- Si no hay usuarios, inicia en 10000

### 2. En create-user.sh:
- Si el archivo `last_uid` no existe al crear usuario, busca en LDAP
- Siempre incrementa el último UID encontrado
- **Nunca asigna un UID existente**

## Cambios en el Código

### Antes (con sudo tee - BLOQUEABA):
```bash
echo "$UID_NUMBER" | sudo tee "$UID_FILE" > /dev/null
```

### Después (redirección directa - INSTANTÁNEO):
```bash
echo "$UID_NUMBER" > "$UID_FILE"
```

## Resultado
- ✅ Tiempo de creación: **< 0.1 segundos** (antes: 30+ segundos timeout)
- ✅ No requiere interacción con sudo
- ✅ El backend puede ejecutar el script sin bloqueos
- ✅ Frontend recibe respuesta inmediata

## Nuevos Campos en la Creación de Usuario

El script ahora acepta **9 parámetros** en lugar de 4:

```bash
./create-user.sh <username> <codigo> <nombres> <apellido_paterno> <apellido_materno> <dni> <password> <carrera> [email]
```

### Atributos LDAP Agregados:
- `employeeNumber`: Código de estudiante (ej: 20210001)
- `departmentNumber`: Código de carrera (5001-5012)
- `description`: DNI del estudiante
- `givenName`: Nombre(s) del estudiante
- `sn`: Apellido paterno
- `cn`: Nombre completo (nombres + apellido paterno + apellido materno)

## Códigos de Carreras (5001-5012)

| Código | Carrera Profesional |
|--------|---------------------|
| 5001   | Ingeniería de Sistemas |
| 5002   | Ingeniería Civil |
| 5003   | Derecho |tu usuario sea el propietario:
```bash
ls -la /etc/uninet/last_uid
# Si no eres el owner, ejecuta:
sudo chown $USER:$USER /etc/uninet/last_uid
```

### Error: "LDAP admin password not found"
**Solución**: Verificar que el archivo existe y tiene permisos correctos:
```bash
sudo ls -la /etc/uninet/ldap_admin_pass
# Si no existe, ejecutar setup-permissions.sh de nuevo
sudo bash setup-permissions.sh
## Troubleshooting

### Error: "Permission denied" al escribir en /etc/uninet/last_uid
**Solución**: Verificar que vm2 sea el propietario:
```bash
sudo chown vm2:vm2 /etc/uninet/last_uid
```

### Error: "LDAP admin password not found"
**Solución**: Verificar que el archivo existe y tiene permisos correctos:
```bash
sudo ls -la /etc/uninet/ldap_admin_pass
sudo chown vm2:vm2 /etc/uninet/ldap_admin_pass
sudo chmod 600 /etc/uninet/ldap_admin_pass
```

### Error: "Timeout al crear usuario"
**Solución**: Verificar que no hay `sudo tee` en el script:
```bash
grep "sudo tee" /path/to/create-user.sh
# No debería devolver resultados
```

## Validación Completa

1. Ejecutar script de permisos:
```bash
cd /path/to/backend/scripts
sudo bash setup-permissions.sh
```

2. Probar creación manual:
```bash
cd /path/to/backend/scripts/ldap
./create-user.sh juan.perez 20210001 Juan Pérez García 12345678 mipassword 5001 juan.perez@universidad.edu.pe
```

3. Verificar en LDAP:
```bash
ldapsearch -x -LLL -b "ou=users,dc=uninet,dc=com" "(uid=juan.perez)"
```

4. Probar desde frontend:
   - Llenar formulario de creación de usuario
   - Verificar que la respuesta sea inmediata (< 1 segundo)
   - Verificar que el usuario aparezca en la tabla

## Notas de Seguridad

- El archivo `ldap_admin_pass` tiene permisos **600** (solo lectura para vm2)
- Solo el usuario vm2 puede leer la contraseña del admin LDAP
- El archivo `last_uid` tiene permisos **644** (lectura para todos, escritura solo para vm2)
- Nunca commitear contraseñas al repositorio git

## Créditos
Solución desarrollada por tu colega del proyecto UniNet.
