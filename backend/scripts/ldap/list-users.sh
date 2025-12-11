#!/bin/bash
#
# UniNet - Script para listar usuarios LDAP
# Salida: username|full_name|email|dn
#

# Cargar configuración
if [ ! -f /etc/uninet/ldap.conf ]; then
    echo "Error: LDAP no configurado. Ejecuta setup.sh primero" >&2
    exit 1
fi

source /etc/uninet/ldap.conf

# Buscar todos los usuarios
ldapsearch -x -LLL -b "ou=users,$LDAP_BASE" "(objectClass=inetOrgPerson)" uid cn mail dn 2>/dev/null | \
awk '
BEGIN { OFS="|" }
/^dn:/ { dn=$2; for(i=3;i<=NF;i++) dn=dn" "$i }
/^uid:/ { uid=$2 }
/^cn:/ { cn=$2; for(i=3;i<=NF;i++) cn=cn" "$i }
/^mail:/ { mail=$2 }
/^$/ { 
    if (uid != "") {
        print uid, cn, mail, dn
        uid=""; cn=""; mail=""; dn=""
    }
}
END {
    if (uid != "") print uid, cn, mail, dn
}
'

exit 0
