# UBICACIÓN: backend/api/monitoring.py

import subprocess
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid

# Importar funciones de la base de datos
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database import db

router = APIRouter()

# --- DICCIONARIO DE TRADUCCIÓN DE ALERTAS ---
# Traduce alertas técnicas de Suricata a mensajes comprensibles
ALERT_TRANSLATIONS = {
    # Alertas de STUN/NAT (tráfico de VPN/videoconferencia) - DESHABILITADAS
    "2016149": {
        "title": "Solicitud de conexión P2P",
        "description": "El equipo está intentando establecer una conexión directa con otro dispositivo (usado por VPN, videollamadas como Zoom/Teams, o aplicaciones P2P)"
    },
    "2016150": {
        "title": "Respuesta de conexión P2P",
        "description": "El equipo recibió confirmación de conexión directa desde otro dispositivo (normal en VPN, videollamadas o aplicaciones P2P)"
    },
    
    # Alertas de User-Agent Go - DESHABILITADAS
    "2024897": {
        "title": "Aplicación Go detectada",
        "description": "Se detectó tráfico de una aplicación escrita en lenguaje Go. Puede ser legítima (Docker, Kubernetes, Tailscale) o sospechosa si no se esperaba"
    },
    "2060251": {
        "title": "Cliente HTTP Go saliente",
        "description": "Una aplicación Go está haciendo peticiones HTTP. Verificar si es una herramienta autorizada (Docker, contenedores, VPN)"
    },
    
    # Alertas de SSH
    "2001219": {
        "title": "Intento de fuerza bruta SSH",
        "description": "⚠️ Se detectaron múltiples intentos fallidos de login SSH. Posible ataque de fuerza bruta"
    },
    "2210044": {
        "title": "Escaneo de puertos SSH",
        "description": "⚠️ Alguien está escaneando el puerto SSH (22). Puede ser reconocimiento antes de un ataque"
    },
    "ssh": {
        "title": "Actividad SSH sospechosa",
        "description": "Tráfico SSH inusual detectado. Verificar si el usuario tiene autorización para acceso remoto"
    },
    
    # Alertas de escaneo de puertos
    "port_scan": {
        "title": "Escaneo de puertos detectado",
        "description": "⚠️ Un dispositivo está escaneando múltiples puertos. Esto puede indicar reconocimiento de red o intento de intrusión"
    },
    "2100366": {
        "title": "Escaneo masivo de puertos",
        "description": "⚠️ Se detectó un escaneo agresivo de puertos. Actividad típica de herramientas como Nmap"
    },
    
    # Alertas de SQL Injection
    "sql": {
        "title": "Intento de inyección SQL",
        "description": "⚠️ Se detectó un patrón de ataque SQL. El equipo puede estar comprometido o alguien está intentando atacar una base de datos"
    },
    "2010937": {
        "title": "Ataque SQL Injection detectado",
        "description": "🚨 CRÍTICO: Se detectó un intento de inyección SQL en tráfico HTTP. Posible compromiso de aplicación web"
    },
    
    # Alertas de ICMP flood
    "icmp": {
        "title": "Tráfico ICMP inusual",
        "description": "Volumen alto de paquetes ping. Puede ser un ataque DoS o simplemente pruebas de red"
    },
    "2100368": {
        "title": "Ataque ICMP Flood",
        "description": "⚠️ Se detectó un flood de paquetes ICMP. Posible ataque de denegación de servicio (DoS)"
    },
    
    # Alertas de DDoS y amplificación
    "2019102": {
        "title": "Escaneo de amplificación SSDP",
        "description": "🚨 CRÍTICO: Intento de ataque DDoS usando amplificación SSDP. El equipo está intentando abusar del protocolo SSDP para amplificar tráfico malicioso"
    },
    "2019103": {
        "title": "Amplificación DNS detectada",
        "description": "🚨 Posible ataque DDoS usando amplificación DNS. Tráfico sospechoso hacia servidores DNS"
    },
    
    # Alertas de DNS sospechoso
    "2063117": {
        "title": "Consulta DNS a dominio abusado",
        "description": "⚠️ Se detectó consulta DNS a azurewebsites.net, dominio frecuentemente abusado por malware. Verificar si es tráfico legítimo o posible infección"
    },
    "2028470": {
        "title": "Consulta DNS sospechosa",
        "description": "⚠️ Consulta DNS a dominio con reputación cuestionable. Puede indicar comunicación con servidores de comando y control (C2)"
    },
    
    # Alertas de malware
    "2012647": {
        "title": "Tráfico de malware detectado",
        "description": "🚨 CRÍTICO: Se detectó comunicación con servidores de malware conocidos. El equipo puede estar infectado"
    },
    "2028371": {
        "title": "Beacon de malware",
        "description": "🚨 CRÍTICO: Se detectó tráfico tipo beacon hacia servidor externo. Indicativo de malware activo (trojan, ransomware, etc.)"
    },
    
    # Alertas de tráfico HTTP sospechoso
    "2221010": {
        "title": "Petición HTTP sospechosa",
        "description": "⚠️ Se detectó una petición HTTP con patrones sospechosos. Posible exploit o reconocimiento"
    },
    
    # Default para alertas desconocidas
    "default": {
        "title": "Actividad de red anómala",
        "description": "Se detectó tráfico de red inusual que requiere revisión. Verificar los detalles técnicos"
    }
}

