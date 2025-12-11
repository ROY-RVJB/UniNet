#!/usr/bin/env python3
"""
UniNet Dashboard - FastAPI Server
Servidor principal que gestiona monitoreo, usuarios LDAP y autenticación
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.monitoring import router as monitoring_router
from api.users import router as users_router
from api.auth import router as auth_router

app = FastAPI(
    title="UniNet Dashboard API",
    description="API para gestión de laboratorio de cómputo",
    version="2.0.0"
)

# Configurar CORS para permitir acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(monitoring_router, prefix="/api", tags=["Monitoring"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])


@app.get("/")
async def root():
    """Endpoint raíz - info del servidor"""
    return {
        "name": "UniNet Dashboard API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check del servidor"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 UniNet Dashboard API - FastAPI Server")
    print("=" * 60)
    print("📡 Servidor iniciado en: http://0.0.0.0:4000")
    print("📖 Documentación API: http://0.0.0.0:4000/docs")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=4000, log_level="info")
