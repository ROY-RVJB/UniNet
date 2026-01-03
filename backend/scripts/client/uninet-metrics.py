#!/usr/bin/env python3
"""
Script para recolectar métricas del sistema usando psutil.
Usado por uninet-agent.sh para enviar métricas al servidor.
"""
import psutil
import json
import time

try:
    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.5)
    cpu_cores = psutil.cpu_count()
    cpu_per_core = psutil.cpu_percent(interval=0.5, percpu=True)
    load_avg = [x / cpu_cores * 100 for x in psutil.getloadavg()]
    
    # RAM
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    # Disco
    disk = psutil.disk_usage("/")
    
    # Red
    net = psutil.net_io_counters()
    
    # Procesos top (ordenados por CPU + RAM)
    processes = []
    
    # Primera llamada para inicializar cpu_percent
    for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_percent', 'memory_info']):
        try:
            proc.cpu_percent(interval=None)
        except:
            pass
    
    # Esperar para acumular datos de CPU
    time.sleep(0.1)
    
    # Segunda llamada para obtener CPU% real
    all_procs = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_percent', 'memory_info']):
        try:
            cpu = proc.cpu_percent(interval=None)
            all_procs.append({
                'proc': proc,
                'cpu': cpu,
                'mem': proc.info.get('memory_percent', 0) or 0
            })
        except:
            pass
    
    # Ordenar por CPU + RAM combinado
    all_procs.sort(key=lambda p: (p['cpu'] + p['mem']), reverse=True)
    
    # Tomar los top 5 procesos
    for item in all_procs[:5]:
        proc = item['proc']
        try:
            processes.append({
                "pid": proc.info["pid"],
                "name": proc.info["name"],
                "user": proc.info["username"] or "unknown",
                "cpu_percent": round(item['cpu'], 1),
                "mem_percent": round(item['mem'], 1),
                "mem_mb": round((proc.info["memory_info"].rss / 1024 / 1024), 1) if proc.info["memory_info"] else 0
            })
        except:
            pass
    
    # Construir objeto de métricas
    metrics = {
        "cpu": {
            "percent": round(cpu_percent, 1),
            "cores": cpu_cores,
            "per_core": [round(c, 1) for c in cpu_per_core],
            "load_average": [round(l, 2) for l in load_avg]
        },
        "ram": {
            "total": int(mem.total / 1024 / 1024),
            "used": int(mem.used / 1024 / 1024),
            "percent": round(mem.percent, 1),
            "available": int(mem.available / 1024 / 1024),
            "swap_total": int(swap.total / 1024 / 1024),
            "swap_used": int(swap.used / 1024 / 1024),
            "swap_percent": round(swap.percent, 1)
        },
        "disk": {
            "total": int(disk.total / 1024 / 1024),
            "used": int(disk.used / 1024 / 1024),
            "percent": round(disk.percent, 1),
            "free": int(disk.free / 1024 / 1024)
        },
        "network": {
            "sent_total": int(net.bytes_sent / 1024 / 1024),
            "recv_total": int(net.bytes_recv / 1024 / 1024)
        },
        "top_processes": processes
    }
    
    # Imprimir JSON
    print(json.dumps(metrics))
    
except Exception:
    # Si falla, retornar JSON vacío
    print("{}")
