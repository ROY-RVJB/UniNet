# backend/api/carrera_logger.py

import os
import time
import json
import subprocess
from datetime import datetime, timezone
from fastapi import Request

def _read_kv_conf(path: str) -> dict:
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
    logs_conf = _read_kv_conf("/etc/uninet/logs.conf")
    # Usar directorio del proyecto como fallback (más seguro)
    project_log = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "carreras.log")
    return (
        os.environ.get("UNINET_LOG_FILE")
        or logs_conf.get("LOG_FILE")
        or project_log  # Cambiado: usar logs/ dentro del proyecto
    )

def _write_json_line(path: str, obj: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    obj["ts"] = datetime.now(timezone.utc).isoformat()
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def _parse_cn(stdout: str) -> list[str]:
    out = []
    for line in stdout.splitlines():
        line = line.strip()
        if line.lower().startswith("cn:"):
            out.append(line.split(":", 1)[1].strip())
    return out

def _ldap_groups_for_user(username: str) -> list[str]:
    if not username:
        return []

    ldap_conf = _read_kv_conf("/etc/uninet/ldap.conf")
    ldap_uri = ldap_conf.get("LDAP_URI", "ldap://localhost:389")
    ldap_base = ldap_conf.get("LDAP_BASE", "")
    groups_base = ldap_conf.get("LDAP_GROUPS_BASE") or (f"ou=groups,{ldap_base}" if ldap_base else "")

    if not groups_base:
        return []

    # intento anónimo (para evitar problemas de permisos)
    cmd = ["ldapsearch", "-x", "-H", ldap_uri, "-LLL", "-b", groups_base, f"(memberUid={username})", "cn"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if r.returncode == 0:
            return _parse_cn(r.stdout)
    except Exception:
        pass

    return []

async def carrera_log_middleware(request: Request, call_next):
    start = time.time()
    username = request.headers.get("X-Username") or request.headers.get("X-User")

    try:
        response = await call_next(request)
        took = time.time() - start

        carreras = _ldap_groups_for_user(username) if username else []
        carrera = carreras[0] if carreras else None

        _write_json_line(_get_log_file(), {
            "uid": username,
            "carrera": carrera,
            "carreras": carreras,
            "ip": request.client.host if request.client else None,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "took_sec": round(took, 3),
        })

        return response

    except Exception as e:
        took = time.time() - start
        _write_json_line(_get_log_file(), {
            "uid": username,
            "carrera": None,
            "carreras": [],
            "ip": request.client.host if request.client else None,
            "method": request.method,
            "path": request.url.path,
            "status": 500,
            "took_sec": round(took, 3),
            "error": str(e),
        })
        raise
