"""
Sistema de persistencia con SQLite para UniNet
Almacena: máquinas clientes, logs y reglas de red
"""

import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "uninet.db")

def init_database():
    """Crea las tablas si no existen"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Para acceder por nombre de columna
    cursor = conn.cursor()
    
    # Tabla de máquinas clientes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            hostname TEXT PRIMARY KEY,
            id TEXT NOT NULL,
            ip TEXT NOT NULL,
            user TEXT,
            carrera TEXT NOT NULL DEFAULT '5010',
            last_seen TEXT NOT NULL,
            first_seen TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tabla de reglas de red
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS network_rules (
            gid_carrera TEXT PRIMARY KEY,
            accion TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tabla de logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            level TEXT NOT NULL,
            category TEXT NOT NULL,
            message TEXT NOT NULL,
            carrera TEXT NOT NULL,
            hostname TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Índices para mejorar el rendimiento
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_carrera ON clients(carrera)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_carrera ON logs(carrera)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)")
    
    conn.commit()
    conn.close()
    print(f"✅ Base de datos inicializada: {DB_PATH}")

# ========== FUNCIONES PARA CLIENTES ==========

def save_client(hostname: str, data: dict):
    """Guarda o actualiza un cliente en la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO clients (hostname, id, ip, user, carrera, last_seen, first_seen)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT first_seen FROM clients WHERE hostname = ?), ?))
    """, (
        hostname,
        data['id'],
        data['ip'],
        data.get('user'),
        data.get('carrera', '5010'),
        data['last_seen'].isoformat(),
        hostname,
        data.get('first_seen', data['last_seen']).isoformat()
    ))
    
    conn.commit()
    conn.close()

def load_all_clients() -> Dict[str, dict]:
    """Carga todos los clientes de la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM clients")
    rows = cursor.fetchall()
    conn.close()
    
    clients = {}
    for row in rows:
        clients[row['hostname']] = {
            'id': row['id'],
            'ip': row['ip'],
            'user': row['user'],
            'carrera': row['carrera'],
            'last_seen': datetime.fromisoformat(row['last_seen']),
            'first_seen': datetime.fromisoformat(row['first_seen'])
        }
    
    return clients

def get_client(hostname: str) -> Optional[dict]:
    """Obtiene un cliente específico"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM clients WHERE hostname = ?", (hostname,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row['id'],
            'ip': row['ip'],
            'user': row['user'],
            'carrera': row['carrera'],
            'last_seen': datetime.fromisoformat(row['last_seen']),
            'first_seen': datetime.fromisoformat(row['first_seen'])
        }
    return None

def delete_client(hostname: str):
    """Elimina un cliente (por si acaso lo necesitas)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM clients WHERE hostname = ?", (hostname,))
    conn.commit()
    conn.close()

# ========== FUNCIONES PARA REGLAS DE RED ==========

def save_network_rule(gid_carrera: str, accion: str):
    """Guarda o actualiza una regla de red"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO network_rules (gid_carrera, accion, updated_at)
        VALUES (?, ?, ?)
    """, (gid_carrera, accion, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

def load_network_rules() -> Dict[str, str]:
    """Carga todas las reglas de red"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT gid_carrera, accion FROM network_rules")
    rows = cursor.fetchall()
    conn.close()
    
    return {row['gid_carrera']: row['accion'] for row in rows}

# ========== FUNCIONES PARA LOGS ==========

def save_log(log_entry: dict):
    """Guarda un log en la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO logs (id, timestamp, level, category, message, carrera, hostname)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        log_entry['id'],
        log_entry['timestamp'],
        log_entry['level'],
        log_entry['category'],
        log_entry['message'],
        log_entry['carrera'],
        log_entry.get('hostname')
    ))
    
    conn.commit()
    conn.close()

def load_logs(limit: int = 500, carrera: Optional[str] = None, username: Optional[str] = None) -> List[dict]:
    """Carga logs de la base de datos con filtros opcionales"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT * FROM logs WHERE 1=1"
    params = []
    
    if carrera:
        query += " AND carrera = ?"
        params.append(carrera)
    
    if username:
        query += " AND (message LIKE ? OR hostname LIKE ?)"
        params.extend([f"%{username}%", f"%{username}%"])
    
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def clean_old_logs(days: int = 30):
    """Limpia logs antiguos para mantener la base de datos ligera"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cutoff_date = datetime.now() - timedelta(days=days)
    cursor.execute("DELETE FROM logs WHERE created_at < ?", (cutoff_date.isoformat(),))
    deleted = cursor.rowcount
    
    conn.commit()
    conn.close()
    
    return deleted
