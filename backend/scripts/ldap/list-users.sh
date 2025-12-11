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
ldapsearch -x -b "ou=users,$LDAP_BASE" "(objectClass=posixAccount)" uid cn mail 2>/dev/null | \
awk '
BEGIN { RS=""; FS="\n"; OFS="|" }
/^dn:/ {
    dn=""; uid=""; cn=""; mail="";
    for (i=1; i<=NF; i++) {
        if ($i ~ /^dn:/) { sub(/^dn: /, "", $i); dn=$i }
        if ($i ~ /^uid:/) { sub(/^uid: /, "", $i); uid=$i }
        if ($i ~ /^cn:/) { sub(/^cn: /, "", $i); cn=$i }
        if ($i ~ /^mail:/) { sub(/^mail: /, "", $i); mail=$i }
    }
    if (uid != "") print uid, cn, mail, dn
}
'

exit 0
