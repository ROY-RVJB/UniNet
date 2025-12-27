"""
Endpoints de monitoreo de estado de PCs
Sistema de heartbeat para detección de estado en tiempo real
Sistema de auto-registro dinámico de clientes
"""

import subprocess
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

# Estado de clientes en memoria (key: hostname, value: estado completo)
# Auto-registro: cualquier PC que envíe heartbeat se registra automáticamente
clients_state: Dict[str, dict] = {}


class HeartbeatData(BaseModel):
    """Datos recibidos del cliente en cada heartbeat"""
    hostname: str
    ip: str
    user: Optional[str] = None  # Usuario LDAP activo o null
    carrera: Optional[str] = "5010"  # Código de carrera/laboratorio (default: Sistemas)


class HostStatus(BaseModel):
    """Modelo de respuesta para estado de host"""
    id: str
    name: str
    ip: str
    status: str  # 'online', 'offline', 'inUse'
    user: Optional[str] = None
    lastSeen: Optional[str] = None
    carrera: Optional[str] = None  # Código de carrera/laboratorio


@router.post("/heartbeat")
async def receive_heartbeat(data: HeartbeatData):
    """
    Recibe heartbeat de VM cliente con estado actual
    Se ejecuta cada 30 segundos desde el agente del cliente
    
    Sistema de auto-registro:
    - Si el hostname es nuevo, se registra automáticamente
    - Actualiza estado, IP y usuario en cada heartbeat
    
    Args:
        data: Datos del cliente (hostname, ip, usuario activo)
    
    Returns:
        Confirmación de recepción con ID asignado
    """
    # Auto-registro: asignar ID si es nuevo
    if data.hostname not in clients_state:
        # Generar ID basado en cantidad de hosts registrados
        host_id = f"pc-{len(clients_state) + 1:02d}"
        clients_state[data.hostname] = {
            "id": host_id,
            "ip": data.ip,
            "user": data.user,
            "carrera": data.carrera,
            "last_seen": datetime.now(),
            "first_seen": datetime.now()
        }
    else:
        # Actualizar estado existente
        clients_state[data.hostname].update({
            "ip": data.ip,
            "user": data.user,
            "carrera": data.carrera,
            "last_seen": datetime.now()
        })
    
    return {
        "status": "ok", 
        "received_at": datetime.now().isoformat(),
        "host_id": clients_state[data.hostname]["id"]
    }


@router.get("/status")
async def get_status(carrera: Optional[str] = None):
    """
    Obtiene el estado consolidado de todos los clientes registrados
    
    Sistema dinámico: solo muestra PCs que han enviado al menos un heartbeat
    
    Args:
        carrera: Filtrar PCs por código de carrera (ej: 5002 para Contabilidad)
                 Si no se especifica, retorna todas las PCs
    
    Estados:
    - offline: No ha enviado heartbeat en los últimos 60 segundos
    - online: Envía heartbeat pero no tiene usuario activo
    - inUse: Envía heartbeat y tiene sesión de usuario activa
    
    Returns:
        Lista de objetos con información de cada host
    """
    results = []
    now = datetime.now()
    timeout_threshold = timedelta(seconds=60)
    
    # Procesar todos los clientes registrados
    for hostname, state in clients_state.items():
        # Filtrar por carrera si se especificó
        if carrera and state.get("carrera") != carrera:
            continue
            
        time_since_last_seen = now - state["last_seen"]
        is_alive = time_since_last_seen < timeout_threshold
        
        # Determinar estado
        if not is_alive:
            status = "offline"
        elif state["user"]:
            status = "inUse"
        else:
            status = "online"
        
        results.append({
            "id": state["id"],
            "name": hostname,
            "ip": state["ip"],
            "status": status,
            "user": state["user"] if state["user"] else None,
            "lastSeen": state["last_seen"].isoformat(),
            "carrera": state.get("carrera", "5010")
        })
    
    # Ordenar por ID para presentación consistente
    results.sort(key=lambda x: x["id"])
    
    return results


@router.get("/hosts")
async def get_hosts():
    """
    Retorna la lista de todos los hosts registrados (activos e inactivos)
    Compatible con el endpoint anterior pero ahora dinámico
    """
    hosts = []
    for hostname, state in clients_state.items():
        hosts.append({
            "id": state["id"],
            "name": hostname,
            "ip": state["ip"]
        })
    
    hosts.sort(key=lambda x: x["id"])
    return hosts


@router.get("/stats")
async def get_stats():
    """
    Estadísticas generales del sistema de monitoreo
    """
    now = datetime.now()
    timeout_threshold = timedelta(seconds=60)
    
    total = len(clients_state)
    online_count = 0
    in_use_count = 0
    offline_count = 0
    
    for state in clients_state.values():
        time_since_last_seen = now - state["last_seen"]
        is_alive = time_since_last_seen < timeout_threshold
        
        if not is_alive:
            offline_count += 1
        elif state["user"]:
            in_use_count += 1
        else:
            online_count += 1
    
    return {
        "total": total,
        "online": online_count,
        "inUse": in_use_count,
        "offline": offline_count
    }
