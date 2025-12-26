# backend/api/logs.py
"""
UniNet - Logs por carrera (JSON)
Este router lee el archivo de logs definido por /etc/uninet/logs.conf (LOG_FILE)
y expone endpoints para filtrar por carrera y/o username.

Requisitos:
- backend/scripts/logs/setup.sh debe crear /etc/uninet/logs.conf con LOG_FILE=...
- El middleware del backend debe escribir líneas JSON al LOG_FILE.
"""

from fastapi import APIRouter, Query
from typing import Optional
import os
import json

router = APIRouter()


def _read_logs_conf(path: str = "/etc/uninet/logs.conf") -> dict:
    conf = {}
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


def _get_log_file() -> str:
    logs_conf = _read_logs_conf()
    # Prioridad: env -> logs.conf -> default
    return (
        os.environ.get("UNINET_LOG_FILE")
        or logs_conf.get("LOG_FILE")
        or "/var/log/uninet/carreras.log"
    )


def _safe_read_last_lines(path: str, limit: int) -> list[str]:
    if not os.path.exists(path):
        return []
    # Lectura simple (laboratorio). Si el archivo crece demasiado, se optimiza.
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    return [ln.strip() for ln in lines[-limit:] if ln.strip()]


@router.get("/logs")
async def get_logs(
    carrera: Optional[str] = Query(default=None),
    username: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=5000),
):
    """
    Devuelve logs (JSON lines) filtrados por carrera o username.
    - carrera: "sistemas" o "administracion"
    - username: "alumno01" (uid)
    - limit: últimas N líneas a revisar (máx 5000)
    """
    log_file = _get_log_file()
    raw = _safe_read_last_lines(log_file, limit=limit)

    out = []
    for ln in raw:
        try:
            obj = json.loads(ln)
        except Exception:
            # Ignorar líneas no-JSON
            continue

        if carrera and obj.get("carrera") != carrera:
            continue
        if username and obj.get("uid") != username:
            continue

        out.append(obj)

    return out


@router.get("/logs/carreras")
async def get_log_carreras(
    limit: int = Query(default=5000, ge=1, le=20000),
):
    """
    Devuelve lista de carreras encontradas en el log (según el campo 'carrera').
    """
    log_file = _get_log_file()
    raw = _safe_read_last_lines(log_file, limit=limit)

    carreras = set()
    for ln in raw:
        try:
            obj = json.loads(ln)
        except Exception:
            continue
        c = obj.get("carrera")
        if c:
            carreras.add(c)

    return sorted(carreras)
