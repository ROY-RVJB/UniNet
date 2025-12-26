#!/usr/bin/env python3
"""
UniNet Dashboard - FastAPI Server
Servidor principal que gestiona monitoreo, usuarios LDAP y autenticación
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.monitoring import router as monitoring_router
from api.users import router as users_router
from api.auth import router as auth_router, docentes_router
from api.carrera_logger import carrera_log_middleware
from api import carreras
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
app.include_router(monitoring_router, prefix="/api", tags=["Monitoring"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(docentes_router, prefix="/api/docentes", tags=["Docentes"]) 
app.include_router(carreras.router, prefix="/api/carreras", tags=["Carreras"])
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000, log_level="info")