def translate_alert(signature: str, signature_id: int, category: str = "") -> dict:
    """Traduce una alerta técnica de Suricata a un mensaje comprensible"""
    
    # Buscar por signature_id primero (más específico)
    translation = ALERT_TRANSLATIONS.get(str(signature_id))
    if translation:
        return translation
    
    # Buscar por palabras clave en la signature (orden de prioridad)
    signature_lower = signature.lower()
    category_lower = category.lower() if category else ""
    
    # Patrones críticos primero
    if "dos" in signature_lower or "ddos" in signature_lower or "amplification" in signature_lower:
        return {
            "title": f"Ataque DoS/DDoS detectado",
            "description": f"🚨 CRÍTICO: {signature[:100]}. Posible ataque de denegación de servicio"
        }
    elif "malware" in signature_lower or "trojan" in signature_lower or "ransomware" in signature_lower:
        return {
            "title": "Tráfico de malware",
            "description": f"🚨 CRÍTICO: {signature[:100]}. El equipo puede estar infectado"
        }
    elif "exploit" in signature_lower or "vulnerability" in signature_lower:
        return {
            "title": "Intento de explotación",
            "description": f"⚠️ {signature[:100]}. Intento de aprovechar una vulnerabilidad"
        }
    elif "brute" in signature_lower or ("ssh" in signature_lower and "fail" in signature_lower):
        return {
            "title": "Ataque de fuerza bruta",
            "description": f"⚠️ {signature[:100]}. Múltiples intentos de autenticación"
        }
    elif "scan" in signature_lower or "scanning" in signature_lower:
        return {
            "title": "Escaneo de red detectado",
            "description": f"⚠️ {signature[:100]}. Reconocimiento de puertos o servicios"
        }
    elif "sql" in signature_lower or "injection" in signature_lower:
        return {
            "title": "Intento de inyección SQL",
            "description": f"⚠️ {signature[:100]}. Intento de ataque a base de datos"
        }
    elif "dns" in signature_lower and ("abuse" in signature_lower or "suspicious" in signature_lower):
        return {
            "title": "Consulta DNS sospechosa",
            "description": f"⚠️ {signature[:100]}. Posible comunicación con servidor malicioso"
        }
    elif "flood" in signature_lower or "icmp" in signature_lower:
        return {
            "title": "Flood de tráfico",
            "description": f"⚠️ {signature[:100]}. Volumen alto de paquetes detectado"
        }
    
    # Si no coincide con ningún patrón, usar la firma original como título
    return {
        "title": signature[:60] if len(signature) > 60 else signature,
        "description": f"Alerta: {signature}. Categoría: {category or 'No especificada'}"
    }

# --- 1. CACHÉ EN MEMORIA (para rendimiento) ---
# Al iniciar el servidor, cargamos todo de la BD a memoria
# Pero ahora TODO se guarda en la BD para persistir
clients_state: Dict[str, dict] = {} 
network_rules: Dict[str, str] = {}
security_alerts: List[dict] = []  # Almacén en memoria para alertas de seguridad

def init_cache():
    """Carga datos de la BD a la memoria al iniciar el servidor"""
    global clients_state, network_rules
    clients_state = db.load_all_clients()
    network_rules = db.load_network_rules()
    
    # Las alertas ahora se cargan SIEMPRE desde la BD (no se cachean en memoria)
    # Esto asegura persistencia incluso si el servidor se reinicia
    
    print(f"📦 Cache inicializado: {len(clients_state)} clientes, {len(network_rules)} reglas")
    
    # Contar alertas existentes en la BD
    existing_alerts = db.load_security_alerts(limit=1000)
    print(f"🛡️  {len(existing_alerts)} alertas de seguridad en la base de datos")

# --- 2. MODELOS DE DATOS ---

class CPUMetrics(BaseModel):
    percent: float
    cores: int
    per_core: List[float]
    load_average: List[float]

class RAMMetrics(BaseModel):
    total: int
    used: int
    percent: float
    available: int
    swap_total: int
    swap_used: int
    swap_percent: float

class DiskMetrics(BaseModel):
    total: int
    used: int
    percent: float
    free: int

class NetworkMetrics(BaseModel):
    sent_total: int
    recv_total: int

class ProcessInfo(BaseModel):
    pid: int
    name: str
    user: str
    cpu_percent: float
    mem_percent: float
    mem_mb: float

class SystemMetrics(BaseModel):
    cpu: CPUMetrics
    ram: RAMMetrics
    disk: DiskMetrics
    network: NetworkMetrics
    top_processes: List[ProcessInfo]

