"""
Sistema de autenticación para profesores/administradores
Usa SQLite para almacenar credenciales
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
import os
import uuid

router = APIRouter()

# Configuración JWT
SECRET_KEY = "uninet-dashboard-secret-key-change-in-production"  # TODO: Cambiar en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# Configuración de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "admins.db")


# ============================================================
# MODELOS PYDANTIC
# ============================================================

class Carrera(BaseModel):
    """Modelo de carrera"""
    id: str
    nombre: str


class UserLoginInfo(BaseModel):
    """Info del usuario incluida en respuesta de login"""
    username: str
    role: str
    carreras: List[Carrera] = []


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserLoginInfo | None = None


class TokenData(BaseModel):
    username: str | None = None


class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None
    role: str = "docente"


class UserInDB(User):
    hashed_password: str


class RegisterRequest(BaseModel):
    """Modelo para registro de docentes"""
    username: str
    password: str


class UserResponse(BaseModel):
    """Respuesta de /api/auth/me con role y carreras"""
    username: str
    email: str | None = None
    full_name: str | None = None
    role: str
    carreras: List[Carrera] = []


class DocenteResponse(BaseModel):
    """Respuesta para listado de docentes"""
    id: str
    username: str
    full_name: str | None = None
    email: str | None = None
    carreras: List[Carrera] = []
    created_at: str
    active: bool


class DocenteCreateRequest(BaseModel):
    """Request para crear docente"""
    username: str
    full_name: str
    email: str
    password: str
    carreras: List[str] = []


def init_db():
    """Inicializa la base de datos de administradores"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Crear tabla de usuarios admin
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            email TEXT,
            full_name TEXT,
            disabled BOOLEAN DEFAULT 0,
            role TEXT DEFAULT 'docente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Crear tabla de carreras
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS carreras (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL
        )
    """)

    # Crear tabla de relación docentes_carreras
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS docentes_carreras (
            docente_id INTEGER,
            carrera_id TEXT,
            PRIMARY KEY (docente_id, carrera_id),
            FOREIGN KEY (docente_id) REFERENCES admins(id),
            FOREIGN KEY (carrera_id) REFERENCES carreras(id)
        )
    """)

    # Insertar carreras por defecto
    carreras_default = [
        ('carrera-sistemas', 'Ingeniería de Sistemas e Informática'),
        ('carrera-ambiental', 'Ingeniería Ambiental'),
        ('carrera-forestal', 'Ingeniería Forestal'),
        ('carrera-agroindustrial', 'Ingeniería Agroindustrial'),
        ('carrera-enfermeria', 'Enfermería'),
        ('carrera-contabilidad', 'Contabilidad'),
        ('carrera-administracion', 'Administración'),
        ('carrera-derecho', 'Derecho'),
        ('carrera-educacion', 'Educación')
    ]
    for carrera_id, carrera_nombre in carreras_default:
        try:
            cursor.execute("INSERT INTO carreras (id, nombre) VALUES (?, ?)",
                          (carrera_id, carrera_nombre))
        except sqlite3.IntegrityError:
            pass  # Ya existe

    # Agregar columna role si no existe (migración)
    try:
        cursor.execute("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'docente'")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # La columna ya existe

    # Crear usuario admin por defecto si no existe
    try:
        hashed = pwd_context.hash("admin123")
        cursor.execute("""
            INSERT INTO admins (username, hashed_password, email, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        """, ("admin", hashed, "admin@uninet.com", "Administrador", "admin"))
        conn.commit()
        print("Usuario admin creado (usuario: admin, password: admin123)")
    except sqlite3.IntegrityError:
        # Actualizar role del admin existente
        cursor.execute("UPDATE admins SET role = 'admin' WHERE username = 'admin'")
        conn.commit()

    conn.close()


# Inicializar DB al cargar el módulo
init_db()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña"""
    return pwd_context.hash(password)


def get_user_id(username: str) -> int | None:
    """Obtiene el ID de un usuario"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM admins WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


def get_user_carreras(user_id: int) -> List[Carrera]:
    """Obtiene las carreras asignadas a un usuario"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.nombre
        FROM carreras c
        INNER JOIN docentes_carreras dc ON c.id = dc.carrera_id
        WHERE dc.docente_id = ?
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [Carrera(id=row["id"], nombre=row["nombre"]) for row in rows]


def get_user(username: str) -> UserInDB | None:
    """Obtiene un usuario de la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM admins WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return UserInDB(
            username=row["username"],
            hashed_password=row["hashed_password"],
            email=row["email"],
            full_name=row["full_name"],
            disabled=bool(row["disabled"]),
            role=row["role"] if "role" in row.keys() else "docente"
        )
    return None


