"""
Endpoints para gestión de usuarios LDAP
Permite crear, listar, modificar y eliminar usuarios
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
import subprocess
import os

router = APIRouter()

# Rutas a los scripts LDAP
SCRIPT_DIR = os.path.join(os.path.dirname(__file__), "..", "scripts", "ldap")


class UserCreate(BaseModel):
    """Modelo para creación de usuario"""
    username: str = Field(..., min_length=3, max_length=20, pattern="^[a-z0-9]+$")
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=3)
    email: str | None = None


class UserResponse(BaseModel):
    """Modelo de respuesta de usuario"""
    username: str
    full_name: str
    email: str | None = None
    dn: str


class UserDelete(BaseModel):
    """Modelo para eliminación de usuario"""
    username: str


@router.options("/create")
async def create_user_options():
    """Manejo explícito de CORS preflight para /create"""
    return {"message": "OK"}


@router.post("/create", response_model=dict)
async def create_user(
    user_data: UserCreate
):
    """
    Crea un nuevo usuario en LDAP
    
    Args:
        user_data: Datos del usuario a crear
    
    Returns:
        Confirmación de creación
    """
    print(f"\n{'='*60}", flush=True)
    print(f"[CREATE USER] ✅ Endpoint POST /create RECIBIDO", flush=True)
    print(f"[CREATE USER] username={user_data.username}", flush=True)
    print(f"[CREATE USER] full_name={user_data.full_name}", flush=True)
    print(f"[CREATE USER] email={user_data.email}", flush=True)
    print(f"{'='*60}\n", flush=True)
    script_path = os.path.join(SCRIPT_DIR, "create-user.sh")
    
    print(f"[CREATE USER] Script path: {script_path}", flush=True)
    print(f"[CREATE USER] Script exists: {os.path.exists(script_path)}", flush=True)
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=500,
            detail=f"Script de creación no encontrado: {script_path}"
        )
    
    try:
        # Ejecutar script de creación
        print(f"[CREATE USER] 🚀 Ejecutando script...", flush=True)
        print(f"[CREATE USER] Command: bash {script_path} {user_data.username} '{user_data.full_name}' [PASSWORD] {user_data.email or ''}", flush=True)
        
        result = subprocess.run(
            [
                "bash",
                script_path,
                user_data.username,
                user_data.full_name,
                user_data.password,
                user_data.email or ""
            ],
            capture_output=True,
            text=True,
            timeout=30,
            env=os.environ.copy()  # Pasar variables de entorno
        )
        
        print(f"[CREATE USER] ✅ Script terminó con código: {result.returncode}", flush=True)
        print(f"[CREATE USER] STDOUT: {result.stdout}", flush=True)
        print(f"[CREATE USER] STDERR: {result.stderr}", flush=True)
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Usuario {user_data.username} creado exitosamente",
                "username": user_data.username
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error al crear usuario: {result.stderr}"
            )
    
    except subprocess.TimeoutExpired as e:
        print(f"[CREATE USER] ⏱️ TIMEOUT después de 30 segundos", flush=True)
        raise HTTPException(status_code=504, detail="Timeout al crear usuario - el script tardó más de 30 segundos")
    except Exception as e:
        print(f"[CREATE USER] ❌ ERROR: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/list", response_model=List[UserResponse])
async def list_users():
    """
    Lista todos los usuarios LDAP
    
    Returns:
        Lista de usuarios
    """
    script_path = os.path.join(SCRIPT_DIR, "list-users.sh")
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=500,
            detail=f"Script de listado no encontrado: {script_path}"
        )
    
    try:
        result = subprocess.run(
            ["bash", script_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            # Parsear salida del script (formato: username|full_name|email|dn)
            users = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split('|')
                    if len(parts) >= 4:
                        users.append(UserResponse(
                            username=parts[0],
                            full_name=parts[1],
                            email=parts[2] if parts[2] else None,
                            dn=parts[3]
                        ))
            return users
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error al listar usuarios: {result.stderr}"
            )
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al listar usuarios")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.delete("/delete", response_model=dict)
async def delete_user(
    user_data: UserDelete
):
    """
    Elimina un usuario de LDAP
    
    Args:
        user_data: Username del usuario a eliminar
    
    Returns:
        Confirmación de eliminación
    """
    script_path = os.path.join(SCRIPT_DIR, "delete-user.sh")
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=500,
            detail=f"Script de eliminación no encontrado: {script_path}"
        )
    
    try:
        result = subprocess.run(
            ["bash", script_path, user_data.username],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Usuario {user_data.username} eliminado exitosamente",
                "username": user_data.username
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error al eliminar usuario: {result.stderr}"
            )
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al eliminar usuario")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
