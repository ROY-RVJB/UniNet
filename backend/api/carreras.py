import subprocess
import base64 # <--- ¡IMPORTANTE! Necesario para traducir los nombres raros
from fastapi import APIRouter, HTTPException
from typing import List, Dict

router = APIRouter()

# --- TU DICCIONARIO DE ICONOS Y COLORES ---
UI_METADATA = {
    "Ingeniería de Sistemas e Informática": {"icon": "Monitor", "faculty": "ingenieria"},
    "Ingeniería Agroindustrial": {"icon": "Factory", "faculty": "ingenieria"},
    "Ingeniería Forestal y Medio Ambiente": {"icon": "TreePine", "faculty": "ingenieria"},
    "Educación Matemáticas y Computación": {"icon": "Calculator", "faculty": "ciencias"},
    "Contabilidad y Finanzas": {"icon": "Receipt", "faculty": "ciencias"},
    "Administración y Negocios Internacionales": {"icon": "Briefcase", "faculty": "ciencias"},
    "Derecho y Ciencias Políticas": {"icon": "Scale", "faculty": "ciencias"},
    "Enfermería": {"icon": "Heart", "faculty": "salud"},
    "Medicina Veterinaria y Zootecnia": {"icon": "Stethoscope", "faculty": "salud"},
    "Educación Inicial y Especial": {"icon": "Baby", "faculty": "artes"},
    "Educación Primaria e Informática": {"icon": "GraduationCap", "faculty": "artes"},
    "Ecoturismo": {"icon": "Mountain", "faculty": "artes"},
}

def decode_ldap_value(linea: str) -> str:
    """
    TRADUCTOR MÁGICO:
    Si LDAP devuelve 'cn:: SW5n...' (con dos puntos), lo desencripta.
    Si devuelve 'cn: Sistemas' (un punto), lo deja igual.
    """
    try:
        if ":: " in linea:
            # Es Base64 (Tiene tildes o ñ)
            encoded = linea.split(":: ", 1)[1].strip()
            return base64.b64decode(encoded).decode('utf-8')
        elif ": " in linea:
            # Es texto normal
            return linea.split(": ", 1)[1].strip()
        return ""
    except Exception:
        return ""

def obtener_conteo_usuarios(gid: str) -> int:
    """Cuenta usuarios reales en LDAP"""
    try:
        cmd = f"ldapsearch -x -LLL -b 'ou=users,dc=uninet,dc=com' '(gidNumber={gid})' dn | grep 'dn:' | wc -l"
        result = subprocess.check_output(cmd, shell=True)
        return int(result.strip())
    except:
        return 0

@router.get("/listar")
def listar_carreras_reales():
    carreras_list = []
    
    # Buscamos grupos con GID >= 5000
    ldap_filter = "(&(objectClass=posixGroup)(gidNumber>=5000))"
    cmd = ["ldapsearch", "-x", "-LLL", "-b", "ou=groups,dc=uninet,dc=com", ldap_filter, "cn", "gidNumber"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        raw_output = result.stdout
        
        # Separamos por bloques (cada carrera es un bloque)
        bloques = raw_output.split("\n\n")
        
        for bloque in bloques:
            if not bloque.strip(): continue
            
            nombre = ""
            gid = ""
            
            for linea in bloque.splitlines():
                if linea.startswith("cn"):
                    nombre = decode_ldap_value(linea) # <--- Aquí ocurre la magia
                elif linea.startswith("gidNumber"):
                    gid = decode_ldap_value(linea)
            
            if nombre and gid:
                # 1. FILTRO DE LIMPIEZA: Ocultamos los grupos de prueba viejos
                if nombre.lower() in ["sistemas", "administracion", "users"]:
                    continue

                # 2. Asignar iconos y colores
                # Como 'nombre' ya está traducido (ej: "Ingeniería..."), ahora sí coincidirá con el diccionario
                meta = UI_METADATA.get(nombre, {"icon": "Folder", "faculty": "general"})
                
                total_usuarios = obtener_conteo_usuarios(gid)
                
                carreras_list.append({
                    "id": f"carrera-{gid}",
                    "name": nombre, # Ahora enviamos el nombre bonito con tildes
                    "gid": int(gid),
                    "faculty": meta["faculty"], # Recupera el color correcto
                    "icon": meta["icon"],       # Recupera el icono correcto
                    "pcsCount": 0,
                    "usersCount": total_usuarios,
                    "status": "online"
                })
                
        carreras_list.sort(key=lambda x: x['gid'])
        return carreras_list

    except Exception as e:
        print(f"Error consultando LDAP: {e}")
        raise HTTPException(status_code=500, detail="Error interno")