def authenticate_user(username: str, password: str) -> UserInDB | bool:
    """Autentica un usuario"""
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Crea un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Obtiene el usuario actual desde el token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint de login para profesores/administradores

    Args:
        form_data: Usuario y contraseña

    Returns:
        Token de acceso JWT con datos del usuario incluidos
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Obtener carreras del usuario para incluir en respuesta
    user_id = get_user_id(user.username)
    carreras = get_user_carreras(user_id) if user_id else []

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "role": user.role,
            "carreras": [{"id": c.id, "nombre": c.nombre} for c in carreras]
        }
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Obtiene la información del usuario autenticado actual con role y carreras"""
    user_id = get_user_id(current_user.username)
    carreras = get_user_carreras(user_id) if user_id else []

    return UserResponse(
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        carreras=carreras
    )


@router.post("/register", response_model=dict)
async def register_docente(
    data: RegisterRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Registra un nuevo docente (solo admin puede hacerlo)

    Args:
        data: username y password del nuevo docente

    Returns:
        Confirmación de registro
    """
    # Solo admin puede crear docentes
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede registrar docentes"
        )

    # Verificar que no exista el usuario
    if get_user(data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{data.username}' ya existe"
        )

    # Crear el docente
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        hashed = get_password_hash(data.password)
        cursor.execute("""
            INSERT INTO admins (username, hashed_password, role)
            VALUES (?, ?, ?)
        """, (data.username, hashed, "docente"))
        conn.commit()
        conn.close()

        return {
            "success": True,
            "message": f"Docente '{data.username}' creado exitosamente",
            "username": data.username
        }
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear docente: {str(e)}"
        )


# ============================================================
# ROUTER DE DOCENTES
# ============================================================

docentes_router = APIRouter()


@docentes_router.get("/list", response_model=List[DocenteResponse])
async def list_docentes(current_user: User = Depends(get_current_user)):
    """Lista todos los docentes con sus carreras asignadas"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, username, full_name, email, created_at, disabled
        FROM admins
        WHERE role = 'docente'
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    docentes = []
    for row in rows:
        carreras = get_user_carreras(row["id"])
        docentes.append(DocenteResponse(
            id=str(row["id"]),
            username=row["username"],
            full_name=row["full_name"],
            email=row["email"],
            carreras=carreras,
            created_at=row["created_at"] or "",
            active=not bool(row["disabled"])
        ))

    return docentes


@docentes_router.post("/create", response_model=dict)
async def create_docente(
    data: DocenteCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Crea un nuevo docente con carreras asignadas (solo admin)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede crear docentes"
        )

    if get_user(data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{data.username}' ya existe"
        )

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        hashed = get_password_hash(data.password)
        cursor.execute("""
            INSERT INTO admins (username, hashed_password, email, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        """, (data.username, hashed, data.email, data.full_name, "docente"))

        docente_id = cursor.lastrowid

        # Asignar carreras
        for carrera_id in data.carreras:
            cursor.execute("""
                INSERT INTO docentes_carreras (docente_id, carrera_id)
                VALUES (?, ?)
            """, (docente_id, carrera_id))

        conn.commit()
        conn.close()

        return {
            "id": str(docente_id),
            "message": "Docente creado"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear docente: {str(e)}"
        )


@docentes_router.delete("/{docente_id}", response_model=dict)
async def delete_docente(
    docente_id: str,
    current_user: User = Depends(get_current_user)
):
    """Elimina un docente (solo admin)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede eliminar docentes"
        )

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Verificar que el docente existe
    cursor.execute("SELECT id, role FROM admins WHERE id = ?", (docente_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    if row[1] == "admin":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un administrador"
        )

    try:
        # Eliminar relaciones con carreras
        cursor.execute("DELETE FROM docentes_carreras WHERE docente_id = ?", (docente_id,))
        # Eliminar docente
        cursor.execute("DELETE FROM admins WHERE id = ?", (docente_id,))
        conn.commit()
        conn.close()

        return {"message": "Docente eliminado"}
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar docente: {str(e)}"
        )
