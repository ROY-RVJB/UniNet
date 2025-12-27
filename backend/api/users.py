"""
Endpoints para gestión de usuarios LDAP
Permite crear, listar, modificar y eliminar usuarios
+ (nuevo) Listar usuarios con sus carreras (grupos LDAP)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import subprocess
import os

router = APIRouter()

# Rutas a los scripts LDAP
SCRIPT_DIR = os.path.join(os.path.dirname(__file__), "..", "scripts", "ldap")


class UserCreate(BaseModel):
    """Modelo para creación de usuario"""
    username: str = Field(..., min_length=3, max_length=20, pattern="^[a-z0-9.]+$")
    password: str = Field(..., min_length=6)
    # Nuevos campos del frontend
    codigo: str = Field(..., min_length=8)  # Código de estudiante
    nombres: str = Field(..., min_length=2)  # Nombre(s)
    apellido_paterno: str = Field(..., min_length=2)  # Apellido paterno
    apellido_materno: str = Field(..., min_length=2)  # Apellido materno
    dni: str = Field(..., min_length=8, max_length=8, pattern="^[0-9]{8}$")  # DNI (8 dígitos)
    carrera: str = Field(..., pattern="^50(0[1-9]|1[0-2])$")  # Carrera (5001-5012)


class UserResponse(BaseModel):
    """Modelo de respuesta de usuario con todos los campos"""
    username: str
    codigo: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str
    dni: str
    carrera: str
    email: str | None = None
    dn: str


# ==========================
# NUEVO: Usuario con carreras
# ==========================
class UserWithCarreras(UserResponse):
    carreras: list[str] = []


class UserDelete(BaseModel):
    """Modelo para eliminación de usuario"""
    username: str


# ==========================
# NUEVO: Helpers LDAP
# ==========================

def _read_ldap_conf(path: str = "/etc/uninet/ldap.conf") -> dict:
    """
    Lee ldap.conf (KEY=VALUE) y retorna dict.
    """
    conf: dict[str, str] = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                conf[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return conf


def _try_read_admin_pass(path: str = "/etc/uninet/ldap_admin_pass") -> str:
    """
    Lee la contraseña admin guardada (opcional).
    No revienta si no existe o no hay permisos: retorna "".
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""


def _ldap_groups_for_user(username: str) -> list[str]:
    """
    NUEVO: Retorna grupos (cn) donde memberUid=username.
    1) Intenta bind anónimo (suele funcionar si LDAP permite lectura).
    2) Si falla, intenta con LDAP_ADMIN + pass si existe.
    """
    if not username:
        return []

    conf = _read_ldap_conf()

    ldap_uri = conf.get("LDAP_URI", "ldap://localhost:389")
    ldap_base = conf.get("LDAP_BASE", "")
    groups_base = conf.get("LDAP_GROUPS_BASE") or (f"ou=groups,{ldap_base}" if ldap_base else "")

    if not groups_base:
        return []

    # 1) intento anónimo
    cmd_anon = [
        "ldapsearch", "-x", "-H", ldap_uri,
        "-LLL", "-b", groups_base,
        f"(memberUid={username})", "cn"
    ]

    try:
        r = subprocess.run(cmd_anon, capture_output=True, text=True, timeout=5)
        if r.returncode == 0:
            return _parse_cn_from_ldapsearch(r.stdout)
    except Exception:
        pass

    # 2) intento autenticado si hay credenciales disponibles
    admin_dn = conf.get("LDAP_ADMIN", "")
    admin_pass = conf.get("LDAP_ADMIN_PASSWORD", "") or _try_read_admin_pass()

    if not admin_dn or not admin_pass:
        return []

    cmd_auth = [
        "ldapsearch", "-x", "-H", ldap_uri,
        "-LLL", "-D", admin_dn, "-w", admin_pass,
        "-b", groups_base,
        f"(memberUid={username})", "cn"
    ]

    try:
        r2 = subprocess.run(cmd_auth, capture_output=True, text=True, timeout=5)
        if r2.returncode == 0:
            return _parse_cn_from_ldapsearch(r2.stdout)
    except Exception:
        pass

    return []


def _parse_cn_from_ldapsearch(stdout: str) -> list[str]:
    grupos: list[str] = []
    for line in stdout.splitlines():
        line = line.strip()
        if line.lower().startswith("cn:"):
            grupos.append(line.split(":", 1)[1].strip())
    return grupos


@router.options("/create")
async def create_user_options():
    """Manejo explícito de CORS preflight para /create"""
    return {"message": "OK"}