class HeartbeatData(BaseModel):
    hostname: str
    ip: str
    user: Optional[str] = None
    carrera: Optional[str] = "5010"
    metrics: Optional[SystemMetrics] = None 

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

class SecurityAlert(BaseModel):
    hostname: str
    ip: str
    user: Optional[str] = None
    carrera: str
    timestamp: str
    signature: str
    severity: int         # 1=crítica, 2=alta, 3=media
    category: Optional[str] = None
    src_ip: str
    dest_ip: str
    protocol: str
    src_port: Optional[int] = None
    dest_port: Optional[int] = None
    signature_id: int

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
        
        # Guardar métricas si están presentes
        if data.metrics:
            clients_state[data.hostname]["metrics"] = data.metrics.dict()
            clients_state[data.hostname]["metrics_timestamp"] = now.isoformat()
        
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
            "carrera": state.get("carrera", "5010"),
            "metrics": state.get("metrics"),  # Incluir métricas si existen
            "metricsTimestamp": state.get("metrics_timestamp")  # Timestamp de las métricas
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


# --- 8. ENDPOINTS DE SEGURIDAD (SURICATA IDS) ---

@router.post("/security/alerts")
async def receive_security_alert(request: Request):
    """Recibe alertas de seguridad de Suricata desde los clientes"""
    
    try:
        # Obtener el body como JSON
        body = await request.json()
        print(f"📥 Recibido: {body}")
        
        # Validar con el modelo
        alert = SecurityAlert(**body)
        
    except Exception as e:
        print(f"❌ Error validando alerta: {e}")
        print(f"❌ Datos recibidos: {body if 'body' in locals() else 'No se pudo leer'}")
        raise
    
    # Mapear severidad de Suricata (1=critical, 2=high, 3=medium) a nuestro sistema
    severity_map = {1: "critical", 2: "high", 3: "medium"}
    severity_str = severity_map.get(alert.severity, "low")
    
    # Traducir la alerta técnica a mensaje comprensible
    translation = translate_alert(alert.signature, alert.signature_id, alert.category or "")
    
    # Crear registro de alerta
    alert_record = {
        "id": f"alert-{uuid.uuid4()}",
        "timestamp": alert.timestamp,
        "pcId": alert.hostname,
        "pcName": alert.hostname,
        "carreraId": alert.carrera,
        "carreraName": "Ingeniería de Sistemas",  # TODO: Mapear desde carrera ID
        "userName": alert.user,
        "severity": severity_str,
        "category": alert.category.lower().replace(" ", "-") if alert.category else "other",
        "title": alert.signature,  # Técnico original
        "friendlyTitle": translation["title"],  # Traducido
        "friendlyDescription": translation["description"],  # Explicación clara
        "description": f"Suricata detected {alert.category or 'suspicious activity'}",
        "sourceIp": alert.src_ip,
        "destIp": alert.dest_ip,
        "protocol": alert.protocol,
        "sourcePort": alert.src_port,
        "destPort": alert.dest_port,
        "signatureId": alert.signature_id,
        "acknowledged": False
    }
    
    # Guardar en la base de datos (persistencia)
    db.save_security_alert(alert_record)
    
    print(f"🛡️  Nueva alerta de seguridad: {translation['title']} - {alert.hostname} ({severity_str})")
    
    return {"status": "ok", "alert_id": alert_record["id"]}


@router.get("/security/alerts")
async def get_security_alerts(
    acknowledged: Optional[bool] = None,
    severity: Optional[str] = None,
    hostname: Optional[str] = None,
    carrera: Optional[str] = None,
    limit: int = Query(default=100, le=1000)
):
    """Obtiene alertas de seguridad desde la base de datos con filtros opcionales"""
    
    # Cargar desde la base de datos (persistente)
    alerts = db.load_security_alerts(
        limit=limit,
        acknowledged=acknowledged,
        severity=severity,
        hostname=hostname,
        carrera=carrera
    )
    
    return alerts


@router.post("/security/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Marca una alerta como revisada"""
    # TODO: Implementar actualización en BD
    return {"status": "ok", "alert_id": alert_id, "message": "Feature pending implementation"}


@router.post("/security/remediation")
async def execute_remediation(payload: dict):
    """Endpoint para ejecutar acciones de remediación"""
    action = payload.get("action")  # 'quarantine' | 'kick' | 'block'
    hostname = payload.get("hostname")
    alert_id = payload.get("alert_id")
    
    if not all([action, hostname]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Guardar la acción pendiente para que el agente la ejecute en el próximo heartbeat
    # TODO: Implementar cola de acciones pendientes
    
    print(f"🚨 Acción de remediación solicitada: {action} en {hostname}")
    
    return {
        "status": "ok",
        "action": action,
        "hostname": hostname,
        "message": f"Action {action} will be executed on next heartbeat"
    }
