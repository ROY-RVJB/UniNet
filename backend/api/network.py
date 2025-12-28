import subprocess
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Modelo de datos que recibes del Frontend
class InternetControl(BaseModel):
    gid_carrera: int  # Ej: 5000, 5001, 5002...
    accion: str       # "bloquear" | "desbloquear"

@router.post("/api/network/control_internet")
def control_internet_carrera(data: InternetControl):
    """
    Bloquea o desbloquea internet basándose en el GID de la carrera.
    """
    
    # Validamos rango de seguridad para no bloquear al root (GID 0) o profes
    if data.gid_carrera < 5000:
        raise HTTPException(status_code=400, detail="No permitido bloquear GIDs de sistema (<5000)")

    print(f"🔧 Gestionando internet para GID: {data.gid_carrera} - Acción: {data.accion}")

    try:
        if data.accion == "bloquear":
            # 1. Limpiamos reglas previas de ese GID para no duplicar
            limpiar_reglas(data.gid_carrera)

            # 2. Permitir tráfico a la Intranet/Moodle (Ej: 10.0.0.5) - Opcional pero recomendado
            subprocess.run(
                f"sudo iptables -A OUTPUT -m owner --gid-owner {data.gid_carrera} -d 10.0.0.5 -j ACCEPT",
                shell=True, check=True
            )

            # 3. BLOQUEAR tráfico HTTP (80) y HTTPS (443) para ese GID
            cmds = [
                f"sudo iptables -A OUTPUT -m owner --gid-owner {data.gid_carrera} -p tcp --dport 80 -j DROP",
                f"sudo iptables -A OUTPUT -m owner --gid-owner {data.gid_carrera} -p tcp --dport 443 -j DROP"
            ]
            for cmd in cmds:
                subprocess.run(cmd, shell=True, check=True)

            return {"status": "ok", "msg": f"Internet BLOQUEADO para carrera GID {data.gid_carrera}"}

        elif data.accion == "desbloquear":
            # Simplemente borramos las reglas
            limpiar_reglas(data.gid_carrera)
            return {"status": "ok", "msg": f"Internet ACTIVADO para carrera GID {data.gid_carrera}"}

    except subprocess.CalledProcessError as e:
        print(f"Error en iptables: {e}")
        raise HTTPException(status_code=500, detail="Error aplicando reglas de Firewall")

def limpiar_reglas(gid):
    """Borra cualquier regla de bloqueo existente para ese GID"""
    # Usamos -D (Delete) ignorando errores si no existen
    cmds = [
        f"sudo iptables -D OUTPUT -m owner --gid-owner {gid} -p tcp --dport 80 -j DROP 2>/dev/null",
        f"sudo iptables -D OUTPUT -m owner --gid-owner {gid} -p tcp --dport 443 -j DROP 2>/dev/null",
        f"sudo iptables -D OUTPUT -m owner --gid-owner {gid} -d 10.0.0.5 -j ACCEPT 2>/dev/null"
    ]
    for cmd in cmds:
        subprocess.run(cmd, shell=True, check=False)