#!/usr/bin/env python3
"""
UniNet Dashboard - FastAPI Server
Servidor principal que gestiona monitoreo, usuarios LDAP y autenticación
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse
from pathlib import Path
import os

from api.monitoring import router as monitoring_router
from api.users import router as users_router
from api.auth import router as auth_router, docentes_router
from api.carreras import router as carreras_router

app = FastAPI(
    title="UniNet Dashboard API",
    description="API para gestión de laboratorio de cómputo",
    version="2.0.0",
    redirect_slashes=False
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(docentes_router, prefix="/api/docentes", tags=["Docentes"])
app.include_router(carreras_router, prefix="/api/carreras", tags=["Carreras"]) 

@app.get("/")
async def root():
    return {
        "name": "UniNet Dashboard API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ldap-config")
async def get_ldap_config(request: Request):
    """
    Sirve la configuración LDAP del servidor para clientes
    Lee de /etc/uninet/ldap.conf y /etc/uninet/ldap_admin_pass
    """
    try:
        # Leer configuración LDAP
        ldap_conf = {}
        if os.path.exists("/etc/uninet/ldap.conf"):
            with open("/etc/uninet/ldap.conf", "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        ldap_conf[key.strip()] = value.strip()
        
        # Leer contraseña de admin
        admin_pass = ""
        if os.path.exists("/etc/uninet/ldap_admin_pass"):
            with open("/etc/uninet/ldap_admin_pass", "r") as f:
                admin_pass = f.read().strip()
        
        # Construir respuesta
        if not ldap_conf:
            return {
                "error": "LDAP not configured",
                "message": "Run backend/scripts/ldap/setup.sh first"
            }
        
        # Obtener IP del servidor desde el header Host
        host_header = request.headers.get("host", "")
        if ":" in host_header:
            server_ip = host_header.split(":")[0]
        else:
            server_ip = host_header or request.url.hostname or "localhost"
        
        return {
            "ldap_uri": ldap_conf.get("LDAP_URI", f"ldap://{server_ip}"),
            "ldap_base": ldap_conf.get("LDAP_BASE", "dc=uninet,dc=com"),
            "ldap_admin": ldap_conf.get("LDAP_ADMIN", "cn=admin,dc=uninet,dc=com"),
            "ldap_admin_pass": admin_pass,
            "ldap_groups_base": ldap_conf.get("LDAP_GROUPS_BASE", "ou=groups,dc=uninet,dc=com")
        }
    except Exception as e:
        return {
            "error": "Failed to read LDAP config",
            "message": str(e)
        }


# Endpoints para servir scripts de instalación del agente
SCRIPTS_DIR = Path(__file__).parent.parent / "scripts" / "client"

@app.get("/install", response_class=PlainTextResponse)
async def get_install_script(request: Request):
    """
    Sirve el script de instalación con auto-detección de IP del servidor
    URL: curl -sSL http://IP_SERVIDOR:4000/install | sudo bash
    """
    # Obtener la IP del servidor desde el header Host de la request
    # Este header contiene exactamente lo que el cliente usó en la URL
    host_header = request.headers.get("host", "")
    
    # Separar host y puerto si están presentes (ej: "172.29.137.160:4000" -> "172.29.137.160")
    if ":" in host_header:
        server_host = host_header.split(":")[0]
    else:
        server_host = host_header
    
    # Si no hay host header (no debería pasar), usar fallback
    if not server_host:
        server_host = request.url.hostname or "localhost"
    
    # Leer el template del script de instalación
    install_template_path = SCRIPTS_DIR / "install-client.sh"
    
    if not install_template_path.exists():
        return f"""#!/bin/bash
echo "Error: Script de instalación no encontrado"
echo "Por favor contacte al administrador"
exit 1
"""
    
    # Leer y reemplazar la IP del servidor
    with open(install_template_path, 'r') as f:
        script_content = f.read()
    
    # Reemplazar placeholder con la IP real
    script_content = script_content.replace("{{SERVER_IP}}", server_host)
    
    return script_content


@app.get("/agent", response_class=PlainTextResponse)
async def get_agent_script():
    """
    Sirve el script del agente uninet-agent.sh
    """
    agent_path = SCRIPTS_DIR / "uninet-agent.sh"
    
    if not agent_path.exists():
        return f"""#!/bin/bash
echo "Error: Script del agente no encontrado"
exit 1
"""
    
    with open(agent_path, 'r') as f:
        return f.read()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000, log_level="info")
