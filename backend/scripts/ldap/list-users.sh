#!/bin/bash
#
# UniNet - Script para listar usuarios LDAP
# Salida: username|codigo|nombres|apellido_paterno|apellido_materno|dni|carrera|email|dn
#
# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero" >&2
    exit 1
fi
source /etc/uninet/ldap.conf

# Verificar que LDAP_BASE está definido
if [ -z "$LDAP_BASE" ]; then
    echo "Error: LDAP_BASE no está definido en /etc/uninet/ldap.conf" >&2
    exit 1
fi

# Determinar URI de LDAP (por defecto localhost)
LDAP_URI=${LDAP_URI:-ldap://localhost:389}

# Buscar todos los usuarios con timeout de 8 segundos
timeout 8 ldapsearch -x -H "$LDAP_URI" -LLL -b "ou=users,$LDAP_BASE" "(objectClass=posixAccount)" \
    uid employeeNumber givenName sn cn description departmentNumber mail dn 2>&1 | \
awk '
BEGIN { OFS="|" }
/^dn:/ { dn=$2; for(i=3;i<=NF;i++) dn=dn" "$i }
/^uid:/ { uid=$2 }
/^employeeNumber:/ { codigo=$2 }
/^cn:/ { cn=$2; for(i=3;i<=NF;i++) cn=cn" "$i }
/^givenName:/ { nombres=$2; for(i=3;i<=NF;i++) nombres=nombres" "$i }
/^sn:/ { apellido_p=$2; for(i=3;i<=NF;i++) apellido_p=apellido_p" "$i }
/^description:/ {
    desc=$0
    sub(/^description: */, "", desc)
    if (desc ~ /DNI: *[0-9]+/) {
        split(desc, parts, "DNI: *")
        if (length(parts) > 1) {
            match(parts[2], /[0-9]+/)
            dni = substr(parts[2], RSTART, RLENGTH)
        }
    }
}
/^departmentNumber:/ { carrera=$2 }
/^mail:/ { mail=$2 }
/^$/ {
    if (uid != "") {
        # Fallback: usar cn si no hay nombres/apellido_p
        if (!nombres && cn) nombres = cn
        if (!apellido_p && cn) apellido_p = cn
        # Extraer apellido_materno del cn
        apellido_m = cn
        sub(nombres " ", "", apellido_m)
        sub(apellido_p " ", "", apellido_m)
        sub(apellido_p, "", apellido_m)
        gsub(/^ +| +$/, "", apellido_m)
        # Generar email por defecto si no existe
        if (!mail) mail = uid"@universidad.edu.pe"
        print uid, (codigo?codigo:"N/A"), (nombres?nombres:"N/A"), (apellido_p?apellido_p:"N/A"), apellido_m, (dni?dni:"N/A"), (carrera?carrera:"N/A"), mail, dn
        uid=""; codigo=""; cn=""; nombres=""; apellido_p=""; dni=""; carrera=""; mail=""; dn=""
    }
}
END {
    if (uid != "") {
        if (!nombres && cn) nombres = cn
        if (!apellido_p && cn) apellido_p = cn
        apellido_m = cn
        sub(nombres " ", "", apellido_m)
        sub(apellido_p " ", "", apellido_m)
        sub(apellido_p, "", apellido_m)
        gsub(/^ +| +$/, "", apellido_m)
        if (!mail) mail = uid"@universidad.edu.pe"
        print uid, (codigo?codigo:"N/A"), (nombres?nombres:"N/A"), (apellido_p?apellido_p:"N/A"), apellido_m, (dni?dni:"N/A"), (carrera?carrera:"N/A"), mail, dn
    }
}
'
exit 0
