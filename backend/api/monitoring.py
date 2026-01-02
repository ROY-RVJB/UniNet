# UBICACIÓN: backend/api/monitoring.py

import subprocess
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from fastapi import APIRouter

# Importar funciones de la base de datos
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database import db

router = APIRouter()

# --- 1. CACHÉ EN MEMORIA (para rendimiento) ---
# Al iniciar el servidor, cargamos todo de la BD a memoria
# Pero ahora TODO se guarda en la BD para persistir
clients_state: Dict[str, dict] = {} 
network_rules: Dict[str, str] = {}

def init_cache():
    """Carga datos de la BD a la memoria al iniciar el servidor"""
    global clients_state, network_rules
    clients_state = db.load_all_clients()
    network_rules = db.load_network_rules()
    print(f"📦 Cache inicializado: {len(clients_state)} clientes, {len(network_rules)} reglas")

# --- 2. MODELOS DE DATOS ---

class HeartbeatData(BaseModel):
    hostname: str
    ip: str
    user: Optional[str] = None
    carrera: Optional[str] = "5010" 

class InternetControl(BaseModel):
    gid_carrera: str      # El ID de la carrera (ej: "5010")
    accion: str           # "bloquear" | "desbloquear"

class LogEntry(BaseModel):
    id: str
    timestamp: str
    level: str            # INFO, WARN, ERROR
    category: str         # NETWORK, SYSTEM, AUTH
    message: str
    carrera: str
    hostname: Optional[str] = None

# --- 3. HELPER: SISTEMA DE LOGS ---

def add_log(level, category, message, carrera, hostname=None):
    """Crea un log y lo guarda en la BD"""
    entry = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "level": level,
        "category": category,
        "message": message,
        "carrera": str(carrera),
        "hostname": hostname
    }
    # Guardar en la base de datos
    db.save_log(entry)

# --- 4. ENDPOINTS: CONTROL DE RED (EL BOTÓN DEL PROFESOR) ---

@router.post("/network/control_internet")
async def control_internet_carrera(data: InternetControl):
    """
    El profesor presiona el botón.
    Guardamos la orden en la BD y generamos un LOG GRUPAL.
    """
    # 1. Guardar la regla en memoria Y en la base de datos
    network_rules[data.gid_carrera] = data.accion
    db.save_network_rule(data.gid_carrera, data.accion)
    
    # 2. Generar Log
    if data.accion == "bloquear":
        add_log("WARN", "NETWORK", "🔒 INTERNET BLOQUEADO (Modo Examen)", data.gid_carrera)
    else:
        add_log("INFO", "NETWORK", "✅ INTERNET RESTAURADO (Modo Clase)", data.gid_carrera)

    return {"status": "ok", "msg": f"Orden: {data.accion} para carrera {data.gid_carrera}"}

@router.get("/network/status")
async def get_network_status(carrera: str):
    """Para que el frontend sepa de qué color pintar el botón"""
    estado = network_rules.get(carrera, "desbloquear")
    return {"carrera": carrera, "estado": estado}

# --- 5. ENDPOINTS: LOGS ---

from fastapi import Request

@router.get("/logs", response_model=List[LogEntry])
async def get_logs(carrera: str = None, username: str = None):
    """
    Devuelve los logs filtrados por carrera y/o usuario (username/uid)
    AHORA desde la base de datos
    """
    logs = db.load_logs(limit=500, carrera=carrera, username=username)
    return logs

# --- 6. ENDPOINT PRINCIPAL: HEARTBEAT (MODIFICADO) ---

@router.post("/heartbeat")
async def receive_heartbeat(data: HeartbeatData):
    """
    Recibe estado del PC y RESPONDE si debe bloquear internet.
    AHORA con persistencia en BD.
    """
    now = datetime.now()
    carrera_actual = str(data.carrera)

    # A. Lógica de Auto-Registro y Logs Personales
    if data.hostname not in clients_state:
        # LOG: Nuevo PC detectado
        host_id = f"pc-{len(clients_state) + 1:02d}"
        clients_state[data.hostname] = {
            "id": host_id,
            "ip": data.ip,
            "user": data.user,
            "carrera": carrera_actual,
            "last_seen": now,
            "first_seen": now
        }
        # Guardar en la base de datos
        db.save_client(data.hostname, clients_state[data.hostname])
        add_log("INFO", "SYSTEM", f"🖥️ Nuevo equipo conectado: {data.hostname}", carrera_actual, data.hostname)
    else:
        # Detectar cambio de usuario
        old_user = clients_state[data.hostname].get("user")
        if old_user != data.user and data.user:
            # LOG: Alumno inició sesión
            add_log("INFO", "AUTH", f"👤 Alumno {data.user} inició sesión", carrera_actual, data.hostname)

        # Actualizar estado en memoria
        clients_state[data.hostname].update({
            "ip": data.ip,
            "user": data.user,
            "carrera": carrera_actual,
            "last_seen": now
        })
        # Guardar cambios en la base de datos
        db.save_client(data.hostname, clients_state[data.hostname])
    
    # B. LÓGICA DE BLOQUEO (CRÍTICO)
    # Verificamos si existe una regla de "bloquear" para esta carrera
    regla_actual = network_rules.get(carrera_actual, "desbloquear")
    should_block = (regla_actual == "bloquear")
    
    # C. RESPUESTA AL CLIENTE
    return {
        "status": "ok", 
        "received_at": now.isoformat(),
        "host_id": clients_state[data.hostname]["id"],
        "block_internet": should_block  # <--- ESTA ES LA CLAVE
    }

# --- 7. ENDPOINTS DE ESTADO (VISUALIZACIÓN) ---

@router.get("/status")
async def get_status(carrera: Optional[str] = None):
    """Tu endpoint original de status, adaptado ligeramente"""
    results = []
    now = datetime.now()
    timeout_threshold = timedelta(seconds=15)  # Reducido a 15 segundos para detección rápida
    
    for hostname, state in clients_state.items():
        # Filtro por carrera
        if carrera and str(state.get("carrera")) != str(carrera):
            continue
            
        time_since = now - state["last_seen"]
        is_alive = time_since < timeout_threshold
        
        status_str = "offline"
        if is_alive:
            status_str = "inUse" if state["user"] else "online"
        
        results.append({
            "id": state["id"],
            "name": hostname,
            "ip": state["ip"],
            "status": status_str,
            "user": state["user"],
            "lastSeen": state["last_seen"].isoformat(),
            "carrera": state.get("carrera", "5010")
        })
    
    results.sort(key=lambda x: x["id"])
    return results

@router.get("/stats")
async def get_stats():
    """Tus estadísticas originales"""
    now = datetime.now()
    timeout_threshold = timedelta(seconds=15)  # Reducido a 15 segundos para detección rápida
    
    total = len(clients_state)
    online = 0
    in_use = 0
    offline = 0
    
    for state in clients_state.values():
        is_alive = (now - state["last_seen"]) < timeout_threshold
        if not is_alive:
            offline += 1
        elif state["user"]:
            in_use += 1
        else:
            online += 1
    
    return {"total": total, "online": online, "inUse": in_use, "offline": offline}