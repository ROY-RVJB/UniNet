"""
Endpoints de monitoreo de estado de PCs
Migrado desde status_server.py
"""

import subprocess
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Lista de hosts a monitorear (4 clientes + servidor)
HOSTS = [
    {"id": "pc-01", "name": "PC-LAB-01", "ip": "172.29.2.37"},
    {"id": "pc-02", "name": "PC-LAB-02", "ip": "172.29.157.94"},
    {"id": "pc-03", "name": "PC-LAB-03", "ip": "172.29.177.20"},
    {"id": "pc-04", "name": "PC-LAB-04", "ip": "172.29.104.181"},
    {"id": "server-01", "name": "SERVIDOR", "ip": "172.29.137.160"},
]


class HostStatus(BaseModel):
    """Modelo de respuesta para estado de host"""
    id: str
    name: str
    ip: str
    alive: bool
    lastSeen: Optional[str] = None


def ping_host(ip: str, timeout: int = 2) -> bool:
    """
    Hace ping a una IP y retorna True si está accesible
    
    Args:
        ip: Dirección IP a verificar
        timeout: Tiempo de espera en segundos
    
    Returns:
        bool: True si el host responde, False en caso contrario
    """
    try:
        # -c 1 = 1 ping, -W timeout en segundos
        result = subprocess.run(
            ["ping", "-c", "1", "-W", str(timeout), ip],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=timeout + 1
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, Exception):
        return False


@router.get("/status", response_model=List[HostStatus])
async def get_status():
    """
    Obtiene el estado actual de todos los hosts monitoreados
    
    Returns:
        Lista de hosts con su estado (alive/dead) y última vez visto
    """
    results = []
    
    for host in HOSTS:
        is_alive = ping_host(host["ip"])
        
        results.append(HostStatus(
            id=host["id"],
            name=host["name"],
            ip=host["ip"],
            alive=is_alive,
            lastSeen=datetime.now().isoformat() if is_alive else None
        ))
    
    return results


@router.get("/hosts")
async def get_hosts():
    """Retorna la lista de hosts configurados sin verificar estado"""
    return HOSTS


@router.get("/ping/{ip}")
async def ping_single_host(ip: str):
    """
    Hace ping a una IP específica
    
    Args:
        ip: Dirección IP a verificar
    
    Returns:
        Estado del host (alive/dead)
    """
    is_alive = ping_host(ip)
    return {
        "ip": ip,
        "alive": is_alive,
        "timestamp": datetime.now().isoformat()
    }
