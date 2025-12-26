#!/bin/bash
# ============================================================
# Script: init-carreras.sh
# Descripción: Crea las carreras oficiales basadas en el Frontend
# GID Inicial: 5000
# ============================================================

LDAP_BASE="dc=uninet,dc=com"
LDAP_ADMIN="cn=admin,$LDAP_BASE"

# Cargar contraseña
if [ -f /etc/uninet/ldap_admin_pass ]; then
    ADMIN_PASS=$(cat /etc/uninet/ldap_admin_pass)
else
    read -sp "Password LDAP Admin: " ADMIN_PASS
    echo ""
fi

# ------------------------------------------------------------
# LISTA OFICIAL DE CARRERAS (Según tus imágenes)
# ------------------------------------------------------------
CARRERAS=(
    "Ingeniería de Sistemas e Informática"
    "Ingeniería Agroindustrial"
    "Ingeniería Forestal y Medio Ambiente"
    "Educación Matemáticas y Computación"
    "Contabilidad y Finanzas"
    "Administración y Negocios Internacionales"
    "Derecho y Ciencias Políticas"
    "Enfermería"
    "Medicina Veterinaria y Zootecnia"
    "Educación Inicial y Especial"
    "Educación Primaria e Informática"
    "Ecoturismo"
)

# GID inicial solicitado
CURRENT_GID=5000

echo "🚀 Iniciando creación de carreras en LDAP..."

for NOMBRE_CARRERA in "${CARRERAS[@]}"; do
    
    # 1. Verificar si ya existe para no duplicar
    EXISTE=$(ldapsearch -x -LLL -b "ou=groups,$LDAP_BASE" "(cn=$NOMBRE_CARRERA)" gidNumber 2>/dev/null)

    if [ ! -z "$EXISTE" ]; then
        echo "✅ Ya existe: $NOMBRE_CARRERA"
        # Si existe, no incrementamos el contador para mantener el orden, 
        # o podrías buscar el siguiente libre. Por ahora solo saltamos.
    else
        # 2. Crear LDIF temporal
        TEMP_LDIF=$(mktemp)
        cat > "$TEMP_LDIF" << EOF
dn: cn=$NOMBRE_CARRERA,ou=groups,$LDAP_BASE
objectClass: top
objectClass: posixGroup
cn: $NOMBRE_CARRERA
gidNumber: $CURRENT_GID
description: Grupo oficial para la carrera $NOMBRE_CARRERA
EOF

        # 3. Insertar en LDAP
        ldapadd -x -D "$LDAP_ADMIN" -w "$ADMIN_PASS" -f "$TEMP_LDIF" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✨ Creado: $NOMBRE_CARRERA (GID: $CURRENT_GID)"
        else
            echo "❌ Error creando: $NOMBRE_CARRERA"
        fi
        rm "$TEMP_LDIF"
    fi

    # Incrementar GID para la siguiente carrera (5000 -> 5001 -> 5002...)
    CURRENT_GID=$((CURRENT_GID + 1))
done

echo "🏁 Inicialización de carreras completada."