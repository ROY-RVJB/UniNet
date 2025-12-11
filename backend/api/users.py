"""
Endpoints para gestión de usuarios LDAP
Permite crear, listar, modificar y eliminar usuarios
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
import subprocess
import os
from api.auth import get_current_user, User

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


@router.post("/create", response_model=dict)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo usuario en LDAP
    
    Args:
        user_data: Datos del usuario a crear
        current_user: Usuario autenticado (profesor/admin)
    
    Returns:
        Confirmación de creación
    """
    script_path = os.path.join(SCRIPT_DIR, "create-user.sh")
    
    if not os.path.exists(script_path):
        raise HTTPException(
            status_code=500,
            detail=f"Script de creación no encontrado: {script_path}"
        )
    
    try:
        # Ejecutar script de creación
        result = subprocess.run(
            [
                "bash",
                script_path,
                user_data.username,
                user_data.password,
                user_data.full_name,
                user_data.email or ""
            ],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Usuario {user_data.username} creado exitosamente",
                "username": user_data.username,
                "created_by": current_user.username
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error al crear usuario: {result.stderr}"
            )
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout al crear usuario")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/list", response_model=List[UserResponse])
async def list_users(current_user: User = Depends(get_current_user)):
    """
    Lista todos los usuarios LDAP
    
    Args:
        current_user: Usuario autenticado
    
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
    user_data: UserDelete,
    current_user: User = Depends(get_current_user)
):
    """
    Elimina un usuario de LDAP
    
    Args:
        user_data: Username del usuario a eliminar
        current_user: Usuario autenticado
    
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
                "username": user_data.username,
                "deleted_by": current_user.username
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
