#!/usr/bin/env python3
"""
Status Server - UniNet Dashboard
Servidor Python que verifica el estado (ping) de las máquinas cliente y el servidor
"""

import json
import subprocess
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Lista de hosts a monitorear (4 clientes + servidor)
HOSTS = [
    {"id": "pc-01", "name": "PC-LAB-01", "ip": "172.29.2.37"},
    {"id": "pc-02", "name": "PC-LAB-02", "ip": "172.29.157.94"},
    {"id": "pc-03", "name": "PC-LAB-03", "ip": "172.29.177.20"},
    {"id": "pc-04", "name": "PC-LAB-04", "ip": "172.29.104.181"},
    {"id": "server-01", "name": "SERVIDOR", "ip": "172.29.137.160"},
]


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


@app.route('/health')
def health():
    """Endpoint de salud del servidor"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


@app.route('/status')
def get_status():
    """
    Endpoint principal: retorna el estado de todos los hosts
    
    Returns:
        JSON con lista de hosts y su estado actual
    """
    results = []
    
    for host in HOSTS:
        is_alive = ping_host(host["ip"])
        
        results.append({
            "id": host["id"],
            "name": host["name"],
            "ip": host["ip"],
            "alive": is_alive,
            "lastSeen": datetime.now().isoformat() if is_alive else None
        })
    
    return jsonify(results)


@app.route('/hosts')
def get_hosts():
    """Retorna la lista de hosts configurados sin verificar estado"""
    return jsonify(HOSTS)


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Status Server - UniNet Dashboard")
    print("=" * 60)
    print(f"📡 Monitoreando {len(HOSTS)} hosts:")
    for h in HOSTS:
        print(f"   - {h['name']}: {h['ip']}")
    print("=" * 60)
    print("🌐 Servidor iniciado en: http://0.0.0.0:4000")
    print("   Endpoints disponibles:")
    print("   - GET /status  → Estado de todos los hosts (con ping)")
    print("   - GET /hosts   → Lista de hosts configurados")
    print("   - GET /health  → Salud del servidor")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=4000, debug=False)
