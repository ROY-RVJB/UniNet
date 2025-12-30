#!/bin/bash
#
# UniNet - Script para inicializar grupos de carreras en LDAP
# Crea los 12 grupos (5001-5012) si no existen
#

if [ "$EUID" -ne 0 ]; then 
    echo "Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero"
    exit 1
fi

source /etc/uninet/ldap.conf

# Leer contraseña de admin
ADMIN_PASS=""
if [ -f /etc/uninet/ldap_admin_pass ]; then
    ADMIN_PASS=$(cat /etc/uninet/ldap_admin_pass)
else
    read -sp "Contraseña del administrador LDAP: " ADMIN_PASS
    echo ""
fi

echo "=== Inicializando Carreras en LDAP ==="
echo ""

# Definir las 12 carreras
declare -A CARRERAS=(
    ["5001"]="Administración de Empresas"
    ["5002"]="Contabilidad y Finanzas"
    ["5003"]="Derecho y Ciencias Políticas"
    ["5004"]="Ecoturismo"
    ["5005"]="Educación Inicial y Especial"
    ["5006"]="Educación Matemáticas y Computación"
    ["5007"]="Educación Primaria e Informática"
    ["5008"]="Enfermería"
    ["5009"]="Ingeniería Agroindustrial"
    ["5010"]="Ingeniería de Sistemas e Informática"
    ["5011"]="Ingeniería Forestal y Medio Ambiente"
    ["5012"]="Medicina Veterinaria y Zootecnia"
)

CREATED=0
EXISTS=0
FAILED=0

for GID in "${!CARRERAS[@]}"; do
    CN="${CARRERAS[$GID]}"
    
    # Verificar si ya existe
    if timeout 3 ldapsearch -x -H "$LDAP_URI" -b "cn=$CN,$LDAP_GROUPS_BASE" -LLL -s base "(objectClass=*)" dn &>/dev/null; then
        echo "⏭️  $GID - $CN (ya existe)"
        ((EXISTS++))
        continue
    fi
    
    # Crear archivo LDIF temporal
    LDIF_FILE="/tmp/carrera_${GID}.ldif"
    cat > "$LDIF_FILE" << EOF
dn: cn=$CN,$LDAP_GROUPS_BASE
objectClass: posixGroup
objectClass: top
cn: $CN
gidNumber: $GID
description: Carrera $CN (GID $GID)
EOF
    
    # Agregar al LDAP
    if ldapadd -x -H "$LDAP_URI" -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -f "$LDIF_FILE" &>/dev/null; then
        echo "✅ $GID - $CN"
        ((CREATED++))
    else
        echo "❌ $GID - $CN (error al crear)"
        ((FAILED++))
    fi
    
    rm -f "$LDIF_FILE"
done

# Crear grupo especial para Docentes (GID 6000)
echo ""
echo "=== Grupo Especial ==="
if timeout 3 ldapsearch -x -H "$LDAP_URI" -b "cn=Docentes,$LDAP_GROUPS_BASE" -LLL -s base "(objectClass=*)" dn &>/dev/null; then
    echo "⏭️  6000 - Docentes (ya existe)"
else
    LDIF_FILE="/tmp/docentes.ldif"
    cat > "$LDIF_FILE" << EOF
dn: cn=Docentes,$LDAP_GROUPS_BASE
objectClass: posixGroup
objectClass: top
cn: Docentes
gidNumber: 6000
description: Grupo de Docentes
EOF
    
    if ldapadd -x -H "$LDAP_URI" -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -f "$LDIF_FILE" &>/dev/null; then
        echo "✅ 6000 - Docentes"
        ((CREATED++))
    else
        echo "❌ 6000 - Docentes (error al crear)"
        ((FAILED++))
    fi
    
    rm -f "$LDIF_FILE"
fi

echo ""
echo "=== Resumen ==="
echo "✅ Creados: $CREATED"
echo "⏭️  Ya existían: $EXISTS"
if [ $FAILED -gt 0 ]; then
    echo "❌ Fallidos: $FAILED"
fi

echo ""
echo "=== Verificación ==="
GROUP_COUNT=$(timeout 3 ldapsearch -x -H "$LDAP_URI" -b "$LDAP_GROUPS_BASE" -LLL "(objectClass=posixGroup)" cn 2>/dev/null | grep -c "^cn:")
echo "Total de grupos en LDAP: $GROUP_COUNT"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "✅ Todas las carreras están listas"
    exit 0
else
    echo ""
    echo "⚠️  Algunos grupos no se pudieron crear"
    exit 1
fi
