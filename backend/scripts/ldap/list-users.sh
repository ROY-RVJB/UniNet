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

# Buscar todos los usuarios con todos los atributos
ldapsearch -x -LLL -b "ou=users,$LDAP_BASE" "(objectClass=inetOrgPerson)" \
    uid employeeNumber givenName sn cn description departmentNumber mail dn 2>/dev/null | \
awk '
BEGIN { OFS="|" }
/^dn:/ { dn=$2; for(i=3;i<=NF;i++) dn=dn" "$i }
/^uid:/ { uid=$2 }
/^employeeNumber:/ { codigo=$2 }
/^givenName:/ { nombres=$2; for(i=3;i<=NF;i++) nombres=nombres" "$i }
/^sn:/ { apellido_p=$2; for(i=3;i<=NF;i++) apellido_p=apellido_p" "$i }
/^description:/ { 
    desc=$0
    sub(/^description: */, "", desc)
    if (match(desc, /DNI: *([0-9]+)/, arr)) {
        dni=arr[1]
    }
}
/^departmentNumber:/ { carrera=$2 }
/^mail:/ { mail=$2 }
/^$/ { 
    if (uid != "") {
        # Extraer apellido materno del cn si es necesario
        # Por ahora, usamos solo apellido_p como apellido completo
        print uid, (codigo?codigo:""), (nombres?nombres:""), (apellido_p?apellido_p:""), "", (dni?dni:""), (carrera?carrera:""), (mail?mail:""), dn
        uid=""; codigo=""; nombres=""; apellido_p=""; dni=""; carrera=""; mail=""; dn=""
    }
}
END {
    if (uid != "") {
        print uid, (codigo?codigo:""), (nombres?nombres:""), (apellido_p?apellido_p:""), "", (dni?dni:""), (carrera?carrera:""), (mail?mail:""), dn
    }
}
'

exit 0