@router.post("/create", response_model=dict)
async def create_user(user_data: UserCreate):
    """
    Crea un nuevo usuario en LDAP con los datos completos del estudiante
    """
    script_path = os.path.join(SCRIPT_DIR, "create-user.sh")

    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Script de creación no encontrado: {script_path}")

    try:
        # Generar email automáticamente basado en username
        email = f"{user_data.username}@universidad.edu.pe"
        
        # Preparar entorno con contraseña de admin LDAP
        env = os.environ.copy()
        env['LDAP_ADMIN_PASSWORD'] = 'admin123'  # TODO: Mover a variable de entorno o config
        
        # Nuevo orden de parámetros: username codigo nombres apellido_paterno apellido_materno dni password carrera email
        result = subprocess.run(
            [
                "bash", script_path,
                user_data.username,
                user_data.codigo,
                user_data.nombres,
                user_data.apellido_paterno,
                user_data.apellido_materno,
                user_data.dni,
                user_data.password,
                user_data.carrera,
                email
            ],
            capture_output=True,
            text=True,
            timeout=30,
            env=env
        )

        if result.returncode == 0:
            return {"success": True, "message": f"Usuario {user_data.username} creado exitosamente", "username": user_data.username}

        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {result.stderr}")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al crear usuario")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/list", response_model=List[UserResponse])
async def list_users(carrera: Optional[str] = None):
    """
    Lista usuarios LDAP, opcionalmente filtrados por carrera
    
    Query param: ?carrera=5001 (solo muestra usuarios de esa carrera)
    
    **Códigos de Carrera (departmentNumber en LDAP):**
    - 5001: Administración y Negocios Internacionales
    - 5002: Contabilidad y Finanzas
    - 5003: Derecho y Ciencias Políticas
    - 5004: Ecoturismo
    - 5005: Educación Inicial y Especial
    - 5006: Educación Matemáticas y Computación
    - 5007: Educación Primaria e Informática
    - 5008: Enfermería
    - 5009: Ingeniería Agroindustrial
    - 5010: Ingeniería de Sistemas e Informática (por defecto)
    - 5011: Ingeniería Forestal y Medio Ambiente
    - 5012: Medicina Veterinaria y Zootecnia
    - N/A: Usuario sin carrera asignada (usuarios antiguos)
    
    **GID (grupos LDAP):**
    - 5000: Alumnos (todos los estudiantes)
    - 6000: Docentes
    """
    script_path = os.path.join(SCRIPT_DIR, "list-users.sh")

    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Script de listado no encontrado: {script_path}")

    try:
        result = subprocess.run(["bash", script_path], capture_output=True, text=True, timeout=10)

        if result.returncode == 0:
            users: list[UserResponse] = []
            for line in result.stdout.strip().split("\n"):
                if not line:
                    continue
                parts = line.split("|")
                if len(parts) >= 9:
                    # Formato: username|codigo|nombres|apellido_p|apellido_m|dni|carrera|email|dn
                    user_carrera = parts[6].strip()
                    
                    # Filtrar por carrera si se especifica
                    if carrera and user_carrera != carrera:
                        continue
                    
                    users.append(UserResponse(
                        username=parts[0].strip(),
                        codigo=parts[1].strip(),
                        nombres=parts[2].strip(),
                        apellido_paterno=parts[3].strip(),
                        apellido_materno=parts[4].strip(),
                        dni=parts[5].strip(),
                        carrera=user_carrera,
                        email=parts[7].strip() if parts[7].strip() else None,
                        dn=parts[8].strip()
                    ))
            return users

        raise HTTPException(status_code=500, detail=f"Error al listar usuarios: {result.stderr}")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al listar usuarios")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# ==========================
# NUEVO: Endpoint list-with-carreras
# ==========================
@router.get("/list-with-carreras", response_model=List[UserWithCarreras])
async def list_users_with_carreras():
    """
    Lista usuarios LDAP e incluye las carreras (grupos) de cada uno.
    
    **Nota:** Este endpoint incluye el campo `carreras` que lista los grupos LDAP
    a los que pertenece cada usuario. Diferente al campo `carrera` que es el código
    de departamento (5001-5012).
    
    **Códigos de Carrera:** Ver documentación en /api/users/list
    """
    base_users = await list_users()

    out: list[UserWithCarreras] = []
    for u in base_users:
        carreras = _ldap_groups_for_user(u.username)
        out.append(UserWithCarreras(
            username=u.username,
            full_name=u.full_name,
            email=u.email,
            dn=u.dn,
            carreras=carreras,
            carrera=carreras[0] if carreras else None
        ))

    return out


@router.delete("/delete", response_model=dict)
async def delete_user(user_data: UserDelete):
    """
    Elimina un usuario de LDAP
    """
    script_path = os.path.join(SCRIPT_DIR, "delete-user.sh")

    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Script de eliminación no encontrado: {script_path}")

    try:
        result = subprocess.run(["bash", script_path, user_data.username], capture_output=True, text=True, timeout=10)

        if result.returncode == 0:
            return {"success": True, "message": f"Usuario {user_data.username} eliminado exitosamente", "username": user_data.username}

        raise HTTPException(status_code=400, detail=f"Error al eliminar usuario: {result.stderr}")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al eliminar usuario")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
