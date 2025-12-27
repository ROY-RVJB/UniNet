"""
Endpoints de monitoreo de estado de PCs
Sistema de heartbeat para detección de estado en tiempo real
"""

import subprocess
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

# Estado de clientes en memoria (key: hostname, value: estado)
clients_state: Dict[str, dict] = {}

# Lista de hosts esperados (para inicialización)
EXPECTED_HOSTS = [
    {"id": "pc-01", "name": "PC-LAB-01", "ip": "172.29.2.37"},
    {"id": "pc-02", "name": "PC-LAB-02", "ip": "172.29.157.94"},
    {"id": "pc-03", "name": "PC-LAB-03", "ip": "172.29.177.20"},
    {"id": "pc-04", "name": "PC-LAB-04", "ip": "172.29.104.181"},
]


class HeartbeatData(BaseModel):
    """Datos recibidos del cliente en cada heartbeat"""
    hostname: str
    ip: str
    user: Optional[str] = None  # Usuario LDAP activo o null


class HostStatus(BaseModel):
    """Modelo de respuesta para estado de host"""
    id: str
    name: str
    ip: str
    status: str  # 'online', 'offline', 'inUse'
    user: Optional[str] = None
    lastSeen: Optional[str] = None


@router.post("/heartbeat")
async def receive_heartbeat(data: HeartbeatData):
    """
    Recibe heartbeat de VM cliente con estado actual
    Se ejecuta cada 30 segundos desde el agente del cliente
    
    Args:
        data: Datos del cliente (hostname, ip, usuario activo)
    
    Returns:
        Confirmación de recepción
    """
    clients_state[data.hostname] = {
        "ip": data.ip,
        "user": data.user,
        "last_seen": datetime.now()
    }
    return {"status": "ok", "received_at": datetime.now().isoformat()}


@router.get("/status")
async def get_status():
    """
    Obtiene el estado consolidado de todos los clientes
    
    Estados:
    - offline: No ha enviado heartbeat en los últimos 60 segundos
    - online: Envía heartbeat pero no tiene usuario activo
    - inUse: Envía heartbeat y tiene sesión de usuario activa
    
    Returns:
        Diccionario con hostname como clave y estado como valor
    """
    results = {}
    now = datetime.now()
    timeout_threshold = timedelta(seconds=60)
    
    # Primero agregar todos los hosts esperados como offline
    for expected in EXPECTED_HOSTS:
        hostname = expected["name"]
        results[hostname] = {
            "status": "offline",
            "user": None,
            "last_seen": None,
            "ip": expected["ip"]
        }
    
    # Luego actualizar con los clientes que han enviado heartbeat
    for hostname, state in clients_state.items():
        time_since_last_seen = now - state["last_seen"]
        is_alive = time_since_last_seen < timeout_threshold
        
        # Determinar estado
        if not is_alive:
            status = "offline"
        elif state["user"]:
            status = "inUse"
        else:
            status = "online"
        
        results[hostname] = {
            "status": status,
            "user": state["user"] if state["user"] else None,
            "last_seen": state["last_seen"].isoformat(),
            "ip": state["ip"]
        }
    
    return results


@router.get("/hosts")
async def get_hosts():
    """Retorna la lista de hosts esperados"""
    return EXPECTED_HOSTS
