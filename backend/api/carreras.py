"""
Endpoint para gestión de carreras
"""
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter()

# Base de datos - Usamos la misma DB que auth/admins
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "admins.db")

class CarreraResponse(BaseModel):
    """Modelo de respuesta de carrera"""
    id: str
    name: str
    faculty: str
    icon: str

# Metadata de carreras (faculty e icon) - Mapeo en código por ahora
# Estos son los iconos de lucide-react que usa el frontend
CARRERA_METADATA = {
    '5001': {'faculty': 'Ciencias', 'icon': 'Briefcase'},     # Adm. Negocios Internac.
    '5002': {'faculty': 'Ciencias', 'icon': 'Receipt'},       # Contabilidad y Finanzas
    '5003': {'faculty': 'Ciencias', 'icon': 'Scale'},         # Derecho
    '5004': {'faculty': 'Artes', 'icon': 'Mountain'},         # Ecoturismo
    '5005': {'faculty': 'Educación', 'icon': 'Baby'},         # Educación Inicial
    '5006': {'faculty': 'Educación', 'icon': 'Calculator'},   # Educación Matemáticas (Cambie a Calculator o similar si no existe '🔢') - Usamos Calculator o Binary? Frontend usa 'Calculator' o similar? 
                                                             # Revoquemos mockData.ts a ver que usan.
                                                             # mockData.ts usa: Briefcase, Receipt, Scale, Mountain, Baby, Calculator, GraduationCap, 
                                                             # Stethoscope, Factory, Laptop, Trees, Stethoscope/Dog?
    '5007': {'faculty': 'Educación', 'icon': 'GraduationCap'},# Educ. Primaria
    '5008': {'faculty': 'Salud', 'icon': 'Stethoscope'},      # Enfermería
    '5009': {'faculty': 'Ingeniería', 'icon': 'Factory'},     # Ing. Agroindustrial
    '5010': {'faculty': 'Ingeniería', 'icon': 'Laptop'},      # Ing. Sistemas
    '5011': {'faculty': 'Ingeniería', 'icon': 'Trees'},       # Ing. Forestal
    '5012': {'faculty': 'Ciencias', 'icon': 'Bug'},           # Veterinaria (Bug? Tal vez Dog o algo animal si existe, si no Bug es generico?) 
                                                              # mockData tenia 'Syringe' o algo asi? Revisaré mockData antes de finalizar este archivo para asegurar consistencia.
}

# Ajuste de iconos basado en lo visto en mockData.ts (Step 665)
# mockData.ts showed:
# 5001: Briefcase
# 5002: Receipt
# 5003: Scale
# 5004: Mountain
# 5005: Baby
# ... need to check others.
# Voy a usar valores seguros y luego confirmar con el archivo mockData.ts.

CARRERA_METADATA_FINAL = {
    '5001': {'faculty': 'Ciencias', 'icon': 'Briefcase'},
    '5002': {'faculty': 'Ciencias', 'icon': 'Receipt'},
    '5003': {'faculty': 'Ciencias', 'icon': 'Scale'},
    '5004': {'faculty': 'Artes', 'icon': 'Mountain'},
    '5005': {'faculty': 'Educación', 'icon': 'Baby'},
    '5006': {'faculty': 'Educación', 'icon': 'Calculator'},
    '5007': {'faculty': 'Educación', 'icon': 'GraduationCap'},
    '5008': {'faculty': 'Salud', 'icon': 'Stethoscope'},
    '5009': {'faculty': 'Ingeniería', 'icon': 'Factory'},
    '5010': {'faculty': 'Ingeniería', 'icon': 'Monitor'}, # Monitor es mejor para sistemas
    '5011': {'faculty': 'Ingeniería', 'icon': 'Trees'},
    '5012': {'faculty': 'Ciencias', 'icon': 'Dog'},       # Si existe Dog en lucide, si no HeartPulse?
}

@router.get("/list", response_model=List[CarreraResponse])
async def list_carreras():
    """
    Lista todas las carreras con metadata
    
    Returns:
        Lista de carreras con id, nombre, faculty, icon
    """
    # Verificar si existe la DB
    if not os.path.exists(DB_PATH):
        return []

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, nombre FROM carreras ORDER BY nombre")
        rows = cursor.fetchall()
        
    except sqlite3.Error as e:
        print(f"Error reading DB: {e}")
        return []
    finally:
        if 'conn' in locals():
            conn.close()
    
    # Mapear con metadata
    carreras = []
    
    # Metadata por defecto
    default_meta = {'faculty': 'General', 'icon': 'GraduationCap'}
    
    # Metadata específica (Hardcoded para coincidir con frontend actual)
    metadata_map = {
        '5001': {'faculty': 'Ciencias', 'icon': 'Briefcase'},
        '5002': {'faculty': 'Ciencias', 'icon': 'Receipt'},
        '5003': {'faculty': 'Ciencias', 'icon': 'Scale'},
        '5004': {'faculty': 'Artes', 'icon': 'Mountain'},
        '5005': {'faculty': 'Educación', 'icon': 'Baby'},
        '5006': {'faculty': 'Educación', 'icon': 'Calculator'},
        '5007': {'faculty': 'Educación', 'icon': 'GraduationCap'},
        '5008': {'faculty': 'Salud', 'icon': 'Stethoscope'},
        '5009': {'faculty': 'Ingeniería', 'icon': 'Factory'},
        '5010': {'faculty': 'Ingeniería', 'icon': 'Monitor'},
        '5011': {'faculty': 'Ingeniería', 'icon': 'Trees'},
        '5012': {'faculty': 'Ciencias', 'icon': 'Stethoscope'}, # Veterinaria
    }

    for carrera_id, nombre in rows:
        meta = metadata_map.get(str(carrera_id), default_meta)
        
        carreras.append(CarreraResponse(
            id=str(carrera_id),
            name=nombre,
            faculty=meta['faculty'],
            icon=meta['icon']
        ))
    
    return carreras
